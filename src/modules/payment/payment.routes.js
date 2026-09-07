"use strict";
const express = require("express");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const router = express.Router();
const {
  createPaymentController,
  payPaymentController,
  createCheckoutSessionController,
  getMyPaymentsController,
  getAllPaymentsController,
} = require("./payment.controller");

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Ödeme oluşturma, Stripe ile ödeme ve görüntüleme
 */

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Yeni ödeme kaydı oluştur (harç, yemek, etkinlik)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               studentId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [Tuition, Meal, Event]
 *               referenceId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ödeme kaydı oluşturuldu
 *       400:
 *         description: Eksik veya hatalı veri
 *       401:
 *         description: Yetkisiz erişim
 */
router.post("/", auth, createPaymentController);

/**
 * @swagger
 * /api/v1/payments/{id}/pay:
 *   post:
 *     summary: Ödemeyi simüle olarak tamamla (Stripe olmadan hızlı test için)
 *     tags: [Payment]
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
 *         description: Ödeme tamamlandı
 */
router.post("/:id/pay", auth, payPaymentController);

/**
 * @swagger
 * /api/v1/payments/{id}/checkout-session:
 *   post:
 *     summary: Bu ödeme için Stripe Checkout Session oluşturur ve ödeme sayfası URL'ini döner
 *     tags: [Payment]
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
 *         description: Stripe Checkout URL'i
 *       404:
 *         description: Ödeme kaydı bulunamadı
 */
router.post("/:id/checkout-session", auth, createCheckoutSessionController);

/**
 * @swagger
 * /api/v1/payments/my:
 *   get:
 *     summary: Giriş yapan öğrencinin ödeme geçmişi
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ödeme listesi
 */
router.get("/my", auth, getMyPaymentsController);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Tüm ödemeleri listele (Admin/Faculty)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ödeme listesi
 */
router.get("/", auth, role("Admin", "Faculty"), getAllPaymentsController);

module.exports = router;