const {
  Announcement,
  Faculty,
  Department
} = require("../../../models");

const announcementIncludes = [
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
];

const createAnnouncement = async (data) => {
  const announcement = await Announcement.create(data);

  return {
    message: "Duyuru başarıyla oluşturuldu.",
    announcement
  };
};

const getAllAnnouncements = async () => {
  return Announcement.findAll({
    include: announcementIncludes
  });
};

const getAnnouncementById = async (id) => {
  const announcement = await Announcement.findByPk(id);

  if (!announcement) {
    throw { status: 404, message: "Duyuru bulunamadı." };
  }

  return announcement;
};

const updateAnnouncement = async (id, data) => {
  const announcement = await Announcement.findByPk(id);

  if (!announcement) {
    throw { status: 404, message: "Duyuru bulunamadı." };
  }

  await announcement.update(data);

  return {
    message: "Duyuru güncellendi.",
    announcement
  };
};

const deleteAnnouncement = async (id) => {
  const announcement = await Announcement.findByPk(id);

  if (!announcement) {
    throw { status: 404, message: "Duyuru bulunamadı." };
  }

  await announcement.destroy();

  return {
    message: "Duyuru silindi."
  };
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
