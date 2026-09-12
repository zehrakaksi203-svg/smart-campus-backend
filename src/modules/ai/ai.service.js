
const axios = require("axios");
const { getMyAttendance } = require("../attendanceSessions/attendanceSession.service");
const {
  getMyEnrollments
} = require("../enrollments/enrollment.service");

const {
  getMyGrades
} = require("../grades/grade.service");
const { getMyExams } = require("../exams/exam.service");

const NVIDIA_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";

async function askAI(message, userId) {
  try {
    // Öğrencinin aktif derslerini getir
    const enrollments = await getMyEnrollments(userId);

    // Öğrencinin notlarını getir
    const grades = await getMyGrades(userId);
    const exams = await getMyExams(userId);
    const attendance = await getMyAttendance(userId);
    // Ders bilgilerini AI için sadeleştir
    const courses = enrollments.map((enrollment) => ({
      courseCode: enrollment.course?.courseCode,
      courseName: enrollment.course?.courseName,
      credit: enrollment.course?.credit,
      semester: enrollment.course?.semester,
      year: enrollment.course?.year,
      section: enrollment.section?.sectionCode,

      instructor:
        enrollment.section?.faculty?.user?.fullName ||
        "Belirtilmemiş",

      classroom: enrollment.section?.classroom,
      day: enrollment.section?.dayOfWeek,
      startTime: enrollment.section?.startTime,
      endTime: enrollment.section?.endTime
    }));

    // Not bilgilerini AI için sadeleştir
    const gradeData = grades.map((item) => ({
      courseCode: item.course?.courseCode,
      courseName: item.course?.courseName,
      semester: item.semester,
      academicYear: item.academicYear,

      midterm: item.grade?.midterm ?? null,
      final: item.grade?.final ?? null,

      // Bütünleme gerçekten yoksa null gönder
      makeup:
        item.grade?.makeup !== null &&
        item.grade?.makeup !== undefined
          ? item.grade.makeup
          : null,

      average: item.grade?.average ?? null,
      letterGrade: item.grade?.letterGrade ?? null,
      status: item.grade?.status ?? null
    }));
    const examData = exams.map((exam) => ({
      
      
      courseCode: exam.course?.courseCode,
      courseName: exam.course?.courseName,
      examType: exam.examType,
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      classroom: exam.classroom,
      status: exam.status
      
    }));
    const attendanceData = attendance.map((item) => ({
      courseName: item.courseName,
      totalSessions: item.totalSessions,
      attendedSessions: item.attendedSessions,
      absentCount: item.absentCount,
      attendanceRate: item.attendanceRate,
      status: item.status
    }));
    console.log("AI EXAM DATA:", JSON.stringify(examData, null, 2));
    const studentContext = JSON.stringify(
      {
        courses,
        grades: gradeData,
        exams: examData,
        attendance: attendanceData
      },
      null,
      2
    );
 
    const response = await axios.post(
      NVIDIA_URL,
      {
        model:
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",

        messages: [
          {
            role: "system",
            content: `
Sen Smart Campus üniversite otomasyon sisteminin yapay zeka asistanısın.

Öğrencilere dersler, sınavlar, notlar ve devamsızlık konularında yardımcı ol.

Giriş yapan öğrencinin Smart Campus sisteminden alınan kişisel akademik bilgileri aşağıdadır:

${studentContext}

ÖNEMLİ KURALLAR:

1. Yalnızca yukarıdaki öğrenci verilerini kullan.

2. Verilerde bulunmayan hiçbir bilgiyi uydurma veya tahmin etme.

3. Öğrencinin başka bir öğrencinin bilgilerine erişmesine veya başka bir öğrencinin bilgilerini açıklamasına izin verme.

4. Türkçe cevap ver.

5. Cevaplarını anlaşılır, kısa ve doğrudan ver.

6. Ders sorularında şu bilgileri kullanabilirsin:
   - ders kodu
   - ders adı
   - kredi
   - sınıf/şube
   - öğretim elemanı
   - gün
   - başlangıç saati
   - bitiş saati
   - sınıf

7. NOTLAR İÇİN ALANLARIN ANLAMLARI:
   - midterm = Vize notu
   - final = Final notu
   - makeup = Bütünleme notu
   - average = Ortalama
   - letterGrade = Harf notu
   - status = Başarı durumu

8. ÇOK ÖNEMLİ:
   - makeup null ise "Bütünleme: Girilmemiş" yaz.
   - makeup null olduğunda average değerini kesinlikle bütünleme olarak gösterme.
   - average yalnızca "Ortalama" olarak gösterilmelidir.
   - Vize, final, bütünleme ve ortalama birbirinden farklı alanlardır.
   - Bir alanın değerini başka bir alanın yerine kullanma.

9. Başarı durumu:
   - status = "Passed" ise "Geçti"
   - status = "Failed" ise "Kaldı"

10. Öğrenci "notlarım", "notlarım nasıl", "hangi notları aldım" gibi genel bir soru sorarsa mevcut tüm notlarını ders ders özetle.

11. Öğrenci belirli bir dersin notunu sorarsa yalnızca o dersin verilerini göster.

12. Bir ders için not girilmemişse bunu açıkça "Girilmemiş" olarak belirt.

13. Öğrenci verilerinde olmayan bir notu kesinlikle oluşturma.

14. Notları gösterirken mümkünse şu formatı kullan:

Ders Kodu – Ders Adı
- Vize:
- Final:
- Bütünleme:
- Ortalama:
- Harf notu:
- Başarı durumu:


15.SINAVLAR İÇİN:
   - Öğrencinin yalnızca kendi sınavlarını kullan.
   - examType = sınav türü
   - examDate = sınav tarihi
   - startTime = başlangıç saati
   - endTime = bitiş saati
   - classroom = sınav sınıfı
   - status = sınav durumu
   - Öğrenci "sınavlarım", "sınav programım", "hangi sınavlarım var" gibi genel bir soru sorarsa tüm sınavlarını tarih sırasına göre listele.
   - Öğrenci belirli bir dersin sınavını sorarsa yalnızca o dersin sınav bilgisini göster.
   - Verilerde bulunmayan sınav tarihi, saati veya sınıfı uydurma.
   - examType değerlerini anlaşılır Türkçe olarak göster.
   - Sınav tarihi ve saatini mümkün olduğunca şu formatta göster:
     Ders Kodu – Ders Adı
     - Sınav türü:
     - Tarih:
     - Saat:
     - Sınıf:
     - Durum:

     16. DEVAMSIZLIK İÇİN:
   - totalSessions = toplam ders oturumu sayısı
   - attendedSessions = katıldığı oturum sayısı
   - absentCount = katılmadığı oturum sayısı
   - attendanceRate = devam yüzdesi
   - status = "OK" ise "Normal", "Warning" ise "Dikkat", "Critical" ise "Kritik" olarak göster
   - Öğrenci "devamsızlığım", "yoklama durumum" gibi genel bir soru sorarsa tüm derslerini listele
   - Öğrenci belirli bir dersin devamsızlığını sorarsa yalnızca o dersi göster
   - Verilerde olmayan bir devamsızlık bilgisi uydurma
   - Formatı şu şekilde göster:
     Ders Adı
     - Toplam oturum:
     - Katıldığı:
     - Katılmadığı:
     - Devam oranı: %
     - Durum:

`
          },

          {
            role: "user",
            content: message
          }
        ],

        max_tokens: 2048,
        temperature: 0.6,
        top_p: 0.95,
        stream: false
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.NVIDIA_API_KEY}`,

          Accept: "application/json",

          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {

    console.error(
      "NVIDIA HATASI:",
      error.response?.status,
      error.response?.data || error.message
    );

    if (error.response?.status === 503) {
      throw {
        status: 503,
        message:
          "NVIDIA yapay zeka servisi şu anda yoğun. Lütfen biraz sonra tekrar deneyin."
      };
    }

    throw error;
  }
}

module.exports = {
  askAI
};

