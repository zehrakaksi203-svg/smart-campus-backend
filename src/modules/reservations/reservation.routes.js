"use strict";
const express = require("express");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const router = express.Router();

const {
  createReservationController,
  getAllReservationsController,
  getMyReservationsController,
  approveReservationController,
  rejectReservationController,
  cancelReservationController
} = require("./reservation.controller");

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Derslik/laboratuvar rezervasyon talepleri ve onay akışı
 */

/**
 * @swagger
 * /api/v1/reservations:
 *   post:
 *     summary: Derslik rezervasyon talebi oluştur
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classroomId
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               classroomId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-09-15
 *               startTime:
 *                 type: string
 *                 example: "14:00"
 *               endTime:
 *                 type: string
 *                 example: "15:00"
 *               purpose:
 *                 type: string
 *                 example: Kulüp toplantısı
 *     responses:
 *       201:
 *         description: Rezervasyon talebi oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       404:
 *         description: Derslik bulunamadı
 *       409:
 *         description: Çakışma var
 */
router.post("/", auth, createReservationController);

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: Tüm rezervasyonları listele (filtreleme opsiyonel)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rezervasyon listesi
 */
router.get("/", auth, getAllReservationsController);

/**
 * @swagger
 * /api/v1/reservations/my:
 *   get:
 *     summary: Giriş yapan kullanıcının rezervasyonları
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rezervasyon listesi
 */
router.get("/my", auth, getMyReservationsController);

/**
 * @swagger
 * /api/v1/reservations/{id}/approve:
 *   put:
 *     summary: Rezervasyonu onayla (Admin)
 *     tags: [Reservations]
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
 *         description: Rezervasyon onaylandı
 */
router.put("/:id/approve", auth, role("Admin"), approveReservationController);

/**
 * @swagger
 * /api/v1/reservations/{id}/reject:
 *   put:
 *     summary: Rezervasyonu reddet (Admin)
 *     tags: [Reservations]
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
 *         description: Rezervasyon reddedildi
 */
router.put("/:id/reject", auth, role("Admin"), rejectReservationController);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   delete:
 *     summary: Kendi rezervasyonunu iptal et
 *     tags: [Reservations]
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
 *         description: Rezervasyon iptal edildi
 */
router.delete("/:id", auth, cancelReservationController);

module.exports = router;