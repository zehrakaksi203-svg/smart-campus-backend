const courseSectionService = require("./courseSection.service");

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

const createCourseSection = async (req, res) => {
  try {
    const result = await courseSectionService.createCourseSection(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllCourseSections = async (req, res) => {
  try {
    const result = await courseSectionService.getAllCourseSections();
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getCourseSectionById = async (req, res) => {
  try {
    const result = await courseSectionService.getCourseSectionById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const updateCourseSection = async (req, res) => {
  try {
    const result = await courseSectionService.updateCourseSection(
      req.params.id,
      req.body
    );

    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteCourseSection = async (req, res) => {
  try {
    const result = await courseSectionService.deleteCourseSection(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createCourseSection,
  getAllCourseSections,
  getCourseSectionById,
  updateCourseSection,
  deleteCourseSection
};