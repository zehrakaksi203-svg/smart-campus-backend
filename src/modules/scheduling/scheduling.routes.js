'use strict';

const express = require('express');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');

const router = express.Router();

const {
  generateScheduleController,
  getScheduleController,
  getMyScheduleController,
  exportMyScheduleIcalController
} = require('./scheduling.controller');

/**
 * @swagger
 * tags:
 *   name: Scheduling
 *   description: Ders programı oluşturma ve görüntüleme
 */

/**
 * @swagger
 * /api/v1/scheduling/generate:
 *   post:
 *     summary: Belirtilen dönem için otomatik ders programı oluştur (Admin)
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - semester
 *             properties:
 *               semester:
 *                 type: string
 *                 example: 2026-Guz
 *     responses:
 *       200:
 *         description: Program başarıyla oluşturuldu
 *       400:
 *         description: Program oluşturulamadı
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Bu işlem için yetkiniz yok
 */
router.post('/generate', auth, role('Admin'), generateScheduleController);

/**
 * @swagger
 * /api/v1/scheduling:
 *   get:
 *     summary: Ders programını görüntüle
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtrelenecek dönem (opsiyonel)
 *     responses:
 *       200:
 *         description: Ders programı
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/', auth, getScheduleController);
/**
 * @swagger
 * /api/v1/scheduling/my-schedule:
 *   get:
 *     summary: Giriş yapan kullanıcının (öğrenci/öğretim üyesi) kişisel haftalık programı
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kişisel program
 */
router.get('/my-schedule', auth, getMyScheduleController);

/**
 * @swagger
 * /api/v1/scheduling/my-schedule/ical:
 *   get:
 *     summary: Kişisel programı .ics (iCalendar) dosyası olarak indir
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: .ics dosyası
 */
router.get('/my-schedule/ical', auth, exportMyScheduleIcalController);

module.exports = router;