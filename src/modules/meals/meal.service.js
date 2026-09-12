'use strict';
const { debitWallet, refundWallet } = require("../wallet/wallet.service");
const QRCode = require('qrcode');
const crypto = require('crypto');

const { MealReservation, Meal } = require('../../../models');

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

async function createMeal(data) {
    const meal = await Meal.create({
      name: data.name,
      description: data.description,
      price: data.price,
      quota: data.quota,
      availableDate: data.availableDate,
      isActive: data.isActive ?? true
    });
  
    return meal;
  }

  async function createReservation({ studentId, mealId }) {
    const meal = await Meal.findByPk(mealId);
  
    if (!meal) {
      throw new Error('Yemek bulunamadı.');
    }
  
    if (!meal.isActive) {
      throw new Error('Bu yemek aktif değil.');
    }

    // Ücreti cüzdandan düş (bakiye yetersizse debitWallet hata fırlatır)
    await debitWallet(
      studentId,
      meal.price,
      `Yemek rezervasyonu: ${meal.name}`
    );
  
    const reservation = await MealReservation.create({
      studentId,
      mealId,
      reservationDate: new Date(),
      status: 'Reserved',
      qrUsed: false
    });
  
    return reservation;
  }


  async function getAllMeals() {
    const meals = await Meal.findAll({
      order: [['availableDate', 'ASC']]
    });
  
    return meals;
  }
  
  async function getMyReservations(studentId) {
    const reservations = await MealReservation.findAll({
      where: { studentId },
      include: [{ model: Meal, as: 'meal' }],
      order: [['createdAt', 'DESC']]
    });
  
    return reservations;
  }
  async function cancelReservation(reservationId, studentId) {
    const reservation = await MealReservation.findOne({
      where: { id: reservationId, studentId },
      include: [{ model: Meal, as: 'meal' }]
    });
  
    if (!reservation) {
      throw new Error('Rezervasyon bulunamadı.');
    }
  
    if (reservation.status !== 'Reserved') {
      throw new Error('Bu rezervasyon iptal edilemez.');
    }
  
    await refundWallet(
      studentId,
      reservation.meal.price,
      `İptal iadesi: ${reservation.meal.name}`
    );
  
    await reservation.update({ status: 'Cancelled' });
  
    return reservation;
  }
  
    module.exports = {
      generateReservationQr,
      validateReservationQr,
      createReservation,
      createMeal,
      getAllMeals,
      getMyReservations,
      cancelReservation
    };