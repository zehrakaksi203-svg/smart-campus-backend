const reservationService = require("./reservation.service");

const createReservationController = async (req, res, next) => {
  try {
    const { classroomId, date, startTime, endTime, purpose } = req.body;

    if (!classroomId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "classroomId, date, startTime ve endTime alanları zorunludur."
      });
    }

    const result = await reservationService.createReservation(req.user.id, {
      classroomId,
      date,
      startTime,
      endTime,
      purpose
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

const getAllReservationsController = async (req, res, next) => {
  try {
    const { date, classroomId, userId } = req.query;
    const reservations = await reservationService.getAllReservations({ date, classroomId, userId });
    res.status(200).json(reservations);
  } catch (err) {
    next(err);
  }
};

const getMyReservationsController = async (req, res, next) => {
  try {
    const reservations = await reservationService.getMyReservations(req.user.id);
    res.status(200).json(reservations);
  } catch (err) {
    next(err);
  }
};

const approveReservationController = async (req, res, next) => {
  try {
    const result = await reservationService.approveReservation(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

const rejectReservationController = async (req, res, next) => {
  try {
    const result = await reservationService.rejectReservation(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

const cancelReservationController = async (req, res, next) => {
  try {
    const result = await reservationService.cancelReservation(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

module.exports = {
  createReservationController,
  getAllReservationsController,
  getMyReservationsController,
  approveReservationController,
  rejectReservationController,
  cancelReservationController
};