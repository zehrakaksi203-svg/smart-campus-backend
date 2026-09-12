
'use strict';

const express = require('express');
const auth = require('../../middleware/auth');

const router = express.Router();

const {
  generateQr,
  validateQr,
  createMealReservation,
  createMealController,
  getAllMealsController,
  getMyReservationsController,
  cancelReservationController
} = require('./meal.controller');

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Yemek ve QR işlemleri
 */

/**
 * @swagger
 * /api/v1/meals/reservations:
 *   post:
 *     summary: Yemek rezervasyonu oluştur
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mealId
 *             properties:
 *               mealId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Yemek rezervasyonu oluşturuldu
 *       400:
 *         description: Rezervasyon oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/reservations', auth, createMealReservation);

/**
 * @swagger
 * /api/v1/meals/reservations/{id}/qr:
 *   post:
 *     summary: Yemek rezervasyonu için QR kod oluştur
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rezervasyon ID
 *     responses:
 *       200:
 *         description: QR kod başarıyla oluşturuldu
 *       400:
 *         description: Rezervasyon bulunamadı veya QR oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/reservations/:id/qr', auth, generateQr);

/**
 * @swagger
 * /api/v1/meals/reservations/qr/validate:
 *   post:
 *     summary: Yemek rezervasyonu QR kodunu doğrula
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: QR kod okuyucudan gelen veri
 *                 example: '{"reservationId":1,"token":"550e8400-e29b-41d4-a716-446655440000"}'
 *     responses:
 *       200:
 *         description: QR kod başarıyla doğrulandı
 *       400:
 *         description: Geçersiz veya daha önce kullanılmış QR kodu
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/reservations/qr/validate', auth, validateQr);

/**
 * @swagger
 * /api/v1/meals:
 *   get:
 *     summary: Tüm yemekleri listele
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yemek listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/', auth, getAllMealsController);

/**
 * @swagger
 * /api/v1/meals:
 *   post:
 *     summary: Yemek oluştur (Admin)
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - quota
 *               - availableDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tavuklu Salata
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 25
 *               quota:
 *                 type: integer
 *                 example: 100
 *               availableDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-01
 *     responses:
 *       201:
 *         description: Yemek oluşturuldu
 *       400:
 *         description: Yemek oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/', auth, createMealController);

/**
 * @swagger
 * /api/v1/meals/reservations/my:
 *   get:
 *     summary: Giriş yapan öğrencinin yemek rezervasyonlarını listele
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rezervasyon listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/reservations/my', auth, getMyReservationsController);
/**
 * @swagger
 * /api/v1/meals/reservations/{id}:
 *   delete:
 *     summary: Yemek rezervasyonunu iptal et (ücret cüzdana iade edilir)
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rezervasyon ID
 *     responses:
 *       200:
 *         description: Rezervasyon iptal edildi ve ücret iade edildi
 *       400:
 *         description: Rezervasyon bulunamadı veya iptal edilemez
 *       401:
 *         description: Yetkisiz erişim
 */
router.delete('/reservations/:id', auth, cancelReservationController);
module.exports = router;
