
'use strict';

const express = require('express');
const auth = require('../../middleware/auth');
const router = express.Router();

const {
  getDashboardController,
  getAcademicPerformanceController,
  getAttendanceAnalyticsController,
  getMealUsageAnalyticsController,
  getEventAnalyticsController,
  exportAnalyticsController
} = require('./analytics.controller');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Admin analitik ve raporlama
 */

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Admin dashboard istatistikleri
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard istatistikleri
 *       403:
 *         description: Yetkisiz erişim
 */
router.get('/dashboard', auth, getDashboardController);

/**
 * @swagger
 * /api/v1/analytics/academic-performance:
 *   get:
 *     summary: Akademik performans istatistikleri (GPA, not dağılımı, başarı oranları)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Akademik performans istatistikleri
 *       403:
 *         description: Yetkisiz erişim
 */
router.get(
  '/academic-performance',
  auth,
  getAcademicPerformanceController
);

/**
 * @swagger
 * /api/v1/analytics/attendance:
 *   get:
 *     summary: Yoklama analitiği (derse göre oran, trend, kritik devamsızlık)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yoklama analitik verisi
 *       403:
 *         description: Yetkisiz erişim
 */
router.get('/attendance', auth, getAttendanceAnalyticsController);

/**
 * @swagger
 * /api/v1/analytics/meal-usage:
 *   get:
 *     summary: Yemek kullanım analitiği (günlük sayı, gelir, yoğun saatler, popüler yemekler)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yemek kullanım analitik verisi
 *       403:
 *         description: Yetkisiz erişim
 */
router.get('/meal-usage', auth, getMealUsageAnalyticsController);

/**
 * @swagger
 * /api/v1/analytics/events:
 *   get:
 *     summary: Etkinlik analitiği (popüler etkinlikler, kayıt/check-in oranları)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Etkinlik analitik verisi
 *       403:
 *         description: Yetkisiz erişim
 */
router.get('/events', auth, getEventAnalyticsController);

/**
 * @swagger
 * /api/v1/analytics/export/{type}:
 *   get:
 *     summary: Analytics verisini Excel, PDF veya CSV olarak dışa aktar
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academic, attendance, meal, event]
 *         description: Dışa aktarılacak rapor tipi
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [excel, pdf, csv]
 *           default: excel
 *         description: Dosya formatı
 *     responses:
 *       200:
 *         description: Rapor dosyası
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Geçersiz rapor tipi veya format
 *       403:
 *         description: Yetkisiz erişim
 */
router.get(
  '/export/:type',
  auth,
  exportAnalyticsController
);

module.exports = router;
