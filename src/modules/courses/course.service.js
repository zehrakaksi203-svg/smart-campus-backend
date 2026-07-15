const { Course, Department, Faculty } = require("../../../models");

const courseIncludes = [
  {
    model: Department,
    as: "department",
    attributes: ["id", "name", "code"]
  },
  {
    model: Faculty,
    as: "faculty",
    attributes: [
      "id",
      "employeeNumber",
      "title",
      "specialization"
    ]
  }
];

const createCourse = async (data) => {
  const course = await Course.create(data);

  return {
    message: "Ders başarıyla oluşturuldu.",
    course
  };
};

const getAllCourses = async () => {
  return Course.findAll({
    include: courseIncludes
  });
};

const getCourseById = async (id) => {
  const course = await Course.findByPk(id, {
    include: courseIncludes
  });

  if (!course) {
    throw { status: 404, message: "Ders bulunamadı." };
  }

  return course;
};

const updateCourse = async (id, data) => {
  const course = await Course.findByPk(id);

  if (!course) {
    throw { status: 404, message: "Ders bulunamadı." };
  }

  await course.update(data);

  return {
    message: "Ders güncellendi.",
    course
  };
};

const deleteCourse = async (id) => {
  const course = await Course.findByPk(id);

  if (!course) {
    throw { status: 404, message: "Ders bulunamadı." };
  }

  await course.destroy();

  return {
    message: "Ders silindi."
  };
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
