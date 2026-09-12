
const express = require("express");
const auth = require("../../middleware/auth");

const router = express.Router();

const { chat } = require("./ai.controller");

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Smart Campus yapay zeka asistanı
 *     description: NVIDIA AI kullanarak kullanıcıdan gelen mesaja cevap verir.
 *     tags:
 *       - AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Merhaba, derslerim hakkında yardımcı olur musun?"
 *     responses:
 *       200:
 *         description: Yapay zeka cevabı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *       400:
 *         description: Mesaj boş
 *       500:
 *         description: Yapay zeka servisine bağlanırken hata oluştu
 */
router.post("/chat", auth, chat);

module.exports = router;

