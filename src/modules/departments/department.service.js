const { Department } = require("../../../models");

const createDepartment = async ({ name, code, description, facultyName }) => {
  const department = await Department.create({
    name,
    code,
    description,
    facultyName
  });

  return {
    message: "Bölüm başarıyla oluşturuldu.",
    department
  };
};

const getAllDepartments = async () => {
  return Department.findAll();
};

const getDepartmentById = async (id) => {
  const department = await Department.findByPk(id);

  if (!department) {
    throw { status: 404, message: "Bölüm bulunamadı." };
  }

  return department;
};

const updateDepartment = async (id, data) => {
  const department = await Department.findByPk(id);

  if (!department) {
    throw { status: 404, message: "Bölüm bulunamadı." };
  }

  await department.update(data);

  return {
    message: "Bölüm güncellendi.",
    department
  };
};

const deleteDepartment = async (id) => {
  const department = await Department.findByPk(id);

  if (!department) {
    throw { status: 404, message: "Bölüm bulunamadı." };
  }

  await department.destroy();

  return {
    message: "Bölüm silindi."
  };
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
