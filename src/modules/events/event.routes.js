'use strict';

const express = require('express');
const auth = require('../../middleware/auth');

const router = express.Router();

const {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  registerForEventController,
  cancelRegistrationController,
  getMyRegistrationsController,
  generateQr,
  validateQr,
  exportEventICalController
} = require('./event.controller');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Etkinlik ve QR işlemleri
 */

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Etkinlik oluştur (Faculty)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - eventDate
 *               - location
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *                 example: Bahar Şenliği
 *               description:
 *                 type: string
 *                 example: Kampüs bahar şenliği etkinliği
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-15T18:00:00.000Z
 *               location:
 *                 type: string
 *                 example: Kampüs Amfi Tiyatro
 *               capacity:
 *                 type: integer
 *                 example: 200
 *     responses:
 *       201:
 *         description: Etkinlik başarıyla oluşturuldu
 *       400:
 *         description: Etkinlik oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/', auth, createEventController);

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Tüm etkinlikleri listele
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Etkinlik listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/', auth, getAllEventsController);

/**
 * @swagger
 * /api/v1/events/my-registrations:
 *   get:
 *     summary: Giriş yapan öğrencinin etkinlik kayıtlarını listele
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kayıt listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/my-registrations', auth, getMyRegistrationsController);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Etkinlik detayını getir
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: Etkinlik detayı
 *       400:
 *         description: Etkinlik bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/:id', auth, getEventByIdController);

/**
 * @swagger
 * /api/v1/events/{id}/ical:
 *   get:
 *     summary: Etkinliği .ics (iCal) dosyası olarak dışa aktar
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: .ics dosyası
 *       400:
 *         description: Etkinlik bulunamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/:id/ical', auth, exportEventICalController);

/**
 * @swagger
 * /api/v1/events/registrations:
 *   post:
 *     summary: Etkinliğe kayıt ol (Student)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Etkinliğe kayıt oluşturuldu (veya bekleme listesine eklendi)
 *       400:
 *         description: Kayıt oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/registrations', auth, registerForEventController);

/**
 * @swagger
 * /api/v1/events/registrations/{id}:
 *   delete:
 *     summary: Etkinlik kaydını iptal et (Student) - kontenjan açılırsa bekleme listesinden otomatik terfi tetiklenir
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kayıt ID
 *     responses:
 *       200:
 *         description: Kayıt iptal edildi
 *       400:
 *         description: Kayıt bulunamadı veya iptal edilemedi
 *       401:
 *         description: Yetkisiz erişim
 */
router.delete('/registrations/:id', auth, cancelRegistrationController);

/**
 * @swagger
 * /api/v1/events/registrations/{id}/qr:
 *   post:
 *     summary: Etkinlik kaydı için QR kod oluştur
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kayıt ID
 *     responses:
 *       200:
 *         description: QR kod başarıyla oluşturuldu
 *       400:
 *         description: Kayıt bulunamadı veya QR oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/registrations/:id/qr', auth, generateQr);

/**
 * @swagger
 * /api/v1/events/registrations/qr/validate:
 *   post:
 *     summary: Etkinlik kaydı QR kodunu doğrula
 *     tags: [Events]
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
 *                 example: '{"registrationId":1,"token":"550e8400-e29b-41d4-a716-446655440000"}'
 *     responses:
 *       200:
 *         description: QR kod başarıyla doğrulandı
 *       400:
 *         description: Geçersiz veya daha önce kullanılmış QR kodu
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/registrations/qr/validate', auth, validateQr);

module.exports = router;