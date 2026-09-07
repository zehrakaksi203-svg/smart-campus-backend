'use strict';

const express = require('express');

const router = express.Router();

const {
  generateQr,
  validateQr
} = require('../controllers/mealReservation.controller');

// Öğrencinin kendi rezervasyonu için QR oluştur
router.post('/:id/qr', generateQr);

// QR kodu doğrula ve kullan
router.post('/qr/validate', validateQr);

module.exports = router;