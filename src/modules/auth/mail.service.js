const nodemailer = require("nodemailer");

let transporter = null;

if (process.env.NODE_ENV !== "test") {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

const sendVerificationEmail = async (email, token) => {
  if (process.env.NODE_ENV === "test") {
    console.log("✉️ Test ortamı - mail gönderimi atlandı.");
    return;
  }

  const verificationLink =
    `http://localhost:3000/api/v1/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Smart Campus" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Smart Campus Email Doğrulama",
    html: `
      <h2>Smart Campus</h2>
      <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın.</p>
      <a href="${verificationLink}">Emailimi Doğrula</a>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
};
