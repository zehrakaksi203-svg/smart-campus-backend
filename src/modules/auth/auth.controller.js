const authService = require("./auth.service");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
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

const login = async (req, res) => {
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

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword
};
