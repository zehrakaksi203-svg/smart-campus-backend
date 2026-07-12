const { User } = require("../../models");

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ["password"]
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı."
      });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

const updateMe = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı."
      });
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (email) {
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      message: "Profil başarıyla güncellendi.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Lütfen bir resim seçin."
      });
    }

    user.profilePicture = req.file.filename;

    await user.save();

    res.status(200).json({
      message: "Profil fotoğrafı başarıyla yüklendi.",
      profilePicture: req.file.filename
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  getMe,
  updateMe,
  uploadProfilePicture
};