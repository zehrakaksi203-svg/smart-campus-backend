
const axios = require("axios");

const {
  getMyAttendance
} = require("../attendanceSessions/attendanceSession.service");

const {
  getMyEnrollments
} = require("../enrollments/enrollment.service");

const {
  getMyGrades
} = require("../grades/grade.service");

const {
  getMyExams
} = require("../exams/exam.service");

const {
  getAllMeals
} = require("../meals/meal.service");

const {
  getAllEvents
} = require("../events/event.service");

const {
  getMyNotifications,
  getUnreadCount
} = require("../notifications/notification.service");

const NVIDIA_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";


/* =========================================================
   YARDIMCI FONKSİYONLAR
========================================================= */


/**
 * Kullanıcının mesajından hangi bilgiye ihtiyaç olduğunu belirler.
 */
function detectIntent(message) {
  const text = message
    .toLocaleLowerCase("tr-TR")
    .trim();


  /* =========================
     YEMEK
  ========================= */

  if (
    text.includes("yemek") ||
    text.includes("menü") ||
    text.includes("menu") ||
    text.includes("öğle yemeği") ||
    text.includes("ogle yemegi") ||
    text.includes("bugün ne var") ||
    text.includes("bugun ne var")
  ) {
    return "meals";
  }


  /* =========================
     ETKİNLİK
  ========================= */

  if (
    text.includes("etkinlik") ||
    text.includes("etkinlikler") ||
    text.includes("şenlik") ||
    text.includes("senlik") ||
    text.includes("kampüs etkinliği") ||
    text.includes("kampus etkinligi")
  ) {
    return "events";
  }


  /* =========================
     BİLDİRİM
  ========================= */

  if (
    text.includes("bildirim") ||
    text.includes("bildirimler") ||
    text.includes("duyuru bildirimi") ||
    text.includes("okunmamış") ||
    text.includes("okunmamis")
  ) {
    return "notifications";
  }


  /* =========================
     NOTLAR
  ========================= */

  if (
    text.includes("not") ||
    text.includes("ortalama") ||
    text.includes("vize") ||
    text.includes("final") ||
    text.includes("bütünleme") ||
    text.includes("butunleme") ||
    text.includes("harf not")
  ) {
    return "grades";
  }


  /* =========================
     SINAVLAR
  ========================= */

  if (
    text.includes("sınav") ||
    text.includes("sinav") ||
    text.includes("sınavlarım") ||
    text.includes("sinavlarim")
  ) {
    return "exams";
  }


  /* =========================
     DEVAMSIZLIK
  ========================= */

  if (
    text.includes("devamsız") ||
    text.includes("devamsiz") ||
    text.includes("yoklama") ||
    text.includes("devam oran") ||
    text.includes("kaç kere gelmedim") ||
    text.includes("kac kere gelmedim")
  ) {
    return "attendance";
  }


  /* =========================
     DERSLER
  ========================= */

  if (
    text.includes("derslerim") ||
    text.includes("aldığım ders") ||
    text.includes("aldigim ders") ||
    text.includes("kayıtlı ders") ||
    text.includes("kayitli ders") ||
    text.includes("ders program") ||
    text.includes("bugün hangi ders") ||
    text.includes("bugun hangi ders") ||
    text.includes("yarın hangi ders") ||
    text.includes("yarin hangi ders")
  ) {
    return "courses";
  }


  return "general";
}


/**
 * YYYY-MM-DD formatında tarih döndürür.
 */
function formatDate(date) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    console.warn("GEÇERSİZ TARİH:", date);
    return null;
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(parsedDate);
}

/**
 * Bugünün tarihini döndürür.
 */
function getToday() {
  return formatDate(new Date());
}


/**
 * Yarınki tarihi döndürür.
 */
function getTomorrow() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return formatDate(date);
}


/**
 * Kullanıcının mesajında yarın ifadesi var mı?
 */
function asksTomorrow(message) {
  const text = message.toLocaleLowerCase("tr-TR");

  return (
    text.includes("yarın") ||
    text.includes("yarin")
  );
}


/**
 * Kullanıcının mesajında bugün ifadesi var mı?
 */
