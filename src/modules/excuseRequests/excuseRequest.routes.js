const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  createExcuseRequest,
  getAllExcuseRequests,
  getMyExcuseRequests,
  getExcuseRequestById,
  approveExcuseRequest,
  rejectExcuseRequest,
  deleteExcuseRequest
} = require("./excuseRequest.controller");

/**
 * @swagger
 * tags:
 *   name: ExcuseRequests
 *   description: Mazeret talebi API'si
 */

/**
 * @swagger
 * /api/v1/attendance/excuse-requests:
 *   post:
 *     summary: Mazeret talebi oluştur (öğrenci)
 *     tags: [ExcuseRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - reason
 *             properties:
 *               sessionId:
 *                 type: integer
 *                 example: 1
 *               reason:
 *                 type: string
 *                 example: "Sağlık raporu nedeniyle derse katılamadım."
 *               documentUrl:
 *                 type: string
 *                 example: "/uploads/rapor.pdf"
 *     responses:
 *       201:
 *         description: Mazeret talebi oluşturuldu
 *       400:
 *         description: Bu oturum için zaten talep var
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 *       404:
 *         description: Oturum bulunamadı
 */
router.post("/", auth, role("Student"), createExcuseRequest);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests:
 *   get:
 *     summary: Tüm mazeret taleplerini listele (öğretim üyesi / admin)
 *     tags: [ExcuseRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mazeret talebi listesi
 */
router.get("/", auth, role("Faculty", "Admin"), getAllExcuseRequests);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests/my-requests:
 *   get:
 *     summary: Giriş yapan öğrencinin mazeret talepleri
 *     tags: [ExcuseRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mazeret talebi listesi
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 */
// NOT: Express routing çakışmasını önlemek için /my-requests rotası /:id rotasından ÖNCE olmalıdır.
router.get("/my-requests", auth, role("Student"), getMyExcuseRequests);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests/{id}:
 *   get:
 *     summary: ID'ye göre mazeret talebi getir
 *     tags: [ExcuseRequests]
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
 *         description: Mazeret talebi bilgisi
 *       404:
 *         description: Mazeret talebi bulunamadı
 */
router.get("/:id", auth, getExcuseRequestById);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests/{id}/approve:
 *   put:
 *     summary: Mazeret talebini onayla (öğretim üyesi / admin)
 *     tags: [ExcuseRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Rapor uygun görüldü."
 *     responses:
 *       200:
 *         description: Mazeret talebi onaylandı
 *       400:
 *         description: Talep zaten değerlendirilmiş
 *       403:
 *         description: Öğretim üyesi kaydı bulunamadı
 *       404:
 *         description: Mazeret talebi bulunamadı
 */
router.put("/:id/approve", auth, role("Faculty", "Admin"), approveExcuseRequest);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests/{id}/reject:
 *   put:
 *     summary: Mazeret talebini reddet (öğretim üyesi / admin)
 *     tags: [ExcuseRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Belge yetersiz."
 *     responses:
 *       200:
 *         description: Mazeret talebi reddedildi
 *       400:
 *         description: Talep zaten değerlendirilmiş
 *       403:
 *         description: Öğretim üyesi kaydı bulunamadı
 *       404:
 *         description: Mazeret talebi bulunamadı
 */
router.put("/:id/reject", auth, role("Faculty", "Admin"), rejectExcuseRequest);

/**
 * @swagger
 * /api/v1/attendance/excuse-requests/{id}:
 *   delete:
 *     summary: Mazeret talebini sil (öğretim üyesi / admin)
 *     tags: [ExcuseRequests]
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
 *         description: Mazeret talebi silindi
 *       404:
 *         description: Mazeret talebi bulunamadı
 */
router.delete("/:id", auth, role("Faculty", "Admin"), deleteExcuseRequest);

module.exports = router;
