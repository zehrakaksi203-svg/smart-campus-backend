const classroomService = require("./classroom.service");

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

const createClassroom = async (req, res) => {
  try {
    const result = await classroomService.createClassroom(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Bu bina ve oda numarasıyla zaten bir derslik kayıtlı."
      });
    }

    handleError(res, error);
  }
};

const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await classroomService.getAllClassrooms();
    res.status(200).json(classrooms);
  } catch (error) {
    handleError(res, error);
  }
};

const getClassroomById = async (req, res) => {
  try {
    const classroom = await classroomService.getClassroomById(req.params.id);
    res.status(200).json(classroom);
  } catch (error) {
    handleError(res, error);
  }
};

const updateClassroom = async (req, res) => {
  try {
    const result = await classroomService.updateClassroom(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const result = await classroomService.deleteClassroom(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom
};