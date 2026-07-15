const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
} = require("./auth.controller");

const validate = require("../../middleware/validate");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("./auth.validation");

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

router.post("/logout", logout);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword
);

module.exports = router;