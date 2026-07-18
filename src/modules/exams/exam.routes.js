const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam
} = require("./exam.controller");

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Sınav yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/exams:
 *   post:
 *     summary: Yeni sınav oluştur
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: integer
 *                 example: 1
 *               examType:
 *                 type: string
 *                 example: Vize
 *               examDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-11-10
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               endTime:
 *                 type: string
 *                 example: "11:30"
 *               classroom:
 *                 type: string
 *                 example: A-204
 *               status:
 *                 type: string
 *                 example: Scheduled
 *     responses:
 *       201:
 *         description: Sınav oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Faculty"), createExam);

/**
 * @swagger
 * /api/v1/exams:
 *   get:
 *     summary: Tüm sınavları listele
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sınav listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllExams);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   get:
 *     summary: ID'ye göre sınav getir
 *     tags: [Exams]
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
 *         description: Sınav bilgisi
 *       404:
 *         description: Sınav bulunamadı
 */
router.get("/:id", auth, getExamById);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   put:
 *     summary: Sınavı güncelle
 *     tags: [Exams]
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
 *               examDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               classroom:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sınav güncellendi
 *       404:
 *         description: Sınav bulunamadı
 */
router.put("/:id", auth, role("Admin", "Faculty"), updateExam);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   delete:
 *     summary: Sınavı sil
 *     tags: [Exams]
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
 *         description: Sınav silindi
 *       404:
 *         description: Sınav bulunamadı
 */
router.delete("/:id", auth, role("Admin"), deleteExam);

module.exports = router;
