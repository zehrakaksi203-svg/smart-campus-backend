const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} = require("./department.controller");

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Bölüm yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Yeni bölüm oluştur
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bilgisayar Mühendisliği
 *               code:
 *                 type: string
 *                 example: CENG
 *               description:
 *                 type: string
 *                 example: Bilgisayar Mühendisliği Bölümü
 *               facultyName:
 *                 type: string
 *                 example: Mühendislik Fakültesi
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Bölüm oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin"), createDepartment);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Tüm bölümleri listele
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bölüm listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllDepartments);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: ID'ye göre bölüm getir
 *     tags: [Departments]
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
 *         description: Bölüm bilgisi
 *       404:
 *         description: Bölüm bulunamadı
 */
router.get("/:id", auth, getDepartmentById);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Bölümü güncelle
 *     tags: [Departments]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               facultyName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bölüm güncellendi
 *       404:
 *         description: Bölüm bulunamadı
 */
router.put("/:id", auth, role("Admin"), updateDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Bölümü sil
 *     tags: [Departments]
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
 *         description: Bölüm silindi
 *       404:
 *         description: Bölüm bulunamadı
 */
router.delete("/:id", auth, role("Admin"), deleteDepartment);

module.exports = router;
