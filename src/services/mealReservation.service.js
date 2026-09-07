'use strict';

const QRCode = require('qrcode');
const crypto = require('crypto');

const { MealReservation, Meal } = require('../models');

async function generateReservationQr(reservationId, studentId) {
  const reservation = await MealReservation.findOne({
    where: {
      id: reservationId,
      studentId
    }
  });

  if (!reservation) {
    throw new Error('Rezervasyon bulunamadı.');
  }

  if (reservation.status !== 'Reserved') {
    throw new Error('Bu rezervasyon aktif değil.');
  }

  if (reservation.qrUsed) {
    throw new Error('Bu rezervasyonun QR kodu daha önce kullanılmış.');
  }

  const token = crypto.randomUUID();

  const qrData = JSON.stringify({
    reservationId: reservation.id,
    token
  });

  const qrCode = await QRCode.toDataURL(qrData);

  await reservation.update({
    qrCode
  });

  return {
    reservationId: reservation.id,
    qrCode
  };
}

async function validateReservationQr(qrData) {
  let data;

  try {
    data = JSON.parse(qrData);
  } catch (error) {
    throw new Error('Geçersiz QR kodu.');
  }

  if (!data.reservationId || !data.token) {
    throw new Error('Geçersiz QR verisi.');
  }

  const reservation = await MealReservation.findByPk(
    data.reservationId
  );

  if (!reservation) {
    throw new Error('Rezervasyon bulunamadı.');
  }

  if (reservation.status !== 'Reserved') {
    throw new Error('Bu rezervasyon aktif değil.');
  }

  if (reservation.qrUsed) {
    throw new Error('Bu QR kod daha önce kullanılmış.');
  }

  if (!reservation.qrCode) {
    throw new Error('Bu rezervasyon için QR kod oluşturulmamış.');
  }

  const expectedQrData = JSON.stringify({
    reservationId: reservation.id,
    token: data.token
  });

  const expectedQrCode = await QRCode.toDataURL(expectedQrData);

  if (expectedQrCode !== reservation.qrCode) {
    throw new Error('Geçersiz veya değiştirilmiş QR kodu.');
  }

  await reservation.update({
    qrUsed: true,
    status: 'Used'
  });

  return {
    success: true,
    reservation
  };
}

module.exports = {
  generateReservationQr,
  validateReservationQr
};