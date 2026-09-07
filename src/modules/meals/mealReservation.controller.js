'use strict';

const {
  generateReservationQr,
  validateReservationQr
} = require('../services/mealReservation.service');

const generateQr = async (req, res) => {
  try {
    const { id } = req.params;

    // JWT middleware'den gelen kullanıcı
    const studentId = req.user.id;

    const result = await generateReservationQr(id, studentId);

    return res.status(200).json({
      success: true,
      message: 'QR kod başarıyla oluşturuldu.',
      data: result
    });
  } catch (error) {
    console.error('QR oluşturma hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const validateQr = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'qrData alanı zorunludur.'
      });
    }

    const result = await validateReservationQr(qrData);

    return res.status(200).json({
      success: true,
      message: 'QR kod başarıyla doğrulandı.',
      data: result
    });
  } catch (error) {
    console.error('QR doğrulama hatası:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateQr,
  validateQr
};