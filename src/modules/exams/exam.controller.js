const examService = require("./exam.service");

const handleError = (res, error) => {
  console.error(error);

  if (error.status) {
    return res.status(error.status).json({
      message: error.message
    });
  }

  res.status(500).json({
    message: error.message
  });
};

const createExam = async (req, res) => {
  try {
    const result = await examService.createExam(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllExams = async (req, res) => {
  try {
    const exams = await examService.getAllExams();
    res.status(200).json(exams);
  } catch (error) {
    handleError(res, error);
  }
};

const getExamById = async (req, res) => {
  try {
    const exam = await examService.getExamById(req.params.id);
    res.status(200).json(exam);
  } catch (error) {
    handleError(res, error);
  }
};

const updateExam = async (req, res) => {
  try {
    const result = await examService.updateExam(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteExam = async (req, res) => {
  try {
    const result = await examService.deleteExam(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam
};
