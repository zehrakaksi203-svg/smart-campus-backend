'use strict';

const express = require('express');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');

const router = express.Router();

const {
  generateScheduleController,
  getScheduleController
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

module.exports = router;