function asksToday(message) {
  const text = message.toLocaleLowerCase("tr-TR");

  return (
    text.includes("bugün") ||
    text.includes("bugun")
  );
}


/* =========================================================
   VERİ HAZIRLAMA
========================================================= */


function prepareCourses(enrollments) {
  return enrollments.map((enrollment) => ({
    courseCode:
      enrollment.course?.courseCode ?? null,

    courseName:
      enrollment.course?.courseName ?? null,

    credit:
      enrollment.course?.credit ?? null,

    semester:
      enrollment.course?.semester ?? null,

    year:
      enrollment.course?.year ?? null,

    section:
      enrollment.section?.sectionCode ?? null,

    instructor:
      enrollment.section?.faculty?.user?.fullName ||
      "Belirtilmemiş",

    classroom:
      enrollment.section?.classroom ?? null,

    day:
      enrollment.section?.dayOfWeek ?? null,

    startTime:
      enrollment.section?.startTime ?? null,

    endTime:
      enrollment.section?.endTime ?? null
  }));
}


function prepareGrades(grades) {
  return grades.map((item) => ({
    courseCode:
      item.course?.courseCode ?? null,

    courseName:
      item.course?.courseName ?? null,

    semester:
      item.semester ?? null,

    academicYear:
      item.academicYear ?? null,

    midterm:
      item.grade?.midterm ?? null,

    final:
      item.grade?.final ?? null,

    makeup:
      item.grade?.makeup ?? null,

    average:
      item.grade?.average ?? null,

    letterGrade:
      item.grade?.letterGrade ?? null,

    status:
      item.grade?.status ?? null
  }));
}


function prepareExams(exams) {
  return exams.map((exam) => ({
    courseCode:
      exam.course?.courseCode ?? null,

    courseName:
      exam.course?.courseName ?? null,

    examType:
      exam.examType ?? null,

    examDate:
      exam.examDate ?? null,

    startTime:
      exam.startTime ?? null,

    endTime:
      exam.endTime ?? null,

    classroom:
      exam.classroom ?? null,

    status:
      exam.status ?? null
  }));
}


function prepareAttendance(attendance) {
  return attendance.map((item) => ({
    courseName:
      item.courseName ?? null,

    totalSessions:
      item.totalSessions ?? null,

    attendedSessions:
      item.attendedSessions ?? null,

    absentCount:
      item.absentCount ?? null,

    attendanceRate:
      item.attendanceRate ?? null,

    status:
      item.status ?? null
  }));
}


/**
 * Yemekleri hazırlar.
 */
function prepareMeals(meals) {
  return meals.map((meal) => ({
    name:
      meal.name ?? null,

    description:
      meal.description ?? null,

    price:
      meal.price ?? null,

    quota:
      meal.quota ?? null,

    availableDate:
      meal.availableDate ?? null,

    isActive:
      meal.isActive ?? null
  }));
}


/**
 * Etkinlikleri hazırlar.
 */
function prepareEvents(events) {
  return events.map((event) => ({
    title:
      event.title ?? null,

    description:
      event.description ?? null,

    eventDate:
      event.eventDate ?? null,

    location:
      event.location ?? null,

    capacity:
      event.capacity ?? null,

    status:
      event.status ?? null
  }));
}


/**
 * Bildirimleri hazırlar.
 */
function prepareNotifications(notifications) {
  return notifications.map((notification) => ({
    title:
      notification.title ?? null,

    message:
      notification.message ?? null,

    type:
      notification.type ?? null,

    isRead:
      notification.isRead ?? null,

    createdAt:
      notification.createdAt ?? null
  }));
}


/* =========================================================
   NVIDIA
========================================================= */


