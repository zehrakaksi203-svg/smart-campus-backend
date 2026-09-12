const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendBulkNotification
} = require("./notification.controller");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Bildirim yönetimi API'si
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Giriş yapan kullanıcının bildirimlerini listeler (sayfalama + filtre)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Kategoriye göre filtrele (örn. grade, attendance, event)
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Okunma durumuna göre filtrele
 *     responses:
 *       200:
 *         description: Bildirim listesi (sayfalama bilgisiyle)
 */
router.get("/", auth, getMyNotifications);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Okunmamış bildirim sayısını döner
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sayı
 */
router.get("/unread-count", auth, getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/bulk:
 *   post:
 *     summary: Birden fazla öğrenciye toplu bildirim gönderir (Faculty/Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               title:
 *                 type: string
 *                 example: Not Bilgilendirmesi
 *               message:
 *                 type: string
 *                 example: Vize notunuz sisteme girildi.
 *               type:
 *                 type: string
 *                 example: General
 *     responses:
 *       201:
 *         description: Bildirimler gönderildi
 */
router.post("/bulk", auth, role("Faculty", "Admin"), sendBulkNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Bildirimi okundu olarak işaretler
 *     tags: [Notifications]
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
 *         description: Güncellenmiş bildirim
 */
router.put("/:id/read", auth, markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Tüm bildirimleri okundu olarak işaretler
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sonuç mesajı
 */
router.put("/read-all", auth, markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Bildirimi siler
 *     tags: [Notifications]
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
 *         description: Silme sonucu
 *       404:
 *         description: Bildirim bulunamadı
 */
router.delete("/:id", auth, deleteNotification);

module.exports = router;