const userService = require("./user.service");

const handleError = (res, error) => {
  console.error(error);

  if (error.status) {
    return res.status(error.status).json({
      message: error.message
    });
  }

  res.status(500).json({
    message: error.message
  });
};

const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    handleError(res, error);
  }
};

const updateMe = async (req, res) => {
  try {
    const result = await userService.updateMe(req.user.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const result = await userService.uploadProfilePicture(
      req.user.id,
      req.file?.filename
    );
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const createStudent = async (req, res) => {
  try {
    const result = await userService.createStudent(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await userService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    handleError(res, error);
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await userService.getStudentById(req.params.id);
    res.status(200).json(student);
  } catch (error) {
    handleError(res, error);
  }
};

const updateStudent = async (req, res) => {
  try {
    const result = await userService.updateStudent(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteStudent = async (req, res) => {
  try {
    const result = await userService.deleteStudent(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const createFaculty = async (req, res) => {
  try {
    const result = await userService.createFaculty(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllFaculties = async (req, res) => {
  try {
    const faculties = await userService.getAllFaculties();
    res.status(200).json(faculties);
  } catch (error) {
    handleError(res, error);
  }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await userService.getFacultyById(req.params.id);
    res.status(200).json(faculty);
  } catch (error) {
    handleError(res, error);
  }
};

const updateFaculty = async (req, res) => {
  try {
    const result = await userService.updateFaculty(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const result = await userService.deleteFaculty(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
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
