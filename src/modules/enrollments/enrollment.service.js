const {
  Enrollment,
  Student,
  Course,
  User,
  Department,
  Faculty
} = require("../../../models");

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
  const enrollment = await Enrollment.create(data);

  return {
    message: "Ders kaydı başarıyla oluşturuldu.",
    enrollment
  };
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
