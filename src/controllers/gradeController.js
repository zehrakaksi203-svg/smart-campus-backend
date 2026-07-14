const { Grade, Enrollment, Student, Course } = require("../../models");

// Harf notu hesaplama
const calculateLetterGrade = (average) => {
  if (average >= 90) return "AA";
  if (average >= 85) return "BA";
  if (average >= 80) return "BB";
  if (average >= 75) return "CB";
  if (average >= 70) return "CC";
  if (average >= 65) return "DC";
  if (average >= 60) return "DD";
  if (average >= 50) return "FD";
  return "FF";
};

// Yeni not oluştur
const createGrade = async (req, res) => {
  try {
    const { enrollmentId, midterm, final, makeup } = req.body;

    const exam = makeup ?? final;
    const average = Number((midterm * 0.4 + exam * 0.6).toFixed(2));

    const letterGrade = calculateLetterGrade(average);

    const status = average >= 60 ? "Passed" : "Failed";

    const grade = await Grade.create({
      enrollmentId,
      midterm,
      final,
      makeup,
      average,
      letterGrade,
      status
    });

    res.status(201).json({
      message: "Not başarıyla oluşturuldu.",
      grade
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Tüm notları getir
const getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.findAll({
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

    res.status(200).json(grades);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ID ile getir
const getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);

    if (!grade) {
      return res.status(404).json({
        message: "Not bulunamadı."
      });
    }

    res.status(200).json(grade);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Güncelle
const updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);

    if (!grade) {
      return res.status(404).json({
        message: "Not bulunamadı."
      });
    }

    const {
      midterm,
      final,
      makeup
    } = req.body;

    const exam = makeup ?? final;
    const average = Number((midterm * 0.4 + exam * 0.6).toFixed(2));

    const letterGrade = calculateLetterGrade(average);

    const status = average >= 60 ? "Passed" : "Failed";

    await grade.update({
      ...req.body,
      average,
      letterGrade,
      status
    });

    res.status(200).json({
      message: "Not güncellendi.",
      grade
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Sil
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);

    if (!grade) {
      return res.status(404).json({
        message: "Not bulunamadı."
      });
    }

    await grade.destroy();

    res.status(200).json({
      message: "Not silindi."
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade
};