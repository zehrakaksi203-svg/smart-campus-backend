const {
  Exam,
  Course,
  Department,
  Faculty
} = require("../../../models");

const examIncludes = [
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

const createExam = async (data) => {
  const exam = await Exam.create(data);

  return {
    message: "Sınav başarıyla oluşturuldu.",
    exam
  };
};

const getAllExams = async () => {
  return Exam.findAll({
    include: examIncludes
  });
};

const getExamById = async (id) => {
  const exam = await Exam.findByPk(id);

  if (!exam) {
    throw { status: 404, message: "Sınav bulunamadı." };
  }

  return exam;
};

const updateExam = async (id, data) => {
  const exam = await Exam.findByPk(id);

  if (!exam) {
    throw { status: 404, message: "Sınav bulunamadı." };
  }

  await exam.update(data);

  return {
    message: "Sınav güncellendi.",
    exam
  };
};

const deleteExam = async (id) => {
  const exam = await Exam.findByPk(id);

  if (!exam) {
    throw { status: 404, message: "Sınav bulunamadı." };
  }

  await exam.destroy();

  return {
    message: "Sınav silindi."
  };
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam
};
