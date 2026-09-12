"use strict";
const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const {
  getBalance,
  topup,
  getTransactions,
} = require("./wallet.controller");

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Öğrenci sanal cüzdanı (bakiye, para yükleme, işlem geçmişi)
 */

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Giriş yapan öğrencinin cüzdan bakiyesini getirir
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bakiye bilgisi
 *       403:
 *         description: Öğrenci kaydı bulunamadı
 */
router.get("/balance", auth, getBalance);

/**
 * @swagger
 * /api/v1/wallet/topup:
 *   post:
 *     summary: Cüzdana bakiye yükler (test modu - anında tamamlanır)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               paymentProvider:
 *                 type: string
 *                 example: Test
 *     responses:
 *       200:
 *         description: Bakiye yüklendi
 *       400:
 *         description: Geçersiz tutar
 */
router.post("/topup", auth, topup);

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Giriş yapan öğrencinin cüzdan işlem geçmişi
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: İşlem listesi
 */
router.get("/transactions", auth, getTransactions);

module.exports = router;