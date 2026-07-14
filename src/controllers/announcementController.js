const {
    Announcement,
    Faculty,
    Department
  } = require("../../models");
  
  // Yeni duyuru oluştur
  const createAnnouncement = async (req, res) => {
    try {
      const announcement = await Announcement.create(req.body);
  
      res.status(201).json({
        message: "Duyuru başarıyla oluşturuldu.",
        announcement
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Tüm duyuruları getir
  const getAllAnnouncements = async (req, res) => {
    try {
      const announcements = await Announcement.findAll({
        include: [
          {
            model: Faculty,
            as: "faculty",
            attributes: [
              "id",
              "employeeNumber",
              "title",
              "specialization"
            ]
          },
          {
            model: Department,
            as: "department",
            attributes: [
              "id",
              "name",
              "code"
            ]
          }
        ]
      });
  
      res.status(200).json(announcements);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // ID ile getir
  const getAnnouncementById = async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);
  
      if (!announcement) {
        return res.status(404).json({
          message: "Duyuru bulunamadı."
        });
      }
  
      res.status(200).json(announcement);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Güncelle
  const updateAnnouncement = async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);
  
      if (!announcement) {
        return res.status(404).json({
          message: "Duyuru bulunamadı."
        });
      }
  
      await announcement.update(req.body);
  
      res.status(200).json({
        message: "Duyuru güncellendi.",
        announcement
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Sil
  const deleteAnnouncement = async (req, res) => {
    try {
      const announcement = await Announcement.findByPk(req.params.id);
  
      if (!announcement) {
        return res.status(404).json({
          message: "Duyuru bulunamadı."
        });
      }
  
      await announcement.destroy();
  
      res.status(200).json({
        message: "Duyuru silindi."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  module.exports = {
    createAnnouncement,
    getAllAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement
  };