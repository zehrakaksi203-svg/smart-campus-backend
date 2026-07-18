const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
} = require("./attendance.controller");

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Yoklama yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/attendances:
 *   post:
 *     summary: Yeni yoklama kaydı oluştur
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollmentId:
 *                 type: integer
 *                 example: 1
 *               attendanceDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-10-05
 *               status:
 *                 type: string
 *                 example: Present
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Yoklama kaydı oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Faculty"), createAttendance);

/**
 * @swagger
 * /api/v1/attendances:
 *   get:
 *     summary: Tüm yoklama kayıtlarını listele
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yoklama listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllAttendances);

/**
 * @swagger
 * /api/v1/attendances/{id}:
 *   get:
 *     summary: ID'ye göre yoklama kaydı getir
 *     tags: [Attendance]
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
 *         description: Yoklama bilgisi
 *       404:
 *         description: Yoklama kaydı bulunamadı
 */
router.get("/:id", auth, getAttendanceById);

/**
 * @swagger
 * /api/v1/attendances/{id}:
 *   put:
 *     summary: Yoklama kaydını güncelle
 *     tags: [Attendance]
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
 *             properties:
 *               status:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yoklama kaydı güncellendi
 *       404:
 *         description: Yoklama kaydı bulunamadı
 */
router.put("/:id", auth, role("Admin", "Faculty"), updateAttendance);

/**
 * @swagger
 * /api/v1/attendances/{id}:
 *   delete:
 *     summary: Yoklama kaydını sil
 *     tags: [Attendance]
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
 *         description: Yoklama kaydı silindi
 *       404:
 *         description: Yoklama kaydı bulunamadı
 */
router.delete("/:id", auth, role("Admin"), deleteAttendance);

module.exports = router;
