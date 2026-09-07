const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  getMyEnrollments,       // <-- Eklenen controller metodu
  getStudentsBySection    // <-- Eklenen controller metodu
} = require("./enrollment.controller");

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Ders kayıt (kayıt) yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/enrollments/my-courses:
 *   get:
 *     summary: Öğrencinin kendi kayıtlı derslerini getir
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kayıtlı ders listesi
 */
router.get("/my-courses", auth, role("Student"), getMyEnrollments);

/**
 * @swagger
 * /api/v1/enrollments/students/{sectionId}:
 *   get:
 *     summary: Bir şubeye (section) kayıtlı öğrencileri listele
 *     tags: [Enrollments]
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
 *         description: Öğrenci listesi
 */
router.get("/students/:sectionId", auth, role("Faculty", "Admin"), getStudentsBySection);

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Yeni ders kaydı oluştur (Önkoşul & Çakışma Kontrollü)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               sectionId:
 *                 type: integer
 *                 example: 1
 *               semester:
 *                 type: string
 *                 example: Güz
 *               academicYear:
 *                 type: string
 *                 example: 2026-2027
 *               status:
 *                 type: string
 *                 example: Active
 *     responses:
 *       201:
 *         description: Ders kaydı oluşturuldu
 *       400:
 *         description: Geçersiz istek (Önkoşul veya çakışma hatası)
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Student"), createEnrollment);

/**
 * @swagger
 * /api/v1/enrollments:
 *   get:
 *     summary: Tüm ders kayıtlarını listele
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ders kaydı listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, role("Admin", "Faculty"), getAllEnrollments);

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   get:
 *     summary: ID'ye göre ders kaydı getir
 *     tags: [Enrollments]
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
 *         description: Ders kaydı bilgisi
 *       404:
 *         description: Ders kaydı bulunamadı
 */
router.get("/:id", auth, getEnrollmentById);

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   put:
 *     summary: Ders kaydını güncelle
 *     tags: [Enrollments]
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
 *               semester:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ders kaydı güncellendi
 *       404:
 *         description: Ders kaydı bulunamadı
 */
router.put("/:id", auth, role("Admin"), updateEnrollment);

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   delete:
 *     summary: Ders kaydını sil / dersten çekil (Drop)
 *     tags: [Enrollments]
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
 *         description: Ders kaydı silindi
 *       404:
 *         description: Ders kaydı bulunamadı
 */
router.delete("/:id", auth, role("Admin", "Student"), deleteEnrollment);

module.exports = router;