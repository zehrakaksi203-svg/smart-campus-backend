const { Reservation, Classroom, User } = require("../../../models");
const { Op } = require("sequelize");

const reservationIncludes = [
  { model: Classroom, as: "classroom" },
  { model: User, as: "user", attributes: ["id", "fullName", "email"] },
  { model: User, as: "approver", attributes: ["id", "fullName", "email"] }
];

// İki zaman aralığı çakışıyor mu kontrol eder ("HH:mm" formatında string karşılaştırması yeterli)
const timeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

const createReservation = async (userId, { classroomId, date, startTime, endTime, purpose }) => {
  const classroom = await Classroom.findByPk(classroomId);
  if (!classroom) {
    throw { status: 404, message: "Derslik bulunamadı." };
  }

  if (startTime >= endTime) {
    throw { status: 400, message: "Başlangıç saati bitiş saatinden önce olmalıdır." };
  }

  // Aynı derslik, aynı tarih için onaylanmış veya bekleyen rezervasyonlarla çakışma kontrolü
  const existingReservations = await Reservation.findAll({
    where: {
      classroomId,
      date,
      status: { [Op.in]: ["Pending", "Approved"] }
    }
  });

  const hasConflict = existingReservations.some((r) =>
    timeOverlap(startTime, endTime, r.startTime, r.endTime)
  );

  if (hasConflict) {
    throw { status: 409, message: "Bu derslik seçilen tarih ve saat aralığında zaten rezerve edilmiş veya onay bekliyor." };
  }

  const reservation = await Reservation.create({
    classroomId,
    userId,
    date,
    startTime,
    endTime,
    purpose,
    status: "Pending"
  });

  return {
    message: "Rezervasyon talebi oluşturuldu, onay bekleniyor.",
    reservation
  };
};

const getAllReservations = async ({ date, classroomId, userId } = {}) => {
  const where = {};
  if (date) where.date = date;
  if (classroomId) where.classroomId = classroomId;
  if (userId) where.userId = userId;

  return Reservation.findAll({
    where,
    include: reservationIncludes,
    order: [["date", "ASC"], ["startTime", "ASC"]]
  });
};

const getMyReservations = async (userId) => {
  return Reservation.findAll({
    where: { userId },
    include: reservationIncludes,
    order: [["date", "ASC"], ["startTime", "ASC"]]
  });
};

const approveReservation = async (id, approverId) => {
  const reservation = await Reservation.findByPk(id);
  if (!reservation) {
    throw { status: 404, message: "Rezervasyon bulunamadı." };
  }

  if (reservation.status !== "Pending") {
    throw { status: 400, message: "Bu rezervasyon zaten değerlendirilmiş." };
  }

  await reservation.update({ status: "Approved", approvedBy: approverId });

  return { message: "Rezervasyon onaylandı.", reservation };
};

const rejectReservation = async (id, approverId) => {
  const reservation = await Reservation.findByPk(id);
  if (!reservation) {
    throw { status: 404, message: "Rezervasyon bulunamadı." };
  }

  if (reservation.status !== "Pending") {
    throw { status: 400, message: "Bu rezervasyon zaten değerlendirilmiş." };
  }

  await reservation.update({ status: "Rejected", approvedBy: approverId });

  return { message: "Rezervasyon reddedildi.", reservation };
};

const cancelReservation = async (id, userId) => {
  const reservation = await Reservation.findByPk(id);
  if (!reservation) {
    throw { status: 404, message: "Rezervasyon bulunamadı." };
  }

  if (reservation.userId !== userId) {
    throw { status: 403, message: "Bu rezervasyonu iptal etme yetkiniz yok." };
  }

  if (reservation.status === "Rejected") {
    throw { status: 400, message: "Reddedilmiş bir rezervasyon iptal edilemez." };
  }

  await reservation.update({ status: "Cancelled" });

  return { message: "Rezervasyon iptal edildi.", reservation };
};

module.exports = {
  createReservation,
  getAllReservations,
  getMyReservations,
  approveReservation,
  rejectReservation,
  cancelReservation
};