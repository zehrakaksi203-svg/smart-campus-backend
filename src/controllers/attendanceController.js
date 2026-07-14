const {
    Attendance,
    Enrollment,
    Student,
    Course
  } = require("../../models");
  
  // Yeni yoklama oluştur
  const createAttendance = async (req, res) => {
    try {
      const attendance = await Attendance.create(req.body);
  
      res.status(201).json({
        message: "Yoklama başarıyla oluşturuldu.",
        attendance
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Tüm yoklamaları getir
  const getAllAttendances = async (req, res) => {
    try {
      const attendances = await Attendance.findAll({
        include: [
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
        ]
      });
  
      res.status(200).json(attendances);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // ID ile getir
  const getAttendanceById = async (req, res) => {
    try {
      const attendance = await Attendance.findByPk(req.params.id);
  
      if (!attendance) {
        return res.status(404).json({
          message: "Yoklama bulunamadı."
        });
      }
  
      res.status(200).json(attendance);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Güncelle
  const updateAttendance = async (req, res) => {
    try {
      const attendance = await Attendance.findByPk(req.params.id);
  
      if (!attendance) {
        return res.status(404).json({
          message: "Yoklama bulunamadı."
        });
      }
  
      await attendance.update(req.body);
  
      res.status(200).json({
        message: "Yoklama güncellendi.",
        attendance
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Sil
  const deleteAttendance = async (req, res) => {
    try {
      const attendance = await Attendance.findByPk(req.params.id);
  
      if (!attendance) {
        return res.status(404).json({
          message: "Yoklama bulunamadı."
        });
      }
  
      await attendance.destroy();
  
      res.status(200).json({
        message: "Yoklama silindi."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  module.exports = {
    createAttendance,
    getAllAttendances,
    getAttendanceById,
    updateAttendance,
    deleteAttendance
  };