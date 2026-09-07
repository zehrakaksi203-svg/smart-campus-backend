const {
  Enrollment,
  Student,
  Course,
  CourseSection,
  User,
  Department,
  Faculty
} = require("../../../models");

const { sequelize } = require("../../../models");

const {
  checkPrerequisites
} = require("../../services/prerequisite.service");

const {
  hasScheduleConflict
} = require("../../services/scheduleConflict.service");

const enrollmentIncludes = [
  {
    model: Student,
    as: "student",
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email"]
      },
      {
        model: Department,
        as: "department",
        attributes: ["id", "name", "code"]
      }
    ]
  },
  {
    model: Course,
    as: "course",
    include: [
      {
        model: Faculty,
        as: "faculty",
        attributes: [
          "id",
          "employeeNumber",
          "title",
          "specialization"
        ],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "fullName", "email"]
          }
        ]
      },
      {
        model: Department,
        as: "department",
        attributes: [
          "id",
          "name",
          "code"
        ]
      }
    ]
  },
  {
    model: CourseSection,
    as: "section",
    attributes: [
      "id",
      "sectionCode",
      "classroom",
      "dayOfWeek",
      "startTime",
      "endTime",
      "capacity",
      "enrolledCount",
      "semester"
    ],
    include: [
      {
        model: Faculty,
        as: "faculty",
        attributes: ["id", "employeeNumber", "title"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "fullName", "email"]
          }
        ]
      }
    ]
  }
];

const createEnrollment = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    // Öğrenci kontrolü
    const student = await Student.findOne({
      where: { userId: data.userId }
    });

    if (!student) {
      throw {
        status: 404,
        message: "Öğrenci bulunamadı."
      };
    }

    // Section kontrolü
    const section = await CourseSection.findByPk(data.sectionId);

    if (!section) {
      throw {
        status: 404,
        message: "Section bulunamadı."
      };
    }

    // Ders kontrolü (Section üzerinden)
    const course = await Course.findByPk(section.courseId);

    if (!course) {
      throw {
        status: 404,
        message: "Ders bulunamadı."
      };
    }

    // Ön koşul kontrolü
    await checkPrerequisites(course.id, student.id);

    // Saat çakışması kontrolü
    await hasScheduleConflict(
      student.id,
      section.id,
      data.semester,
      data.academicYear
    );

    // Aynı derse aktif kayıt kontrolü
    const existingCourseEnrollment = await Enrollment.findOne({
      where: {
        studentId: student.id,
        courseId: course.id,
        status: "Active"
      },
      transaction
    });

    if (existingCourseEnrollment) {
      throw {
        status: 400,
        message: "Bu derse zaten kayıtlısınız."
      };
    }

    // Aynı section'a tekrar kayıt kontrolü
    const existingSectionEnrollment = await Enrollment.findOne({
      where: {
        studentId: student.id,
        sectionId: section.id,
        status: "Active"
      },
      transaction
    });

    if (existingSectionEnrollment) {
      throw {
        status: 400,
        message: "Bu section'a zaten kayıtlısınız."
      };
    }

    // Kontenjan kontrolü
    if (section.enrolledCount >= section.capacity) {
      throw {
        status: 400,
        message: "Section kontenjanı dolu."
      };
    }

    // Kayıt oluştur
    const enrollment = await Enrollment.create(
      {
        studentId: student.id,
        courseId: course.id,
        sectionId: section.id,
        semester: data.semester,
        academicYear: data.academicYear,
        enrollmentDate: new Date(),
        status: "Active"
      },
      { transaction }
    );

    // Kontenjan artır
    await section.update(
      {
        enrolledCount: section.enrolledCount + 1
      },
      { transaction }
    );

    await transaction.commit();

    return {
      message: "Ders kaydı başarıyla oluşturuldu.",
      enrollment
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getAllEnrollments = async () => {
  return Enrollment.findAll({
    include: enrollmentIncludes
  });
};

const getEnrollmentById = async (id) => {
  const enrollment = await Enrollment.findByPk(id, {
    include: enrollmentIncludes
  });

  if (!enrollment) {
    throw { status: 404, message: "Kayıt bulunamadı." };
  }

  return enrollment;
};

const updateEnrollment = async (id, data) => {
  const enrollment = await Enrollment.findByPk(id);

  if (!enrollment) {
    throw { status: 404, message: "Kayıt bulunamadı." };
  }

  await enrollment.update(data);

  return {
    message: "Kayıt güncellendi.",
    enrollment
  };
};

const deleteEnrollment = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const enrollment = await Enrollment.findByPk(id, { transaction });

    if (!enrollment) {
      throw { status: 404, message: "Kayıt bulunamadı." };
    }

    // Dersten çekilme (Drop) yapıldığında section kontenjanını düşür
    const section = await CourseSection.findByPk(enrollment.sectionId, { transaction });
    if (section && section.enrolledCount > 0) {
      await section.update({ enrolledCount: section.enrolledCount - 1 }, { transaction });
    }

    await enrollment.destroy({ transaction });
    await transaction.commit();

    return {
      message: "Ders kaydı başarıyla silindi ve kontenjan güncellendi."
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ==========================================
// PART 2: YENİ EKLENEN METOTLAR
// ==========================================

/**
 * Giriş yapan öğrencinin aktif ders kayıtlarını getirir
 */
const getMyEnrollments = async (userId) => {
  const student = await Student.findOne({ where: { userId } });

  if (!student) {
    throw { status: 404, message: "Öğrenci profili bulunamadı." };
  }

  return Enrollment.findAll({
    where: {
      studentId: student.id,
      status: "Active"
    },
    include: enrollmentIncludes
  });
};

/**
 * Belirli bir section'a (şubeye) kayıtlı öğrencileri getirir (Hoca/Admin için)
 */
const getStudentsBySection = async (sectionId) => {
  return Enrollment.findAll({
    where: {
      sectionId,
      status: "Active"
    },
    include: enrollmentIncludes
  });
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  getMyEnrollments,
  getStudentsBySection
};