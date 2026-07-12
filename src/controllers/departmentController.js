const { Department } = require("../../models");

// Yeni bölüm oluştur
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, facultyName } = req.body;

    const department = await Department.create({
      name,
      code,
      description,
      facultyName
    });

    res.status(201).json({
      message: "Bölüm başarıyla oluşturuldu.",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Tüm bölümleri getir
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ID ile bölüm getir
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Bölüm bulunamadı."
      });
    }

    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Bölüm güncelle
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Bölüm bulunamadı."
      });
    }

    await department.update(req.body);

    res.status(200).json({
      message: "Bölüm güncellendi.",
      department
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Bölüm sil
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Bölüm bulunamadı."
      });
    }

    await department.destroy();

    res.status(200).json({
      message: "Bölüm silindi."
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};