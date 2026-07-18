const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail
} = require("./auth.controller");

const validate = require("../../middleware/validate");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("./auth.validation");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication API
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Yeni kullanıcı oluştur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Zehra Kakşi
 *               email:
 *                 type: string
 *                 example: zehrakaksi203@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 example: Admin
 *     responses:
 *       201:
 *         description: Kullanıcı oluşturuldu
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   get:
 *     summary: Email doğrula
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email doğrulandı
 */
router.get("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Giriş yap
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: zehrakaksi203@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Başarılı giriş
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Access Token yenile
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Yeni Access Token
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Çıkış yap
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Çıkış başarılı
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Şifre sıfırlama isteği
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: zehrakaksi203@gmail.com
 *     responses:
 *       200:
 *         description: Reset token oluşturuldu
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Şifreyi sıfırla
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Şifre güncellendi
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword
);

module.exports = router;