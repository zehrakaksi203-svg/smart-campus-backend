const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  User,
  RefreshToken,
  PasswordResetToken
} = require("../../../models");

const { sendVerificationEmail } = require("./mail.service");

const register = async ({ fullName, email, password, role }) => {
  if (!fullName || !email || !password || !role) {
    throw {
      status: 400,
      message: "Tüm alanlar zorunludur."
    };
  }

  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    throw {
      status: 400,
      message: "Bu e-posta zaten kayıtlı."
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role,
    isVerified: false,
    verificationToken
  });

  await sendVerificationEmail(email, verificationToken);

  return {
    message: "Kullanıcı oluşturuldu. Lütfen e-posta adresinizi doğrulayın.",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw { status: 400, message: "E-posta ve şifre zorunludur." };
  }

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  if (!user.isVerified) {
    throw {
      status: 403,
     message: "Lütfen önce e-posta adresinizi doğrulayın."
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { status: 401, message: "Şifre yanlış." };
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m"
    }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d"
    }
  );

  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return {
    message: "Giriş başarılı.",
    accessToken,
    refreshToken
  };
};

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw { status: 401, message: "Refresh token gerekli." };
  }

  const storedToken = await RefreshToken.findOne({
    where: {
      token: refreshToken
    }
  });

  if (!storedToken) {
    throw { status: 403, message: "Geçersiz refresh token." };
  }

  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err) {
          reject({
            status: 403,
            message: "Refresh token süresi dolmuş."
          });
          return;
        }

        resolve(payload);
      }
    );
  });

  const user = await User.findByPk(decoded.id);

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m"
    }
  );

  return { accessToken };
};

const logout = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw { status: 400, message: "Refresh token gerekli." };
  }

  await RefreshToken.destroy({
    where: {
      token: refreshToken
    }
  });

  return {
    message: "Başarıyla çıkış yapıldı."
  };
};

const forgotPassword = async ({ email }) => {
  if (!email) {
    throw { status: 400, message: "Email gerekli." };
  }

  const user = await User.findOne({
    where: {
      email
    }
  });

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  const resetToken = jwt.sign(
    {
      id: user.id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m"
    }
  );

  await PasswordResetToken.create({
    userId: user.id,
    token: resetToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });

  console.log("Şifre sıfırlama token:", resetToken);

  return {
    message: "Şifre sıfırlama token oluşturuldu.",
    token: resetToken
  };
};

// =========================
// RESET PASSWORD
// =========================

const resetPassword = async ({ token, newPassword }) => {
  if (!token || !newPassword) {
    throw {
      status: 400,
      message: "Token ve yeni şifre zorunludur."
    };
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw {
      status: 400,
      message: "Geçersiz veya süresi dolmuş token."
    };
  }

  const savedToken = await PasswordResetToken.findOne({
    where: {
      token
    }
  });

  if (!savedToken) {
    throw {
      status: 400,
      message: "Token bulunamadı."
    };
  }

  const user = await User.findByPk(decoded.id);

  if (!user) {
    throw {
      status: 404,
      message: "Kullanıcı bulunamadı."
    };
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  await savedToken.destroy();

  return {
    message: "Şifre başarıyla güncellendi."
  };
};
const verifyEmail = async (token) => {
  if (!token) {
    throw {
      status: 400,
      message: "Doğrulama tokenı gerekli."
    };
  }

  const user = await User.findOne({
    where: {
      verificationToken: token
    }
  });

  if (!user) {
    throw {
      status: 400,
      message: "Geçersiz doğrulama tokenı."
    };
  }

  user.isVerified = true;
  user.verificationToken = null;

  await user.save();

  return {
    message: "E-posta başarıyla doğrulandı."
  };
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