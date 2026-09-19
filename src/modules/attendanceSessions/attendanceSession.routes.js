const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const {
  createSession,
  getSessionById,
  closeSession,
  getMySessions,
  getSessionsForStudent,
  checkIn,
  checkInWithQr,
  refreshQrCode,
  getReport,
  getMyAttendance
} = require("./attendanceSession.controller");

/**
 * @swagger
 * tags:
 *   name: AttendanceSessions
 *   description: GPS tabanlı yoklama oturumu API'si
 */

/**
 * @swagger
 * /api/v1/attendance/sessions:
 *   post:
 *     summary: Yoklama oturumu aç (öğretim üyesi)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sectionId
 *               - date
 *               - startTime
 *               - endTime
 *               - latitude
 *               - longitude
 *             properties:
 *               sectionId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 example: "2026-07-22"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *               latitude:
 *                 type: number
 *                 example: 39.9042
 *               longitude:
 *                 type: number
 *                 example: 32.8597
 *               geofenceRadius:
 *                 type: integer
 *                 description: Metre cinsinden izin verilen yarıçap (varsayılan 30)
 *                 example: 30
 *     responses:
 *       201:
 *         description: Oturum açıldı
 *       403:
 *         description: Öğretim üyesi kaydı bulunamadı
 *       404:
 *         description: Section bulunamadı
 */
router.post("/sessions", auth, createSession);

/**
 * @swagger
 * /api/v1/attendance/sessions/my-sessions:
 *   get:
 *     summary: Giriş yapan öğretim üyesinin açtığı oturumlar
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Oturum listesi
 *       403:
 *         description: Öğretim üyesi kaydı bulunamadı
 */
router.get("/sessions/my-sessions", auth, getMySessions);

/**
 * @swagger
 * /api/v1/attendance/sessions/my-available-sessions:
 *   get:
 *     summary: Giriş yapan öğrencinin kayıtlı olduğu derslerin yoklama oturumları
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ders adı ve tarih bilgisiyle oturum listesi
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 */
router.get("/sessions/my-available-sessions", auth, getSessionsForStudent);

/**
 * @swagger
 * /api/v1/attendance/sessions/{id}:
 *   get:
 *     summary: Oturum detaylarını getir
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Oturum detayı
 *       404:
 *         description: Oturum bulunamadı
 */
router.get("/sessions/:id", auth, getSessionById);

/**
 * @swagger
 * /api/v1/attendance/sessions/{id}/close:
 *   put:
 *     summary: Oturumu kapat (öğretim üyesi)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Oturum kapatıldı
 *       403:
 *         description: Bu oturumu kapatma yetkiniz yok
 *       404:
 *         description: Oturum bulunamadı
 */
router.put("/sessions/:id/close", auth, closeSession);

/**
 * @swagger
 * /api/v1/attendance/sessions/{id}/checkin:
 *   post:
 *     summary: GPS ile yoklama ver (öğrenci)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 39.9043
 *               longitude:
 *                 type: number
 *                 example: 32.8598
 *               accuracy:
 *                 type: number
 *                 description: Cihazın GPS doğruluğu (metre)
 *                 example: 5
 *     responses:
 *       201:
 *         description: Yoklama kaydedildi (mesafe aşımında flagged olarak işaretlenir, reddedilmez)
 *       400:
 *         description: Oturum kapalı ya da zaten yoklama verilmiş
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 *       404:
 *         description: Oturum bulunamadı
 */
router.post("/sessions/:id/checkin", auth, checkIn);

/**
 * @swagger
 * /api/v1/attendance/sessions/{id}/refresh-qr:
 *   put:
 *     summary: Oturumun QR kodunu yenile (öğretim üyesi)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: QR kod yenilendi
 *       400:
 *         description: Kapalı oturumun QR kodu yenilenemez
 *       403:
 *         description: Bu oturumun QR kodunu yenileme yetkiniz yok
 *       404:
 *         description: Oturum bulunamadı
 */
router.put("/sessions/:id/refresh-qr", auth, refreshQrCode);

/**
 * @swagger
 * /api/v1/attendance/sessions/checkin-qr/{qrCode}:
 *   post:
 *     summary: QR kod ile yoklama ver (öğrenci, backup yöntem)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: qrCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 39.9043
 *               longitude:
 *                 type: number
 *                 example: 32.8598
 *               accuracy:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Yoklama kaydedildi
 *       400:
 *         description: Oturum kapalı ya da zaten yoklama verilmiş
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 *       404:
 *         description: Geçersiz veya süresi dolmuş QR kod
 */
router.post("/sessions/checkin-qr/:qrCode", auth, checkInWithQr);


/**
 * @swagger
 * /api/v1/attendance/report/{sectionId}:
 *   get:
 *     summary: Bir section için yoklama raporu (öğretim üyesi)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Yoklama raporu (şüpheli/flagged kayıtlar dahil)
 *       404:
 *         description: Section bulunamadı
 */
router.get("/report/:sectionId", auth, role("Admin", "Faculty"), getReport);

/**
 * @swagger
 * /api/v1/attendance/my-attendance:
 *   get:
 *     summary: Giriş yapan öğrencinin yoklama durumu (tüm dersler için)
 *     tags: [AttendanceSessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ders bazında yoklama istatistikleri (OK/Warning/Critical durum etiketiyle)
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 */
router.get("/my-attendance", auth, getMyAttendance);

module.exports = router;