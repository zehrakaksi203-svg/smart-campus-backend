const courseService = require("./course.service");

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

const createCourse = async (req, res) => {
  try {
    const result = await courseService.createCourse(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    handleError(res, error);
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.status(200).json(course);
  } catch (error) {
    handleError(res, error);
  }
};

const updateCourse = async (req, res) => {
  try {
    const result = await courseService.updateCourse(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteCourse = async (req, res) => {
  try {
    const result = await courseService.deleteCourse(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};
