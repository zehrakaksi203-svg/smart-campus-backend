const attendanceService = require("./attendance.service");

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

const createAttendance = async (req, res) => {
  try {
    const result = await attendanceService.createAttendance(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllAttendances = async (req, res) => {
  try {
    const attendances = await attendanceService.getAllAttendances();
    res.status(200).json(attendances);
  } catch (error) {
    handleError(res, error);
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.id);
    res.status(200).json(attendance);
  } catch (error) {
    handleError(res, error);
  }
};

const updateAttendance = async (req, res) => {
  try {
    const result = await attendanceService.updateAttendance(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const result = await attendanceService.deleteAttendance(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
};
