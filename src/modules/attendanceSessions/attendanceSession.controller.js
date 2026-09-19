const attendanceSessionService = require("./attendanceSession.service");

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

const createSession = async (req, res) => {
  try {
    const result = await attendanceSessionService.createSession(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await attendanceSessionService.getSessionById(req.params.id);
    res.status(200).json(session);
  } catch (error) {
    handleError(res, error);
  }
};

const closeSession = async (req, res) => {
  try {
    const result = await attendanceSessionService.closeSession(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await attendanceSessionService.getMySessions(req.user.id);
    res.status(200).json(sessions);
  } catch (error) {
    handleError(res, error);
  }
};

const checkIn = async (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
    const result = await attendanceSessionService.checkIn(req.user.id, req.params.id, req.body, clientIp);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const refreshQrCode = async (req, res) => {
  try {
    const result = await attendanceSessionService.refreshQrCode(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const checkInWithQr = async (req, res) => {
  try {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;
    const result = await attendanceSessionService.checkInWithQr(req.user.id, req.params.qrCode, req.body, clientIp);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};





const getReport = async (req, res) => {
  try {
    const report = await attendanceSessionService.getReport(req.params.sectionId);
    res.status(200).json(report);
  } catch (error) {
    handleError(res, error);
  }
};
const getSessionsForStudent = async (req, res) => {
  try {
    const sessions = await attendanceSessionService.getSessionsForStudent(req.user.id);
    res.status(200).json(sessions);
  } catch (error) {
    handleError(res, error);
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const attendance = await attendanceSessionService.getMyAttendance(req.user.id);
    res.status(200).json(attendance);
  } catch (error) {
    handleError(res, error);
  }
};
module.exports = {
  createSession,
  getSessionById,
  closeSession,
  getMySessions,
  getSessionsForStudent,
  checkIn,
  checkInWithQr,
  refreshQrCode,
  getReport,
  getMyAttendance
};