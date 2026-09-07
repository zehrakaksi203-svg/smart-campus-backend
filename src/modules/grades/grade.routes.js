const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getMyGrades,
  getTranscript,
  getTranscriptPdf,
  notifySectionGrades   // <-- Eklenen metot
} = require("./grade.controller");
/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: Not yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/grades/my-grades:
 *   get:
 *     summary: Öğrencinin kendi notlarını listele
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Öğrencinin not listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/my-grades", auth, role("Student"), getMyGrades);

/**
 * @swagger
 * /api/v1/grades/transcript:
 *   get:
 *     summary: Öğrencinin transkript verisini JSON olarak al
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transkript detayları ve CGPA
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/transcript", auth, role("Student"), getTranscript);

/**
 * @swagger
 * /api/v1/grades/transcript/pdf:
 *   get:
 *     summary: Resmi transkript belgesini PDF olarak indir
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transkript PDF dosyası
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/transcript/pdf", auth, role("Student"), getTranscriptPdf);

/**
 * @swagger
 * /api/v1/grades:
 *   post:
 *     summary: Yeni not kaydı oluştur
 *     tags: [Grades]
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
 *               midterm:
 *                 type: number
 *                 example: 70
 *               final:
 *                 type: number
 *                 example: 85
 *               makeup:
 *                 type: number
 *               average:
 *                 type: number
 *                 example: 79
 *               letterGrade:
 *                 type: string
 *                 example: BA
 *               status:
 *                 type: string
 *                 example: Passed
 *     responses:
 *       201:
 *         description: Not kaydı oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Faculty"), createGrade);

/**
 * @swagger
 * /api/v1/grades:
 *   get:
 *     summary: Tüm not kayıtlarını listele
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Not kaydı listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, role("Admin", "Faculty"), getAllGrades);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   get:
 *     summary: ID'ye göre not kaydı getir
 *     tags: [Grades]
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
 *         description: Not kaydı bilgisi
 *       404:
 *         description: Not kaydı bulunamadı
 */
router.get("/:id", auth, getGradeById);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   put:
 *     summary: Not kaydını güncelle
 *     tags: [Grades]
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
 *               midterm:
 *                 type: number
 *               final:
 *                 type: number
 *               makeup:
 *                 type: number
 *               average:
 *                 type: number
 *               letterGrade:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Not kaydı güncellendi
 *       404:
 *         description: Not kaydı bulunamadı
 */
router.put("/:id", auth, role("Admin", "Faculty"), updateGrade);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   delete:
 *     summary: Not kaydını sil
 *     tags: [Grades]
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
 *         description: Not kaydı silindi
 *       404:
 *         description: Not kaydı bulunamadı
 */


/**
 * @swagger
 * /api/v1/grades/notify-section/{sectionId}:
 *   post:
 *     summary: Bir section'daki notu girilmiş tüm öğrencilere toplu bildirim gönder
 *     tags: [Grades]
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
 *         description: Bildirimler gönderildi
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/notify-section/:sectionId", auth, role("Admin", "Faculty"), notifySectionGrades);
router.delete("/:id", auth, role("Admin"), deleteGrade);

module.exports = router;