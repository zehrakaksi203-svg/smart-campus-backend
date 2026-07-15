const gradeService = require("./grade.service");

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

const createGrade = async (req, res) => {
  try {
    const result = await gradeService.createGrade(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllGrades = async (req, res) => {
  try {
    const grades = await gradeService.getAllGrades();
    res.status(200).json(grades);
  } catch (error) {
    handleError(res, error);
  }
};

const getGradeById = async (req, res) => {
  try {
    const grade = await gradeService.getGradeById(req.params.id);
    res.status(200).json(grade);
  } catch (error) {
    handleError(res, error);
  }
};

const updateGrade = async (req, res) => {
  try {
    const result = await gradeService.updateGrade(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteGrade = async (req, res) => {
  try {
    const result = await gradeService.deleteGrade(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade
};
