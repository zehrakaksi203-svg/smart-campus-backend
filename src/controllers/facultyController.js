const { Faculty } = require("../../models");

// Yeni öğretim üyesi oluştur
const createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);

    res.status(201).json({
      message: "Öğretim üyesi başarıyla oluşturuldu.",
      faculty
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Tüm öğretim üyelerini getir
const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.findAll();

    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ID ile getir
const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        message: "Öğretim üyesi bulunamadı."
      });
    }

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Güncelle
const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        message: "Öğretim üyesi bulunamadı."
      });
    }

    await faculty.update(req.body);

    res.status(200).json({
      message: "Öğretim üyesi güncellendi.",
      faculty
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Sil
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);

    if (!faculty) {
      return res.status(404).json({
        message: "Öğretim üyesi bulunamadı."
      });
    }

    await faculty.destroy();

    res.status(200).json({
      message: "Öğretim üyesi silindi."
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty
};