const announcementService = require("./announcement.service");

const handleError = (res, error) => {
  console.error(error);

  if (error.status) {
    return res.status(error.status).json({
      message: error.message
    });
  }

  res.status(500).json({
    message: error.message
  });
};

const createAnnouncement = async (req, res) => {
  try {
    const result = await announcementService.createAnnouncement(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await announcementService.getAllAnnouncements();
    res.status(200).json(announcements);
  } catch (error) {
    handleError(res, error);
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id);
    res.status(200).json(announcement);
  } catch (error) {
    handleError(res, error);
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const result = await announcementService.updateAnnouncement(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const result = await announcementService.deleteAnnouncement(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
