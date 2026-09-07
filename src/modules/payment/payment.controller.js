"use strict";
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const paymentService = require("./payment.service");
const { Student } = require("../../../models");

const resolveStudentId = async (req) => {
  if (req.user.studentId) return req.user.studentId;
  const student = await Student.findOne({ where: { userId: req.user.id } });
  return student ? student.id : null;
};

const createPaymentController = async (req, res) => {
  try {
    const { studentId, type, referenceId, amount, description } = req.body;

    let targetStudentId = studentId;
    if (req.user.role === "Student") {
      targetStudentId = await resolveStudentId(req);
    }

    if (!targetStudentId || !type || !amount) {
      return res
        .status(400)
        .json({ message: "studentId, type ve amount zorunludur." });
    }

    const payment = await paymentService.createPayment({
      studentId: targetStudentId,
      type,
      referenceId,
      amount,
      description,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Bir hata oluştu." });
  }
};

const payPaymentController = async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({
        message: "Bu işlemi yalnızca ödemenin sahibi olan öğrenci yapabilir.",
      });
    }
    const studentId = await resolveStudentId(req);
    const payment = await paymentService.payPayment(
      req.params.id,
      studentId,
      req.user.role
    );
    res.json(payment);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Bir hata oluştu." });
  }
};

// Stripe Checkout Session oluşturur, ödeme sayfası URL'ini döner.
const createCheckoutSessionController = async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({
        message: "Bu işlemi yalnızca ödemenin sahibi olan öğrenci yapabilir.",
      });
    }
    const studentId = await resolveStudentId(req);
    const result = await paymentService.createCheckoutSession(
      req.params.id,
      studentId,
      req.user.role
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Bir hata oluştu." });
  }
};

// Stripe'ın çağırdığı webhook — imza doğrulaması yapar, JSON body değil raw body kullanır.
const stripeWebhookController = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : JSON.parse(req.body);
  } catch (err) {
    console.error("Webhook imza doğrulama hatası:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await paymentService.markPaymentCompletedFromStripe(session);
    } catch (err) {
      console.error("Webhook ödeme güncelleme hatası:", err);
    }
  }

  res.json({ received: true });
};

const getMyPaymentsController = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req);
    if (!studentId) {
      return res.status(404).json({ message: "Öğrenci kaydı bulunamadı." });
    }
    const payments = await paymentService.getMyPayments(studentId);
    res.json(payments);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Bir hata oluştu." });
  }
};

const getAllPaymentsController = async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments(req.query);
    res.json(payments);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Bir hata oluştu." });
  }
};

module.exports = {
  createPaymentController,
  payPaymentController,
  createCheckoutSessionController,
  stripeWebhookController,
  getMyPaymentsController,
  getAllPaymentsController,
};