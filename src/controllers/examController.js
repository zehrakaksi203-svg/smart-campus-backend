const {
    Exam,
    Course,
    Department,
    Faculty
  } = require("../../models");
  
  // Yeni sınav oluştur
  const createExam = async (req, res) => {
    try {
      const exam = await Exam.create(req.body);
  
      res.status(201).json({
        message: "Sınav başarıyla oluşturuldu.",
        exam
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Tüm sınavları getir
  const getAllExams = async (req, res) => {
    try {
      const exams = await Exam.findAll({
        include: [
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
  
      res.status(200).json(exams);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // ID ile getir
  const getExamById = async (req, res) => {
    try {
      const exam = await Exam.findByPk(req.params.id);
  
      if (!exam) {
        return res.status(404).json({
          message: "Sınav bulunamadı."
        });
      }
  
      res.status(200).json(exam);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Güncelle
  const updateExam = async (req, res) => {
    try {
      const exam = await Exam.findByPk(req.params.id);
  
      if (!exam) {
        return res.status(404).json({
          message: "Sınav bulunamadı."
        });
      }
  
      await exam.update(req.body);
  
      res.status(200).json({
        message: "Sınav güncellendi.",
        exam
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  // Sil
  const deleteExam = async (req, res) => {
    try {
      const exam = await Exam.findByPk(req.params.id);
  
      if (!exam) {
        return res.status(404).json({
          message: "Sınav bulunamadı."
        });
      }
  
      await exam.destroy();
  
      res.status(200).json({
        message: "Sınav silindi."
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  };
  
  module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam
  };