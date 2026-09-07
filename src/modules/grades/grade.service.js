const { Grade, Enrollment, Student, Course, User } = require("../../../models");
const PDFDocument = require("pdfkit");
const notificationService = require("../notifications/notification.service");

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

const LETTER_GRADE_POINTS = {
  AA: 4.0,
  BA: 3.5,
  BB: 3.0,
  CB: 2.5,
  CC: 2.0,
  DC: 1.5,
  DD: 1.0,
  FD: 0.5,
  FF: 0.0
};

const computeGradeFields = ({ midterm, final, makeup }) => {
  const exam = (makeup !== null && makeup !== undefined && makeup > 0) ? makeup : final;
  const average = Number((midterm * 0.4 + exam * 0.6).toFixed(2));
  const letterGrade = calculateLetterGrade(average);
  const status = average >= 60 ? "Passed" : "Failed";

  return { average, letterGrade, status };
};

/**
 * Bir öğrencinin tüm notlanmış (kredi ağırlıklı) derslerine bakarak
 * güncel CGPA'sini hesaplar ve Student.gpa alanına yazar.
 */
const recalculateStudentGpa = async (enrollmentId) => {
  const enrollment = await Enrollment.findByPk(enrollmentId);

  if (!enrollment) return;

  const studentId = enrollment.studentId;

  const enrollments = await Enrollment.findAll({
    where: { studentId },
    include: [
      { model: Course, as: "course" },
      { model: Grade, as: "grade" }
    ]
  });

  const gradedEnrollments = enrollments.filter((e) => e.grade);

  let totalCredits = 0;
  let totalPoints = 0;

  gradedEnrollments.forEach((e) => {
    const credit = e.course?.credit || 0;
    const point = LETTER_GRADE_POINTS[e.grade.letterGrade] ?? 0;

    totalCredits += credit;
    totalPoints += credit * point;
  });

  const gpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

  await Student.update({ gpa }, { where: { id: studentId } });
};

/**
 * Not girildiğinde/güncellendiğinde ilgili öğrenciye bildirim gönderir
 */
const notifyStudentAboutGrade = async (enrollmentId, letterGrade) => {
  const enrollment = await Enrollment.findByPk(enrollmentId, {
    include: [
      { model: Course, as: "course" },
      {
        model: Student,
        as: "student",
        include: [{ model: User, as: "user" }]
      }
    ]
  });

  if (!enrollment || !enrollment.student || !enrollment.student.user) return;

  const courseName = enrollment.course?.courseName || "bir ders";

  await notificationService.createNotification({
    userId: enrollment.student.user.id,
    title: "Not Girildi",
    message: `${courseName} dersi için notunuz güncellendi: ${letterGrade}`,
    type: "grade",
    relatedEntityType: "Enrollment",
    relatedEntityId: enrollmentId
  });
};





const createGrade = async ({ enrollmentId, midterm, final, makeup }) => {
  const { average, letterGrade, status } = computeGradeFields({
    midterm,
    final,
    makeup
  });

  const grade = await Grade.create({
    enrollmentId,
    midterm,
    final,
    makeup,
    average,
    letterGrade,
    status
  });

  await Enrollment.update(
    {
      midtermGrade: midterm,
      finalGrade: final,
      letterGrade
    },
    { where: { id: enrollmentId } }
  );

  await recalculateStudentGpa(enrollmentId);

  await notifyStudentAboutGrade(enrollmentId, letterGrade);

  return {
    message: "Not başarıyla oluşturuldu.",
    grade
  };
};

const getAllGrades = async () => {
  return Grade.findAll({
    include: [
      {
        model: Enrollment,
        as: "enrollment",
        include: [
          {
            model: Student,
            as: "student",
            include: [{ model: User, as: "user" }]
          },
          {
            model: Course,
            as: "course"
          }
        ]
      }
    ]
  });
};

const getGradeById = async (id) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  return grade;
};
const updateGrade = async (id, data) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  const { midterm, final, makeup } = data;
  const { average, letterGrade, status } = computeGradeFields({
    midterm,
    final,
    makeup
  });

  await grade.update({
    ...data,
    average,
    letterGrade,
    status
  });

  await Enrollment.update(
    {
      midtermGrade: midterm,
      finalGrade: final,
      letterGrade
    },
    { where: { id: grade.enrollmentId } }
  );

  await recalculateStudentGpa(grade.enrollmentId);

  await notifyStudentAboutGrade(grade.enrollmentId, letterGrade);

  return {
    message: "Not güncellendi.",
    grade
  };
};


const deleteGrade = async (id) => {
  const grade = await Grade.findByPk(id);

  if (!grade) {
    throw { status: 404, message: "Not bulunamadı." };
  }

  const { enrollmentId } = grade;

  await grade.destroy();

  await Enrollment.update(
    {
      midtermGrade: null,
      finalGrade: null,
      letterGrade: null
    },
    { where: { id: enrollmentId } }
  );

  await recalculateStudentGpa(enrollmentId);

  return {
    message: "Not silindi."
  };
};

