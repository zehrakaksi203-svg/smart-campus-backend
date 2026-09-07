"use strict";
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const { Payment, Student } = require("../../../models");

const createPayment = async ({ studentId, type, referenceId, amount, description }) => {
  return Payment.create({
    studentId,
    type,
    referenceId: referenceId || null,
    amount,
    description: description || null,
    status: "Pending",
  });
};

// Simüle "hemen öde" — Stripe olmadan da eski davranışı korumak isteyenler için hâlâ mevcut.
const payPayment = async (paymentId, studentId, role) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    const err = new Error("Ödeme kaydı bulunamadı.");
    err.status = 404;
    throw err;
  }

  if (role === "Student" && payment.studentId !== studentId) {
    const err = new Error("Bu ödemeyi gerçekleştirme yetkiniz yok.");
    err.status = 403;
    throw err;
  }

  if (payment.status === "Completed") {
    const err = new Error("Bu ödeme zaten tamamlanmış.");
    err.status = 400;
    throw err;
  }

  payment.status = "Completed";
  payment.paidAt = new Date();
  await payment.save();

  return payment;
};

// Gerçek Stripe Checkout Session oluşturur, ödeme sayfasının URL'ini döner.
const createCheckoutSession = async (paymentId, studentId, role) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    const err = new Error("Ödeme kaydı bulunamadı.");
    err.status = 404;
    throw err;
  }

  if (role === "Student" && payment.studentId !== studentId) {
    const err = new Error("Bu ödemeyi gerçekleştirme yetkiniz yok.");
    err.status = 403;
    throw err;
  }

  if (payment.status === "Completed") {
    const err = new Error("Bu ödeme zaten tamamlanmış.");
    err.status = 400;
    throw err;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "try",
          product_data: {
            name: payment.description || `${payment.type} Ödemesi`,
          },
          // Stripe tutarı kuruş cinsinden bekler.
          unit_amount: Math.round(Number(payment.amount) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentId: String(payment.id),
    },
    success_url: `${frontendUrl}/payments?checkout=success`,
    cancel_url: `${frontendUrl}/payments?checkout=cancel`,
  });

  // Stripe session id'sini ödeme kaydına not olarak ekleyelim (izlenebilirlik için).
  payment.description = payment.description || `${payment.type} Ödemesi`;
  await payment.save();

  return { url: session.url };
};

// Stripe webhook'undan gelen "checkout.session.completed" olayını işler.
const markPaymentCompletedFromStripe = async (stripeSession) => {
  const paymentId = stripeSession.metadata?.paymentId;
  if (!paymentId) return;

  const payment = await Payment.findByPk(paymentId);
  if (!payment) return;

  if (payment.status !== "Completed") {
    payment.status = "Completed";
    payment.paidAt = new Date();
    await payment.save();
  }
};

const getMyPayments = async (studentId) => {
  return Payment.findAll({
    where: { studentId },
    order: [["createdAt", "DESC"]],
  });
};

const getAllPayments = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  return Payment.findAll({
    where,
    include: [{ model: Student, as: "student" }],
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createPayment,
  payPayment,
  createCheckoutSession,
  markPaymentCompletedFromStripe,
  getMyPayments,
  getAllPayments,
};