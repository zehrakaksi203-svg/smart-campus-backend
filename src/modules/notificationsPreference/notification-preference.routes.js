const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth");

const {
  getPreferences,
  updatePreferences
} = require("./notification-preference.controller");

/**
 * @swagger
 * tags:
 *   name: Notification Preferences
 *   description: Bildirim tercihleri API'si
 */

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   get:
 *     summary: Kullanıcının bildirim tercihlerini getir
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bildirim tercihleri başarıyla getirildi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get("/preferences", auth, getPreferences);

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: Kullanıcının bildirim tercihlerini güncelle
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *                 example: true
 *               push:
 *                 type: boolean
 *                 example: true
 *               sms:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Bildirim tercihleri başarıyla güncellendi
 *       401:
 *         description: Yetkisiz erişim
 */
router.put("/preferences", auth, updatePreferences);

module.exports = router;