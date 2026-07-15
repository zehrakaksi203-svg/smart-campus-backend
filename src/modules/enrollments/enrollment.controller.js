const enrollmentService = require("./enrollment.service");

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

const createEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.createEnrollment(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.status(200).json(enrollments);
  } catch (error) {
    handleError(res, error);
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(req.params.id);
    res.status(200).json(enrollment);
  } catch (error) {
    handleError(res, error);
  }
};

const updateEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.updateEnrollment(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.deleteEnrollment(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment
};
