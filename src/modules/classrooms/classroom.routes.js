const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom
} = require("./classroom.controller");

/**
 * @swagger
 * tags:
 *   name: Classrooms
 *   description: Derslik/sınıf yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/classrooms:
 *   post:
 *     summary: Yeni sınıf oluştur (sadece Admin)
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - building
 *               - roomNumber
 *               - capacity
 *               - latitude
 *               - longitude
 *             properties:
 *               building:
 *                 type: string
 *                 example: B Blok
 *               roomNumber:
 *                 type: string
 *                 example: "101"
 *               capacity:
 *                 type: integer
 *                 example: 40
 *               latitude:
 *                 type: number
 *                 example: 39.9042
 *               longitude:
 *                 type: number
 *                 example: 32.8597
 *               featuresJson:
 *                 type: object
 *                 example: { "projector": true, "smartBoard": false }
 *     responses:
 *       201:
 *         description: Sınıf oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Sadece Admin erişebilir
 */
router.post("/", auth, role("Admin"), createClassroom);

/**
 * @swagger
 * /api/v1/classrooms:
 *   get:
 *     summary: Tüm sınıfları listele
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sınıf listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllClassrooms);

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   get:
 *     summary: ID'ye göre sınıf getir
 *     tags: [Classrooms]
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
 *         description: Sınıf bilgisi
 *       404:
 *         description: Sınıf bulunamadı
 */
router.get("/:id", auth, getClassroomById);

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   put:
 *     summary: Sınıfı güncelle (sadece Admin)
 *     tags: [Classrooms]
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
 *               building:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               featuresJson:
 *                 type: object
 *     responses:
 *       200:
 *         description: Sınıf güncellendi
 *       404:
 *         description: Sınıf bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
router.put("/:id", auth, role("Admin"), updateClassroom);

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   delete:
 *     summary: Sınıfı sil (sadece Admin)
 *     tags: [Classrooms]
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
 *         description: Sınıf silindi
 *       404:
 *         description: Sınıf bulunamadı
 *       403:
 *         description: Sadece Admin erişebilir
 */
router.delete("/:id", auth, role("Admin"), deleteClassroom);

module.exports = router;