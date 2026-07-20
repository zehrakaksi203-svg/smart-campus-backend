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
  }
];
const createEnrollment = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    // Öğrenci kontrolü
    const student = await Student.findByPk(data.studentId);

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
  const enrollment = await Enrollment.findByPk(id);

  if (!enrollment) {
    throw { status: 404, message: "Kayıt bulunamadı." };
  }

  await enrollment.destroy();

  return {
    message: "Kayıt silindi."
  };
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
};
