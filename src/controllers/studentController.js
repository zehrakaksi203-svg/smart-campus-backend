const { Student, User, Department } = require("../../models");

// Yeni öğrenci oluştur
const createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      message: "Öğrenci başarıyla oluşturuldu.",
      student
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Tüm öğrencileri getir
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
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
      });

    
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ID ile öğrenci getir
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
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
    });

    if (!student) {
      return res.status(404).json({
        message: "Öğrenci bulunamadı."
      });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Güncelle
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Öğrenci bulunamadı."
      });
    }

    await student.update(req.body);

    res.status(200).json({
      message: "Öğrenci güncellendi.",
      student
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Sil
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Öğrenci bulunamadı."
      });
    }

    await student.destroy();

    res.status(200).json({
      message: "Öğrenci silindi."
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};