// ==========================================
// PART 2: YENİ EKLENEN METOTLAR
// ==========================================

const findStudentByUserId = async (userId) => {
  const student = await Student.findOne({ where: { userId } });

  if (!student) {
    throw { status: 404, message: "Öğrenci profili bulunamadı." };
  }

  return student;
};

/**
 * Giriş yapan öğrencinin tüm notlarını getirir
 */
const getMyGrades = async (userId) => {
  const student = await findStudentByUserId(userId);

  const enrollments = await Enrollment.findAll({
    where: { studentId: student.id },
    include: [
      { model: Course, as: "course" },
      { model: Grade, as: "grade" }
    ]
  });

  return enrollments
    .filter((enrollment) => enrollment.grade)
    .map((enrollment) => ({
      enrollmentId: enrollment.id,
      course: enrollment.course,
      semester: enrollment.semester,
      academicYear: enrollment.academicYear,
      grade: enrollment.grade
    }));
};

/**
 * Öğrencinin transkript verisini (dönem bazlı gruplu + GPA/CGPA) hesaplar
 */
const getTranscript = async (userId) => {
  const student = await Student.findOne({
    where: { userId },
    include: [{ model: User, as: "user", attributes: ["id", "fullName", "email"] }]
  });

  if (!student) {
    throw { status: 404, message: "Öğrenci profili bulunamadı." };
  }

  const enrollments = await Enrollment.findAll({
    where: { studentId: student.id },
    include: [
      { model: Course, as: "course" },
      { model: Grade, as: "grade" }
    ]
  });

  const gradedEnrollments = enrollments.filter((enrollment) => enrollment.grade);

  const semesterMap = {};

  gradedEnrollments.forEach((enrollment) => {
    const key = `${enrollment.academicYear} - ${enrollment.semester}`;

    if (!semesterMap[key]) {
      semesterMap[key] = {
        academicYear: enrollment.academicYear,
        semester: enrollment.semester,
        courses: [],
        totalCredits: 0,
        totalPoints: 0
      };
    }

    const credit = enrollment.course.credit || 0;
    const letterGrade = enrollment.grade.letterGrade;
    const point = LETTER_GRADE_POINTS[letterGrade] ?? 0;

    semesterMap[key].courses.push({
      courseCode: enrollment.course.courseCode,
      courseName: enrollment.course.courseName,
      credit,
      average: enrollment.grade.average,
      letterGrade,
      status: enrollment.grade.status
    });

    semesterMap[key].totalCredits += credit;
    semesterMap[key].totalPoints += credit * point;
  });

  const semesters = Object.values(semesterMap).map((sem) => ({
    ...sem,
    gpa: sem.totalCredits > 0 ? Number((sem.totalPoints / sem.totalCredits).toFixed(2)) : 0
  }));

  const overallCredits = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);
  const overallPoints = semesters.reduce((sum, sem) => sum + sem.totalPoints, 0);
  const cgpa = overallCredits > 0 ? Number((overallPoints / overallCredits).toFixed(2)) : 0;

  return {
    student: {
      fullName: student.user.fullName,
      email: student.user.email,
      studentNumber: student.studentNumber
    },
    semesters,
    totalCredits: overallCredits,
    cgpa
  };
};

/**
 * Öğrencinin transkriptini PDF belgesi olarak üretir
 */
const generateTranscriptPdf = async (userId) => {
  const transcriptData = await getTranscript(userId);

  const doc = new PDFDocument({ margin: 40 });

  doc.fontSize(18).text("Resmi Transkript", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Ad Soyad: ${transcriptData.student.fullName}`);
  doc.text(`E-posta: ${transcriptData.student.email}`);

  if (transcriptData.student.studentNumber) {
    doc.text(`Öğrenci No: ${transcriptData.student.studentNumber}`);
  }

  doc.moveDown();

  transcriptData.semesters.forEach((sem) => {
    doc.fontSize(14).text(`${sem.academicYear} - ${sem.semester}`, { underline: true });
    doc.moveDown(0.5);

    sem.courses.forEach((course) => {
      doc
        .fontSize(11)
        .text(
          `${course.courseCode} - ${course.courseName} | Kredi: ${course.credit} | Not: ${course.letterGrade} (${course.average}) | ${course.status}`
        );
    });

    doc.moveDown(0.3);
    doc.fontSize(12).text(`Dönem Ortalaması (GPA): ${sem.gpa}`);
    doc.moveDown();
  });

  doc.fontSize(14).text(`Genel Ağırlıklı Ortalama (CGPA): ${transcriptData.cgpa}`, {
    underline: true
  });

  return doc;
};

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getMyGrades,
  getTranscript,
  generateTranscriptPdf
};