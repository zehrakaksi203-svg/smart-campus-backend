const Joi = require("joi");

const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),

  email: Joi.string().email().required(),

  password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*\\d).+$"))
    .required()
    .messages({
      "string.pattern.base":
        "Şifre en az 8 karakter olmalı, en az 1 büyük harf ve 1 rakam içermelidir."
    }),

  role: Joi.string()
    .valid("Student", "Faculty", "Admin")
    .required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// =========================
// RESET PASSWORD VALIDATION
// =========================

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),

  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[A-Z])(?=.*\\d).+$"))
    .required()
    .messages({
      "string.pattern.base":
        "Şifre en az 8 karakter olmalı, en az 1 büyük harf ve 1 rakam içermelidir."
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};