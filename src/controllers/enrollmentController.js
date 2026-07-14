const {
    Enrollment,
    Student,
    Course,
    User,
    Department,
    Faculty
  } = require("../../models");
  
  // Yeni kayıt oluştur
  const createEnrollment = async (req, res) => {
    try {
      const enrollment = await Enrollment.create(req.body);
  
      res.status(201).json({
        message: "Ders kaydı başarıyla oluşturuldu.",
        enrollment
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Tüm kayıtları getir
  const getAllEnrollments = async (req, res) => {
    try {
      const enrollments = await Enrollment.findAll({
        include: [
          {
            model: Student,
            as: "student",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "fullName", "email"]
              },
              {
                model: Department,
                as: "department",
                attributes: ["id", "name", "code"]
              }
            ]
          },
          {
            model: Course,
            as: "course",
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
          }
        ]
      });
  
      res.status(200).json(enrollments);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // ID ile kayıt getir
  const getEnrollmentById = async (req, res) => {
    try {
      const enrollment = await Enrollment.findByPk(req.params.id, {
        include: [
          {
            model: Student,
            as: "student",
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "fullName", "email"]
              },
              {
                model: Department,
                as: "department",
                attributes: ["id", "name", "code"]
              }
            ]
          },
          {
            model: Course,
            as: "course",
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
          }
        ]
      });
  
      if (!enrollment) {
        return res.status(404).json({
          message: "Kayıt bulunamadı."
        });
      }
  
      res.status(200).json(enrollment);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Güncelle
  const updateEnrollment = async (req, res) => {
    try {
      const enrollment = await Enrollment.findByPk(req.params.id);
  
      if (!enrollment) {
        return res.status(404).json({
          message: "Kayıt bulunamadı."
        });
      }
  
      await enrollment.update(req.body);
  
      res.status(200).json({
        message: "Kayıt güncellendi.",
        enrollment
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Sil
  const deleteEnrollment = async (req, res) => {
    try {
      const enrollment = await Enrollment.findByPk(req.params.id);
  
      if (!enrollment) {
        return res.status(404).json({
          message: "Kayıt bulunamadı."
        });
      }
  
      await enrollment.destroy();
  
      res.status(200).json({
        message: "Kayıt silindi."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  module.exports = {
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment
  };