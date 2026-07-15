const {
  Attendance,
  Enrollment,
  Student,
  Course
} = require("../../../models");

const attendanceIncludes = [
  {
    model: Enrollment,
    as: "enrollment",
    include: [
      {
        model: Student,
        as: "student"
      },
      {
        model: Course,
        as: "course"
      }
    ]
  }
];

const createAttendance = async (data) => {
  const attendance = await Attendance.create(data);

  return {
    message: "Yoklama başarıyla oluşturuldu.",
    attendance
  };
};

const getAllAttendances = async () => {
  return Attendance.findAll({
    include: attendanceIncludes
  });
};

const getAttendanceById = async (id) => {
  const attendance = await Attendance.findByPk(id);

  if (!attendance) {
    throw { status: 404, message: "Yoklama bulunamadı." };
  }

  return attendance;
};

const updateAttendance = async (id, data) => {
  const attendance = await Attendance.findByPk(id);

  if (!attendance) {
    throw { status: 404, message: "Yoklama bulunamadı." };
  }

  await attendance.update(data);

  return {
    message: "Yoklama güncellendi.",
    attendance
  };
};

const deleteAttendance = async (id) => {
  const attendance = await Attendance.findByPk(id);

  if (!attendance) {
    throw { status: 404, message: "Yoklama bulunamadı." };
  }

  await attendance.destroy();

  return {
    message: "Yoklama silindi."
  };
};

module.exports = {
  createAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance
};
