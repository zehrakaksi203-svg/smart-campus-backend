const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} = require("./course.controller");

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Ders yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Yeni ders oluştur
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentId:
 *                 type: integer
 *                 example: 1
 *               facultyId:
 *                 type: integer
 *                 example: 1
 *               courseCode:
 *                 type: string
 *                 example: CENG301
 *               courseName:
 *                 type: string
 *                 example: Veritabanı Yönetim Sistemleri
 *               credit:
 *                 type: integer
 *                 example: 4
 *               semester:
 *                 type: string
 *                 example: Güz
 *               year:
 *                 type: integer
 *                 example: 2026
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: Active
 *     responses:
 *       201:
 *         description: Ders oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Faculty"), createCourse);

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Tüm dersleri listele
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ders listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllCourses);

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   get:
 *     summary: ID'ye göre ders getir
 *     tags: [Courses]
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
 *         description: Ders bilgisi
 *       404:
 *         description: Ders bulunamadı
 */
router.get("/:id", auth, getCourseById);

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   put:
 *     summary: Dersi güncelle
 *     tags: [Courses]
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
 *               courseName:
 *                 type: string
 *               credit:
 *                 type: integer
 *               semester:
 *                 type: string
 *               year:
 *                 type: integer
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ders güncellendi
 *       404:
 *         description: Ders bulunamadı
 */
router.put("/:id", auth, role("Admin", "Faculty"), updateCourse);

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   delete:
 *     summary: Dersi sil
 *     tags: [Courses]
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
 *         description: Ders silindi
 *       404:
 *         description: Ders bulunamadı
 */
router.delete("/:id", auth, role("Admin"), deleteCourse);

module.exports = router;