async function askNvidia(message, studentContext) {

  const response = await axios.post(
    NVIDIA_URL,
    {
      model:
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",

      messages: [
        {
          role: "system",

          content: `
Sen Smart Campus üniversite otomasyon sisteminin
yapay zeka asistanısın.

Öğrenciye yalnızca kendisine ait Smart Campus
verileri üzerinden yardımcı ol.

ÖNEMLİ KURALLAR:

1. Yalnızca verilen verileri kullan.
2. Verilerde bulunmayan bilgileri uydurma.
3. Başka öğrencilerin bilgilerini verme.
4. Türkçe cevap ver.
5. Kısa, anlaşılır ve doğrudan cevap ver.
6. Kullanıcının sorusuyla ilgisiz bilgileri gösterme.
7. Bilgi verilerde yoksa açıkça belirt.
8. Tarih, saat, not, devamsızlık veya sınıf bilgisi uydurma.
9. Kullanıcı başka bir öğrencinin bilgilerini isterse
   bunu reddet.
10. Kullanıcı "benim", "bana", "derslerim", "notlarım"
    gibi ifadeler kullandığında yalnızca verilen
    giriş yapan öğrenci verilerini kullan.

YEMEKLER:

- name = yemek adı
- description = açıklama
- price = fiyat
- quota = kontenjan
- availableDate = bulunabilirlik tarihi
- isActive = aktiflik durumu

ETKİNLİKLER:

- title = etkinlik adı
- description = açıklama
- eventDate = etkinlik tarihi
- location = konum
- capacity = kapasite
- status = etkinlik durumu

BİLDİRİMLER:

- title = başlık
- message = mesaj
- type = bildirim türü
- isRead = okunma durumu
- createdAt = oluşturulma zamanı

NOTLAR:

- midterm = Vize
- final = Final
- makeup = Bütünleme
- average = Ortalama
- letterGrade = Harf notu
- status = Başarı durumu

makeup null ise:
"Bütünleme: Girilmemiş"

average değerini kesinlikle
bütünleme olarak kullanma.

status:
- Passed = Geçti
- Failed = Kaldı

SINAVLAR:

- examType = sınav türü
- examDate = sınav tarihi
- startTime = başlangıç saati
- endTime = bitiş saati
- classroom = sınav sınıfı
- status = sınav durumu

DEVAMSIZLIK:

- totalSessions = toplam oturum
- attendedSessions = katıldığı
- absentCount = katılmadığı
- attendanceRate = devam oranı

status:
- OK = Normal
- Warning = Dikkat
- Critical = Kritik

DERSLER:

- courseCode = ders kodu
- courseName = ders adı
- credit = kredi
- section = şube
- instructor = öğretim elemanı
- classroom = sınıf
- day = gün
- startTime = başlangıç
- endTime = bitiş

KULLANICI TARİH SORULARI:

"Bugün" ifadesi bugün olarak,
"yarın" ifadesi yarın olarak değerlendirilmiştir.

Verilen verilerde o güne ait kayıt yoksa
kayıt olmadığını söyle.

ÖRNEK CEVAP BİÇİMLERİ:

Yemek:
🍽️ Yemek adı
- Açıklama:
- Fiyat:

Etkinlik:
🎉 Etkinlik adı
- Tarih:
- Konum:
- Durum:

Bildirim:
🔔 Başlık
Mesaj

Ders:
📚 Ders Kodu – Ders Adı
- Öğretim elemanı:
- Gün:
- Saat:
- Sınıf:

Öğrenci verileri:

${studentContext}
`
        },

        {
          role: "user",
          content: message
        }
      ],

      max_tokens: 2048,

      temperature: 0.4,

      top_p: 0.9,

      stream: false
    },

    {
      headers: {
        Authorization:
          `Bearer ${process.env.NVIDIA_API_KEY}`,

        Accept: "application/json",

        "Content-Type":
          "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}


/* =========================================================
   ANA FONKSİYON
========================================================= */


async function askAI(message, userId) {

  try {

    const intent =
      detectIntent(message);

    console.log(
      "AI INTENT:",
      intent
    );


    let studentContext = {};


    /* =====================================================
       YEMEK
    ===================================================== */

    if (intent === "meals") {

      const meals =
        await getAllMeals();

      let filteredMeals = meals;

      /*
       * "Bugün" deniyorsa sadece bugünkü yemekleri al.
       */

      if (asksToday(message)) {

        const today =
          getToday();

        filteredMeals = meals.filter(
          (meal) =>
            meal.availableDate &&
            formatDate(
              meal.availableDate
            ) === today
        );
      }


      /*
       * "Yarın" deniyorsa sadece yarınki yemekleri al.
       */

      else if (asksTomorrow(message)) {

        const tomorrow =
          getTomorrow();

        filteredMeals = meals.filter(
          (meal) =>
            meal.availableDate &&
            formatDate(
              meal.availableDate
            ) === tomorrow
        );
      }


      studentContext = {
        meals:
          prepareMeals(filteredMeals)
      };
    }


    /* =====================================================
       ETKİNLİK
    ===================================================== */

    else if (intent === "events") {

      const events =
        await getAllEvents();

      let filteredEvents =
        events;

      if (asksToday(message)) {

        const today =
          getToday();

        filteredEvents =
          events.filter(
            (event) =>
              event.eventDate &&
              formatDate(
                event.eventDate
              ) === today
          );
      }

      else if (asksTomorrow(message)) {

        const tomorrow =
          getTomorrow();

        filteredEvents =
          events.filter(
            (event) =>
              event.eventDate &&
              formatDate(
                event.eventDate
              ) === tomorrow
          );
      }


      studentContext = {
        events:
          prepareEvents(
            filteredEvents
          )
      };
    }


    /* =====================================================
       BİLDİRİMLER
    ===================================================== */

    else if (intent === "notifications") {

      const unreadCount =
        await getUnreadCount(userId);

      const notificationResult =
        await getMyNotifications(
          userId,
          {
            page: 1,
            limit: 20
          }
        );

      studentContext = {

        unreadCount,

        notifications:
          prepareNotifications(
            notificationResult.notifications
          )
      };
    }


    /* =====================================================
       NOTLAR
    ===================================================== */

    else if (intent === "grades") {

      const grades =
        await getMyGrades(userId);

      studentContext = {

        grades:
          prepareGrades(grades)
      };
    }


    /* =====================================================
       SINAVLAR
    ===================================================== */

    else if (intent === "exams") {

      const exams =
        await getMyExams(userId);

      let filteredExams =
        exams;

      if (asksToday(message)) {

        const today =
          getToday();

        filteredExams =
          exams.filter(
            (exam) =>
              exam.examDate &&
              formatDate(
                exam.examDate
              ) === today
          );
      }

      else if (asksTomorrow(message)) {

        const tomorrow =
          getTomorrow();

        filteredExams =
          exams.filter(
            (exam) =>
              exam.examDate &&
              formatDate(
                exam.examDate
              ) === tomorrow
          );
      }


      studentContext = {

        exams:
          prepareExams(
            filteredExams
          )
      };
    }


    /* =====================================================
       DEVAMSIZLIK
    ===================================================== */

    else if (intent === "attendance") {

      const attendance =
        await getMyAttendance(userId);

      studentContext = {

        attendance:
          prepareAttendance(
            attendance
          )
      };
    }


    /* =====================================================
       DERSLER
    ===================================================== */

    else if (intent === "courses") {

      const enrollments =
        await getMyEnrollments(userId);

      let courses =
        prepareCourses(
          enrollments
        );


      /*
       * Bugün / yarın sorularında
       * ders gününü filtrelemek için
       * şimdilik AI'a tüm dersleri gönderiyoruz.
       *
       * Bir sonraki aşamada Türkçe gün isimlerini
       * doğrudan backend'de filtreleyebiliriz.
       */

      studentContext = {
        courses
      };
    }


    /* =====================================================
       GENEL SORU
    ===================================================== */

    else {

      /*
       * Genel soruda tüm temel akademik
       * bilgileri getiriyoruz.
       */

      const [
        enrollments,
        grades,
        exams,
        attendance
      ] = await Promise.all([

        getMyEnrollments(userId),

        getMyGrades(userId),

        getMyExams(userId),

        getMyAttendance(userId)

      ]);


      studentContext = {

        courses:
          prepareCourses(
            enrollments
          ),

        grades:
          prepareGrades(
            grades
          ),

        exams:
          prepareExams(
            exams
          ),

        attendance:
          prepareAttendance(
            attendance
          )
      };
    }


    const context =
      JSON.stringify(
        studentContext,
        null,
        2
      );


    console.log(
      "AI CONTEXT:",
      context
    );


    return await askNvidia(
      message,
      context
    );

  } catch (error) {

    console.error(
      "NVIDIA HATASI:",
      error.response?.status,
      error.response?.data ||
      error.message
    );


    if (
      error.response?.status === 503
    ) {

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

