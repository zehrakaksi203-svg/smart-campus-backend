const { Grade, Enrollment, Student, Course } = require("../../../models");

const calculateLetterGrade = (average) => {
  if (average >= 90) return "AA";
  if (average >= 85) return "BA";
  if (average >= 80) return "BB";
  if (average >= 75) return "CB";
  if (average >= 70) return "CC";
  if (average >= 65) return "DC";
  if (average >= 60) return "DD";
  if (average >= 50) return "FD";
  return "FF";
};

const computeGradeFields = ({ midterm, final, makeup }) => {
  const exam = makeup ?? final;
  const average = Number((midterm * 0.4 + exam * 0.6).toFixed(2));
  const letterGrade = calculateLetterGrade(average);
  const status = average >= 60 ? "Passed" : "Failed";

  return { average, letterGrade, status };
};

const createGrade = async ({ enrollmentId, midterm, final, makeup }) => {
  const { average, letterGrade, status } = computeGradeFields({
    midterm,
    final,
    makeup
  });

  const grade = await Grade.create({
    enrollmentId,
    midterm,
    final,
    makeup,
    average,
    letterGrade,
    status
  });

  return {
    message: "Not başarıyla oluşturuldu.",
    grade
  };
};

const getAllGrades = async () => {
  return Grade.findAll({
    include: [
      {
        model: Enrollment,
        as: "enrollment",
        include: [
          {
            model: Student,
            as: "student"
          },
          {
            model: Course,
            as: "course"
          }
        ]
      }
    ]
  });
};

const getGradeById = async (id) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  return grade;
};

const updateGrade = async (id, data) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  const { midterm, final, makeup } = data;
  const { average, letterGrade, status } = computeGradeFields({
    midterm,
    final,
    makeup
  });

  await grade.update({
    ...data,
    average,
    letterGrade,
    status
  });

  return {
    message: "Not güncellendi.",
    grade
  };
};

const deleteGrade = async (id) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  await grade.destroy();

  return {
    message: "Not silindi."
  };
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade
};
