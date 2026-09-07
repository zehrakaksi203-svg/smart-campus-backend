const { Classroom } = require("../../../models");

const createClassroom = async ({ building, roomNumber, capacity, latitude, longitude, featuresJson }) => {
  const classroom = await Classroom.create({
    building,
    roomNumber,
    capacity,
    latitude,
    longitude,
    featuresJson
  });

  return {
    message: "Sınıf başarıyla oluşturuldu.",
    classroom
  };
};

const getAllClassrooms = async () => {
  return Classroom.findAll();
};

const getClassroomById = async (id) => {
  const classroom = await Classroom.findByPk(id);

  if (!classroom) {
    throw { status: 404, message: "Sınıf bulunamadı." };
  }

  return classroom;
};

const updateClassroom = async (id, data) => {
  const classroom = await Classroom.findByPk(id);

  if (!classroom) {
    throw { status: 404, message: "Sınıf bulunamadı." };
  }

  await classroom.update(data);

  return {
    message: "Sınıf güncellendi.",
    classroom
  };
};

const deleteClassroom = async (id) => {
  const classroom = await Classroom.findByPk(id);

  if (!classroom) {
    throw { status: 404, message: "Sınıf bulunamadı." };
  }

  await classroom.destroy();

  return {
    message: "Sınıf silindi."
  };
};

module.exports = {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom
};