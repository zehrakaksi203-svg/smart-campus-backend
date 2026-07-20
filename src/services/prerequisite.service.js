const { CoursePrerequisite, Enrollment, CourseSection } = require("../../models");

/**
 * Bir öğrencinin belirli bir dersi daha önce başarıyla tamamlayıp
 * tamamlamadığını kontrol eder. "Başarılı tamamlama", o derse ait bir
 * section üzerinden yapılmış, letterGrade değeri "FF" ve "F" olmayan
 * bir Enrollment kaydının varlığı anlamına gelir.
 */
const hasCompletedCourse = async (studentId, courseId) => {
  const failingGrades = ["FF", "F", "DD", "DC"];

  const completedEnrollment = await Enrollment.findOne({
    where: { studentId },
    include: [
      {
        model: CourseSection,
        as: "section",
        where: { courseId },
        required: true
      }
    ]
  });

  if (!completedEnrollment) {
    return false;
  }

  if (!completedEnrollment.letterGrade) {
    return false;
  }

  return !failingGrades.includes(completedEnrollment.letterGrade);
};

/**
 * Bir dersin doğrudan önkoşullarını döner (tek seviye, recursive değil).
 */
const getDirectPrerequisites = async (courseId) => {
  const prerequisites = await CoursePrerequisite.findAll({
    where: { courseId }
  });

  return prerequisites.map((p) => p.prerequisiteCourseId);
};

/**
 * Bir öğrencinin bir derse kayıt olabilmesi için gereken tüm önkoşulları
 * (önkoşulun önkoşulları dahil, recursive) kontrol eder. Herhangi bir
 * önkoşul tamamlanmamışsa hata fırlatır.
 *
 * visited seti, döngüsel önkoşul tanımlarında (A -> B -> A gibi bir
 * yapılandırma hatası varsa) sonsuz döngüye girmeyi engeller.
 */
const checkPrerequisites = async (courseId, studentId, visited = new Set()) => {
  if (visited.has(courseId)) {
    return;
  }
  visited.add(courseId);

  const prerequisiteCourseIds = await getDirectPrerequisites(courseId);

  for (const prerequisiteCourseId of prerequisiteCourseIds) {
    const completed = await hasCompletedCourse(studentId, prerequisiteCourseId);

    if (!completed) {
      throw {
        status: 400,
        message: `Önkoşul dersi (ID: ${prerequisiteCourseId}) tamamlanmadan bu derse kayıt olunamaz.`
      };
    }

    // Recursive kontrol: önkoşulun kendi önkoşulları da tamamlanmış mı?
    await checkPrerequisites(prerequisiteCourseId, studentId, visited);
  }
};

module.exports = {
  hasCompletedCourse,
  getDirectPrerequisites,
  checkPrerequisites
};