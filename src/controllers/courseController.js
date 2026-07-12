const { Course, Department, Faculty } = require("../../models");

// Yeni ders oluştur
const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      message: "Ders başarıyla oluşturuldu.",
      course
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Tüm dersleri getir
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"]
        },
        {
          model: Faculty,
          as: "faculty",
          attributes: [
            "id",
            "employeeNumber",
            "title",
            "specialization"
          ]
        }
      ]
    });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ID ile ders getir
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "code"]
        },
        {
          model: Faculty,
          as: "faculty",
          attributes: [
            "id",
            "employeeNumber",
            "title",
            "specialization"
          ]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        message: "Ders bulunamadı."
      });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Güncelle
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Ders bulunamadı."
      });
    }

    await course.update(req.body);

    res.status(200).json({
      message: "Ders güncellendi.",
      course
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Sil
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        message: "Ders bulunamadı."
      });
    }

    await course.destroy();

    res.status(200).json({
      message: "Ders silindi."
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
};