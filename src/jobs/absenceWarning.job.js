const cron = require("node-cron");
const { Enrollment, AttendanceRecord, AttendanceSession, Student, User, CourseSection, Course } = require("../../models");

/**
 * Devamsızlık Uyarı Görevi
 * Her gece 00:00'da çalışır ('0 0 * * *')
 * Test etmek istersen her dakika çalıştırmak için: '* * * * *'
 */
const startAbsenceWarningJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [CRON] Devamsızlık kontrol görevi başlatıldı...");

    try {
      // 1. Tüm aktif ders kayıtlarını ilişkili modellerle çek
      const activeEnrollments = await Enrollment.findAll({
        where: { status: "Active" },
        include: [
          {
            model: Student,
            as: "student",
            include: [{ model: User, as: "user", attributes: ["fullName", "email"] }]
          },
          {
            model: CourseSection,
            as: "section",
            include: [{ model: Course, as: "course", attributes: ["courseCode", "courseName"] }]
          }
        ]
      });

      for (const enrollment of activeEnrollments) {
        const studentId = enrollment.studentId;
        const sectionId = enrollment.sectionId;

        // 2. Bu şubede yapılan toplam ders oturumu sayısını bul
        const totalSessions = await AttendanceSession.count({
          where: { sectionId, status: "Closed" }
        });

        if (totalSessions === 0) continue; // Henüz yoklama yapılmamışsa atla

        // 3. Öğrencinin katıldığı (isFlagged: false) geçerli yoklama sayısını bul
        const attendedSessions = await AttendanceRecord.count({
          where: { studentId, isFlagged: false },
          include: [
            {
              model: AttendanceSession,
              as: "session",
              where: { sectionId, status: "Closed" }
            }
          ]
        });

        // 4. Devamsızlık Oranını Hesapla
        const absentSessions = totalSessions - attendedSessions;
        const absenceRate = (absentSessions / totalSessions) * 100;

        const studentEmail = enrollment.student?.user?.email;
        const studentName = enrollment.student?.user?.fullName;
        const courseCode = enrollment.section?.course?.courseCode;

        // 5. Kritik Sınır Kontrolleri (%30 ve %20)
        if (absenceRate >= 30) {
          console.warn(`🚨 [KRİTİK UYARI] ${studentName} (${courseCode}) - Devamsızlık Oranı: %${absenceRate.toFixed(1)}`);
          
          // E-posta / Push Bildirimi Gönderim Logu
          // Burada projenizdeki mailService.sendEmail(...) fonksiyonunu çağırabilirsiniz.
          await sendEmailNotification(
            studentEmail,
            `KRİTİK UYARI: ${courseCode} Dersi Devamsızlık Sınırı Aşıldı!`,
            `Sayın ${studentName}, ${courseCode} kodlu dersteki devamsızlık oranınız %${absenceRate.toFixed(1)} seviyesine ulaşmıştır (%30 kritik sınır aşıldı).`
          );

        } else if (absenceRate >= 20) {
          console.log(`⚠️ [DEVAMSIZLIK UYARISI] ${studentName} (${courseCode}) - Devamsızlık Oranı: %${absenceRate.toFixed(1)}`);
          
          await sendEmailNotification(
            studentEmail,
            `UYARI: ${courseCode} Dersi Devamsızlık Riski`,
            `Sayın ${studentName}, ${courseCode} kodlu dersteki devamsızlık oranınız %${absenceRate.toFixed(1)} seviyesindedir (%20 uyarı sınırı).`
          );
        }
      }

      console.log("✅ [CRON] Devamsızlık kontrol görevi başarıyla tamamlandı.");
    } catch (error) {
      console.error("❌ [CRON HATASI] Devamsızlık kontrolü yapılırken hata oluştu:", error);
    }
  });
};

/**
 * Örnek E-posta Gönderici (Mock / Entegre edilebilir)
 */
async function sendEmailNotification(to, subject, body) {
  // Projenizde nodemailer veya mail servisi varsa buraya bağlayabilirsiniz.
  console.log(`✉️ [EMAIL GÖNDERİLDİ] To: ${to} | Konu: ${subject}`);
}

module.exports = startAbsenceWarningJob;