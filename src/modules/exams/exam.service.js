
const { Op } = require("sequelize");

const {
  Exam,
  Course,
  Department,
  Faculty,
  Enrollment,
  Student
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
    throw {
      status: 404,
      message: "Sınav bulunamadı."
    };
  }

  return exam;
};

const updateExam = async (id, data) => {
  const exam = await Exam.findByPk(id);

  if (!exam) {
    throw {
      status: 404,
      message: "Sınav bulunamadı."
    };
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
    throw {
      status: 404,
      message: "Sınav bulunamadı."
    };
  }

  await exam.destroy();

  return {
    message: "Sınav silindi."
  };
};

const getMyExams = async (userId) => {
  const student = await Student.findOne({
    where: { userId }
  });

  if (!student) {
    throw {
      status: 404,
      message: "Öğrenci profili bulunamadı."
    };
  }

  const enrollments = await Enrollment.findAll({
    where: {
      studentId: student.id,
      status: "Active"
    },
    attributes: ["courseId"]
  });

  const courseIds = enrollments.map(
    (enrollment) => enrollment.courseId
  );

  if (courseIds.length === 0) {
    return [];
  }

  return Exam.findAll({
    where: {
      courseId: {
        [Op.in]: courseIds
      }
    },
    include: examIncludes,
    order: [
      ["examDate", "ASC"],
      ["startTime", "ASC"]
    ]
  });
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  getMyExams
};
