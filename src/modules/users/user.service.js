const { User, Student, Faculty, Department } = require("../../../models");

const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ["password"]
    }
  });

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  return user;
};

const updateMe = async (userId, { fullName, email }) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  if (fullName) {
    user.fullName = fullName;
  }

  if (email) {
    user.email = email;
  }

  await user.save();

  return {
    message: "Profil başarıyla güncellendi.",
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  };
};

const uploadProfilePicture = async (userId, filename) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw { status: 404, message: "Kullanıcı bulunamadı." };
  }

  if (!filename) {
    throw { status: 400, message: "Lütfen bir resim seçin." };
  }

  user.profilePicture = filename;
  await user.save();

  return {
    message: "Profil fotoğrafı başarıyla yüklendi.",
    profilePicture: filename
  };
};

const createStudent = async (data) => {
  const student = await Student.create(data);

  return {
    message: "Öğrenci başarıyla oluşturuldu.",
    student
  };
};

const getAllStudents = async () => {
  return Student.findAll({
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
};

const getStudentById = async (id) => {
  const student = await Student.findByPk(id, {
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
    throw { status: 404, message: "Öğrenci bulunamadı." };
  }

  return student;
};

const updateStudent = async (id, data) => {
  const student = await Student.findByPk(id);

  if (!student) {
    throw { status: 404, message: "Öğrenci bulunamadı." };
  }

  await student.update(data);

  return {
    message: "Öğrenci güncellendi.",
    student
  };
};

const deleteStudent = async (id) => {
  const student = await Student.findByPk(id);

  if (!student) {
    throw { status: 404, message: "Öğrenci bulunamadı." };
  }

  await student.destroy();

  return {
    message: "Öğrenci silindi."
  };
};

const createFaculty = async (data) => {
  const faculty = await Faculty.create(data);

  return {
    message: "Öğretim üyesi başarıyla oluşturuldu.",
    faculty
  };
};

const getAllFaculties = async () => {
  return Faculty.findAll();
};

const getFacultyById = async (id) => {
  const faculty = await Faculty.findByPk(id);

  if (!faculty) {
    throw { status: 404, message: "Öğretim üyesi bulunamadı." };
  }

  return faculty;
};

const updateFaculty = async (id, data) => {
  const faculty = await Faculty.findByPk(id);

  if (!faculty) {
    throw { status: 404, message: "Öğretim üyesi bulunamadı." };
  }

  await faculty.update(data);

  return {
    message: "Öğretim üyesi güncellendi.",
    faculty
  };
};

const deleteFaculty = async (id) => {
  const faculty = await Faculty.findByPk(id);

  if (!faculty) {
    throw { status: 404, message: "Öğretim üyesi bulunamadı." };
  }

  await faculty.destroy();

  return {
    message: "Öğretim üyesi silindi."
  };
};

module.exports = {
  getMe,
  updateMe,
  uploadProfilePicture,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  createFaculty,
  getAllFaculties,
  getFacultyById,
  updateFaculty,
  deleteFaculty
};
