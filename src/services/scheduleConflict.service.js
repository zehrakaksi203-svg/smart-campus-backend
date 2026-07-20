const { Enrollment, CourseSection } = require("../../models");

/**
 * "HH:MM" ya da "HH:MM:SS" formatındaki bir saati, gün başlangıcından
 * itibaren geçen dakika sayısına çevirir. Karşılaştırmayı basitleştirir.
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * İki section'ın aynı gün ve çakışan saat aralığında olup olmadığını
 * kontrol eder. Farklı günlerse ya da saat aralıkları kesişmiyorsa
 * çakışma yoktur.
 */
const timeOverlap = (sectionA, sectionB) => {
  if (sectionA.dayOfWeek !== sectionB.dayOfWeek) {
    return false;
  }

  const aStart = timeToMinutes(sectionA.startTime);
  const aEnd = timeToMinutes(sectionA.endTime);
  const bStart = timeToMinutes(sectionB.startTime);
  const bEnd = timeToMinutes(sectionB.endTime);

  return aStart < bEnd && bStart < aEnd;
};

/**
 * Bir öğrencinin belirli bir dönemdeki (semester/academicYear) aktif
 * kayıtlarına ait section'ların listesini döner. Bu, öğrencinin
 * "mevcut ders programı"dır.
 */
const getStudentSchedule = async (studentId, semester, academicYear) => {
  const enrollments = await Enrollment.findAll({
    where: {
      studentId,
      semester,
      academicYear,
      status: "Active"
    },
    include: [
      {
        model: CourseSection,
        as: "section",
        required: true
      }
    ]
  });

  return enrollments.map((enrollment) => enrollment.section);
};

/**
 * Öğrencinin mevcut ders programı ile kayıt olmak istediği yeni section
 * arasında zaman çakışması olup olmadığını kontrol eder. Çakışma varsa
 * hata fırlatır.
 */
const hasScheduleConflict = async (studentId, newSectionId, semester, academicYear) => {
    const newSection = await CourseSection.findOne({
        where: {
          id: newSectionId,
          isActive: true
        }
      });

  if (!newSection) {
    throw { status: 404, message: "Section bulunamadı." };
  }

  const currentSchedule = await getStudentSchedule(studentId, semester, academicYear);

  const conflict = currentSchedule.some((existingSection) =>
    timeOverlap(existingSection, newSection)
  );

  if (conflict) {
    throw {
      status: 400,
      message: "Seçilen section, mevcut ders programınızla zaman çakışması yaratıyor."
    };
  }
};

module.exports = {
  timeToMinutes,
  timeOverlap,
  getStudentSchedule,
  hasScheduleConflict
};