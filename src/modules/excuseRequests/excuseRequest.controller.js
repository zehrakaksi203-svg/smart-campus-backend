const { 
  ExcuseRequest, 
  AttendanceRecord, 
  AttendanceSession, 
  Student, 
  User, 
  CourseSection, 
  Course,
  Faculty
} = require("../../../models");

const handleError = (res, error) => {
  console.error("Mazeret İşlemi Hatası:", error);
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  return res.status(500).json({ message: "Sunucu hatası: " + error.message });
};

// 1. Mazeret Talebi Oluşturma (Student)
const createExcuseRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, reason, documentUrl, documentName, documentType } = req.body;

    if (!sessionId || !reason) {
      return res.status(400).json({ message: "Oturum ID (sessionId) ve mazeret açıklaması (reason) zorunludur." });
    }

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(403).json({ message: "Bu işlem için geçerli öğrenci profili bulunamadı." });
    }

    const session = await AttendanceSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ message: "İlgili yoklama oturumu bulunamadı." });
    }

    const existingRequest = await ExcuseRequest.findOne({
      where: { studentId: student.id, sessionId, status: "Pending" }
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Bu oturum için zaten değerlendirme bekleyen bir mazeret talebiniz bulunmaktadır." });
    }

    const excuseRequest = await ExcuseRequest.create({
      studentId: student.id,
      sessionId,
      reason,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
      documentType: documentType || null,
      status: "Pending"
    });

    return res.status(201).json({
      message: "Mazeret talebiniz başarıyla iletildi.",
      excuseRequest
    });
  } catch (error) {
    handleError(res, error);
  }
};

// 2. Tüm Mazeret Taleplerini Listeleme (Faculty / Admin)
const getAllExcuseRequests = async (req, res) => {
  try {
    const requests = await ExcuseRequest.findAll({
      include: [
        {
          model: Student,
          as: "student",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }]
        },
        {
          model: AttendanceSession,
          as: "session",
          include: [
            {
              model: CourseSection,
              as: "section",
              include: [{ model: Course, as: "course", attributes: ["courseCode", "courseName"] }]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json(requests);
  } catch (error) {
    handleError(res, error);
  }
};

// 3. Öğrencinin Kendi Mazeret Talepleri (Student)
const getMyExcuseRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(403).json({ message: "Öğrenci profili bulunamadı." });
    }

    const requests = await ExcuseRequest.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: AttendanceSession,
          as: "session",
          include: [
            {
              model: CourseSection,
              as: "section",
              include: [{ model: Course, as: "course", attributes: ["courseCode", "courseName"] }]
              
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json(requests);
  } catch (error) {
    handleError(res, error);
  }
};

// 4. Detay Getirme (Faculty / Admin)
const getExcuseRequestById = async (req, res) => {
  try {
    const excuseRequest = await ExcuseRequest.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: "student",
          include: [{ model: User, as: "user", attributes: ["fullName", "email"] }]
        },
        {
          model: AttendanceSession,
          as: "session"
        }
      ]
    });

    if (!excuseRequest) {
      return res.status(404).json({ message: "Mazeret talebi bulunamadı." });
    }

    return res.status(200).json(excuseRequest);
  } catch (error) {
    handleError(res, error);
  }
};

// 5. Onaylama (Faculty / Admin)
const approveExcuseRequest = async (req, res) => {
  try {
    const excuse = await ExcuseRequest.findByPk(req.params.id);
    if (!excuse) {
      return res.status(404).json({ message: "Mazeret talebi bulunamadı." });
    }

    if (excuse.status !== "Pending") {
      return res.status(400).json({ message: `Bu talep zaten '${excuse.status}' olarak sonuçlandırılmıştır.` });
    }

    const faculty = await Faculty.findOne({ where: { userId: req.user.id } });
    if (!faculty) {
      return res.status(403).json({ message: "Bu işlem için geçerli öğretim üyesi profili bulunamadı." });
    }

    excuse.status = "Approved";
    excuse.reviewedBy = faculty.id;
    excuse.reviewedAt = new Date();
    excuse.notes = req.body.notes || "Mazeret kabul edildi.";
    await excuse.save();

    let attendanceRecord = await AttendanceRecord.findOne({
      where: { sessionId: excuse.sessionId, studentId: excuse.studentId }
    });

    if (attendanceRecord) {
      attendanceRecord.isFlagged = false;
      attendanceRecord.flagReason = "Mazeret kabul edildi.";
      await attendanceRecord.save();
    } else {
      await AttendanceRecord.create({
        sessionId: excuse.sessionId,
        studentId: excuse.studentId,
        checkInTime: new Date(),
        isFlagged: false,
        flagReason: "Mazeret Onaylı Katılım"
      });
    }

    return res.status(200).json({
      message: "Mazeret talebi onaylandı ve yoklama kaydı güncellendi.",
      excuse
    });
  } catch (error) {
    handleError(res, error);
  }
};

// 6. Reddetme (Faculty / Admin)
const rejectExcuseRequest = async (req, res) => {
  try {
    const excuse = await ExcuseRequest.findByPk(req.params.id);
    if (!excuse) {
      return res.status(404).json({ message: "Mazeret talebi bulunamadı." });
    }

    if (excuse.status !== "Pending") {
      return res.status(400).json({ message: `Bu talep zaten '${excuse.status}' olarak sonuçlandırılmıştır.` });
    }

    const faculty = await Faculty.findOne({ where: { userId: req.user.id } });
    if (!faculty) {
      return res.status(403).json({ message: "Bu işlem için geçerli öğretim üyesi profili bulunamadı." });
    }

    excuse.status = "Rejected";
    excuse.reviewedBy = faculty.id;
    excuse.reviewedAt = new Date();
    excuse.notes = req.body.notes || "Mazeret belgesi yetersiz görüldü.";
    await excuse.save();

    return res.status(200).json({
      message: "Mazeret talebi reddedildi.",
      excuse
    });
  } catch (error) {
    handleError(res, error);
  }
};


const deleteExcuseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const excuseRequest = await ExcuseRequest.findByPk(id);

    if (!excuseRequest) {
      return res.status(404).json({ message: "Mazeret talebi bulunamadı." });
    }

    await excuseRequest.destroy();

    return res.status(200).json({ message: "Mazeret talebi silindi." });
  } catch (error) {
    console.error("DELETE EXCUSE REQUEST ERROR:", error);
    return res
      .status(500)
      .json({ message: "Mazeret talebi silinirken bir hata oluştu." });
  }
};

// module.exports bloğunun içine deleteExcuseRequest'i de ekle, ornek:
//
// module.exports = {
//   createExcuseRequest,
//   getAllExcuseRequests,
//   getMyExcuseRequests,
//   getExcuseRequestById,
//   approveExcuseRequest,
//   rejectExcuseRequest,
//   deleteExcuseRequest,
// };
module.exports = {
  createExcuseRequest,
  getAllExcuseRequests,
  getMyExcuseRequests,
  getExcuseRequestById,
  approveExcuseRequest,
  rejectExcuseRequest,
  deleteExcuseRequest,
};