const nodemailer = require("nodemailer");

console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "OK" : "YOK");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.log("SMTP ERROR:");
    console.log(error);
  } else {
    console.log("✅ SMTP bağlantısı başarılı.");
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `http://localhost:3000/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Smart Campus" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Smart Campus Email Doğrulama",
    html: `
      <h2>Smart Campus</h2>

      <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın.</p>

      <a href="${verificationLink}">
        Emailimi Doğrula
      </a>
    `
  });
};

module.exports = {
  sendVerificationEmail
};