const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} = require("./announcement.controller");

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Duyuru yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/announcements:
 *   post:
 *     summary: Yeni duyuru oluştur
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facultyId:
 *                 type: integer
 *                 example: 1
 *               departmentId:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Vize Sınavı Tarihleri
 *               content:
 *                 type: string
 *                 example: Vize sınavları 10-15 Kasım tarihleri arasında yapılacaktır.
 *               publishDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-10-20
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-11-15
 *               status:
 *                 type: string
 *                 example: Active
 *     responses:
 *       201:
 *         description: Duyuru oluşturuldu
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, role("Admin", "Faculty"), createAnnouncement);

/**
 * @swagger
 * /api/v1/announcements:
 *   get:
 *     summary: Tüm duyuruları listele
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Duyuru listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/", auth, getAllAnnouncements);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   get:
 *     summary: ID'ye göre duyuru getir
 *     tags: [Announcements]
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
 *         description: Duyuru bilgisi
 *       404:
 *         description: Duyuru bulunamadı
 */
router.get("/:id", auth, getAnnouncementById);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   put:
 *     summary: Duyuruyu güncelle
 *     tags: [Announcements]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Duyuru güncellendi
 *       404:
 *         description: Duyuru bulunamadı
 */
router.put("/:id", auth, role("Admin", "Faculty"), updateAnnouncement);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   delete:
 *     summary: Duyuruyu sil
 *     tags: [Announcements]
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
 *         description: Duyuru silindi
 *       404:
 *         description: Duyuru bulunamadı
 */
router.delete("/:id", auth, role("Admin"), deleteAnnouncement);

module.exports = router;
