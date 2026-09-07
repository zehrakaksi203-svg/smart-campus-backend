const authService = require("./auth.service");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("./auth.validation");
const register = async (req, res) => {
  console.log("=== REGISTER CONTROLLER ===");
  console.log(req.body);

  const { error } = registerSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  try {
    const result = await authService.register(req.body);
    console.log("REGISTER BİTTİ");
    return res.status(201).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
};

const login = async (req, res) => {

  const { error } = loginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

const refresh = async (req, res) => {
  try {
    const result = await authService.refresh(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logout(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {

  const { error } = forgotPasswordSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  try {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

// =========================
// RESET PASSWORD
// =========================

const resetPassword = async (req, res) => {

  const { error } = resetPasswordSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  try {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

// =========================
// VERIFY EMAIL
// =========================
const verifyEmail = async (req, res) => {
  try {
    const result = await authService.verifyEmail(req.query.token);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail
};