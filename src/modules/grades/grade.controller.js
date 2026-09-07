const gradeService = require("./grade.service");

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

const createGrade = async (req, res) => {
  try {
    const result = await gradeService.createGrade(req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const getAllGrades = async (req, res) => {
  try {
    const grades = await gradeService.getAllGrades();
    res.status(200).json(grades);
  } catch (error) {
    handleError(res, error);
  }
};

const getGradeById = async (req, res) => {
  try {
    const grade = await gradeService.getGradeById(req.params.id);
    res.status(200).json(grade);
  } catch (error) {
    handleError(res, error);
  }
};

const updateGrade = async (req, res) => {
  try {
    const result = await gradeService.updateGrade(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteGrade = async (req, res) => {
  try {
    const result = await gradeService.deleteGrade(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// ==========================================
// PART 2: YENİ EKLENEN METOTLAR
// ==========================================

const getMyGrades = async (req, res) => {
  try {
    const grades = await gradeService.getMyGrades(req.user.id);
    res.status(200).json(grades);
  } catch (error) {
    handleError(res, error);
  }
};

const getTranscript = async (req, res) => {
  try {
    const transcriptData = await gradeService.getTranscript(req.user.id);
    res.status(200).json(transcriptData);
  } catch (error) {
    handleError(res, error);
  }
};

const getTranscriptPdf = async (req, res) => {
  try {
    const doc = await gradeService.generateTranscriptPdf(req.user.id);

    res.setHeader("Content-disposition", `attachment; filename="Transkript.pdf"`);
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);
    doc.end();
  } catch (error) {
    handleError(res, error);
  }
};
const notifySectionGrades = async (req, res) => {
  try {
    const result = await gradeService.notifySectionGrades(req.params.sectionId);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getMyGrades,
  getTranscript,
  getTranscriptPdf,
  notifySectionGrades
};