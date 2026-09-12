
const { askAI } = require("./ai.service");

async function chat(req, res) {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Mesaj boş olamaz."
      });
    }

    // JWT'den giriş yapan kullanıcının ID'sini al
    const userId = req.user.id;

    const answer = await askAI(message, userId);

    res.json({
      answer
    });
  } catch (error) {
    console.error(
      "NVIDIA HATASI:",
      error.response?.data || error.message
    );

    res.status(error.status || 500).json({
      message:
        error.message ||
        "Yapay zeka servisine bağlanırken hata oluştu."
    });
  }
}

module.exports = { chat };

