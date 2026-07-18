const { CourseSection, Course, Faculty } = require("../../../models");

const createCourseSection = async (data) => {
  const section = await CourseSection.create(data);

  return {
    message: "Section başarıyla oluşturuldu.",
    section
  };
};

const getAllCourseSections = async () => {
  return CourseSection.findAll({
    include: [
      {
        model: Course,
        as: "course"
      },
      {
        model: Faculty,
        as: "faculty"
      }
    ]
  });
};

const getCourseSectionById = async (id) => {
  const section = await CourseSection.findByPk(id, {
    include: [
      {
        model: Course,
        as: "course"
      },
      {
        model: Faculty,
        as: "faculty"
      }
    ]
  });

  if (!section) {
    throw {
      status: 404,
      message: "Section bulunamadı."
    };
  }

  return section;
};

const updateCourseSection = async (id, data) => {
  const section = await CourseSection.findByPk(id);

  if (!section) {
    throw {
      status: 404,
      message: "Section bulunamadı."
    };
  }

  await section.update(data);

  return {
    message: "Section güncellendi.",
    section
  };
};

const deleteCourseSection = async (id) => {
  const section = await CourseSection.findByPk(id);

  if (!section) {
    throw {
      status: 404,
      message: "Section bulunamadı."
    };
  }

  await section.destroy();

  return {
    message: "Section silindi."
  };
};

module.exports = {
  createCourseSection,
  getAllCourseSections,
  getCourseSectionById,
  updateCourseSection,
  deleteCourseSection
};