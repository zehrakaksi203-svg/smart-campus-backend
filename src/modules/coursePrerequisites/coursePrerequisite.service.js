const { CoursePrerequisite, Course } = require("../../../models");

// courseId dersinin (dolaylı olarak da) prerequisiteCourseId'ye bağımlı olup olmadığını kontrol eder.
// Yeni bir kayıt eklemeden önce, prerequisiteCourseId -> ... -> courseId şeklinde bir zincir var mı diye bakar.
// Böyle bir zincir varsa, courseId'yi prerequisiteCourseId'nin önkoşulu yapmak bir döngü oluşturur.
const wouldCreateCycle = async (courseId, prerequisiteCourseId) => {
  if (courseId === prerequisiteCourseId) {
    return true;
  }

  const visited = new Set();
  const queue = [prerequisiteCourseId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (currentId === courseId) {
      return true;
    }

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const links = await CoursePrerequisite.findAll({
      where: { courseId: currentId }
    });

    for (const link of links) {
      queue.push(link.prerequisiteCourseId);
    }
  }

  return false;
};

const createPrerequisite = async ({ courseId, prerequisiteCourseId }) => {
  if (courseId === prerequisiteCourseId) {
    throw { status: 400, message: "Bir ders kendi önkoşulu olamaz." };
  }

  const course = await Course.findByPk(courseId);
  if (!course) {
    throw { status: 404, message: "Ders bulunamadı." };
  }

  const prerequisiteCourse = await Course.findByPk(prerequisiteCourseId);
  if (!prerequisiteCourse) {
    throw { status: 404, message: "Önkoşul dersi bulunamadı." };
  }

  const existing = await CoursePrerequisite.findOne({
    where: { courseId, prerequisiteCourseId }
  });
  if (existing) {
    throw { status: 400, message: "Bu önkoşul zaten tanımlı." };
  }

  const createsCycle = await wouldCreateCycle(courseId, prerequisiteCourseId);
  if (createsCycle) {
    throw { status: 400, message: "Bu önkoşul döngüsel bir bağımlılık oluşturur." };
  }

  const prerequisite = await CoursePrerequisite.create({
    courseId,
    prerequisiteCourseId
  });

  return {
    message: "Önkoşul başarıyla oluşturuldu.",
    prerequisite
  };
};

const getAllPrerequisites = async () => {
  return CoursePrerequisite.findAll({
    include: [
      { model: Course, as: "course" },
      { model: Course, as: "prerequisiteCourse" }
    ]
  });
};

const getPrerequisitesByCourse = async (courseId) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw { status: 404, message: "Ders bulunamadı." };
  }

  return CoursePrerequisite.findAll({
    where: { courseId },
    include: [{ model: Course, as: "prerequisiteCourse" }]
  });
};

const getPrerequisiteById = async (id) => {
  const prerequisite = await CoursePrerequisite.findByPk(id, {
    include: [
      { model: Course, as: "course" },
      { model: Course, as: "prerequisiteCourse" }
    ]
  });

  if (!prerequisite) {
    throw { status: 404, message: "Önkoşul bulunamadı." };
  }

  return prerequisite;
};

const deletePrerequisite = async (id) => {
  const prerequisite = await CoursePrerequisite.findByPk(id);

  if (!prerequisite) {
    throw { status: 404, message: "Önkoşul bulunamadı." };
  }

  await prerequisite.destroy();

  return {
    message: "Önkoşul silindi."
  };
};

module.exports = {
  wouldCreateCycle,
  createPrerequisite,
  getAllPrerequisites,
  getPrerequisitesByCourse,
  getPrerequisiteById,
  deletePrerequisite
};