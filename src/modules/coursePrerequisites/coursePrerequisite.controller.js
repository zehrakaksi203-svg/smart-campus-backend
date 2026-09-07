const prerequisiteService = require("./coursePrerequisite.service");

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

const createPrerequisite = async (req, res) => {
  try {
    const result = await prerequisiteService.createPrerequisite(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllPrerequisites = async (req, res) => {
  try {
    const prerequisites = await prerequisiteService.getAllPrerequisites();
    res.status(200).json(prerequisites);
  } catch (error) {
    handleError(res, error);
  }
};

const getPrerequisitesByCourse = async (req, res) => {
  try {
    const prerequisites = await prerequisiteService.getPrerequisitesByCourse(req.params.courseId);
    res.status(200).json(prerequisites);
  } catch (error) {
    handleError(res, error);
  }
};

const getPrerequisiteById = async (req, res) => {
  try {
    const prerequisite = await prerequisiteService.getPrerequisiteById(req.params.id);
    res.status(200).json(prerequisite);
  } catch (error) {
    handleError(res, error);
  }
};

const deletePrerequisite = async (req, res) => {
  try {
    const result = await prerequisiteService.deletePrerequisite(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createPrerequisite,
  getAllPrerequisites,
  getPrerequisitesByCourse,
  getPrerequisiteById,
  deletePrerequisite
};