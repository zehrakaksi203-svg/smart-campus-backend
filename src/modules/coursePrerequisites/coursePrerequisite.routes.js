const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const {
  createPrerequisite,
  getAllPrerequisites,
  getPrerequisitesByCourse,
  getPrerequisiteById,
  deletePrerequisite
} = require("./coursePrerequisite.controller");

/**
 * @swagger
 * tags:
 *   name: CoursePrerequisites
 *   description: Ders önkoşulu yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/course-prerequisites:
 *   post:
 *     summary: Derse yeni önkoşul ekle (sadece Admin)
 *     tags: [CoursePrerequisites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - prerequisiteCourseId
 *             properties:
 *               courseId:
 *                 type: integer
 *                 description: Önkoşula sahip olacak ders
 *                 example: 2
 *               prerequisiteCourseId:
 *                 type: integer
 *                 description: Önkoşul olan ders
 *                 example: 1
 *     responses:
 *       201:
 *         description: Önkoşul oluşturuldu
 *       400:
 *         description: Geçersiz istek (döngüsel bağımlılık, kendine referans, ya da zaten var)
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece Admin erişebilir
 *       404:
 *         description: Ders bulunamadı
 */
router.post("/", auth, role("Admin"), createPrerequisite);

/**
 * @swagger
 * /api/v1/course-prerequisites:
 *   get:
 *     summary: Tüm önkoşulları listele
 *     tags: [CoursePrerequisites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Önkoşul listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllPrerequisites);

/**
 * @swagger
 * /api/v1/course-prerequisites/course/{courseId}:
 *   get:
 *     summary: Belirli bir dersin önkoşullarını listele
 *     tags: [CoursePrerequisites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dersin önkoşul listesi
 *       404:
 *         description: Ders bulunamadı
 */
router.get("/course/:courseId", auth, getPrerequisitesByCourse);

/**
 * @swagger
 * /api/v1/course-prerequisites/{id}:
 *   get:
 *     summary: ID'ye göre önkoşul getir
 *     tags: [CoursePrerequisites]
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
 *         description: Önkoşul bilgisi
 *       404:
 *         description: Önkoşul bulunamadı
 */
router.get("/:id", auth, getPrerequisiteById);

/**
 * @swagger
 * /api/v1/course-prerequisites/{id}:
 *   delete:
 *     summary: Önkoşulu sil (sadece Admin)
 *     tags: [CoursePrerequisites]
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
 *         description: Önkoşul silindi
 *       404:
 *         description: Önkoşul bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
router.delete("/:id", auth, role("Admin"), deletePrerequisite);

module.exports = router;