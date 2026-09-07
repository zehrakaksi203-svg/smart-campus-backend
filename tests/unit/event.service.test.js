// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("qrcode", () => ({
    toDataURL: jest.fn()
  }));
  
  jest.mock("../../models", () => ({
    Event: {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn()
    },
    EventRegistration: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn()
    }
  }));
  
  const QRCode = require("qrcode");
  const { Event, EventRegistration } = require("../../models");
  
  const {
    createEvent,
    getAllEvents,
    getEventById,
    registerForEvent,
    getMyRegistrations,
    generateRegistrationQr,
    validateRegistrationQr
  } = require("../../src/modules/events/event.service");
  
  describe("EventService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("createEvent", () => {
      test("status verilmezse varsayılan olarak 'Scheduled' kullanılır", async () => {
        Event.create.mockResolvedValue({ id: 1 });
  
        await createEvent({
          title: "Bahar Şenliği",
          eventDate: "2026-05-01",
          location: "Kampüs Meydanı",
          capacity: 500,
          organizerId: 3
        });
  
        expect(Event.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: "Scheduled" })
        );
      });
    });
  
    describe("getAllEvents", () => {
      test("etkinlikleri eventDate'e göre artan sırada döner", async () => {
        Event.findAll.mockResolvedValue([{ id: 1 }]);
  
        const result = await getAllEvents();
  
        expect(Event.findAll).toHaveBeenCalledWith({ order: [["eventDate", "ASC"]] });
        expect(result).toHaveLength(1);
      });
    });
  
    describe("getEventById", () => {
      test("etkinlik bulunamazsa hata fırlatır", async () => {
        Event.findByPk.mockResolvedValue(null);
  
        await expect(getEventById(999)).rejects.toThrow("Etkinlik bulunamadı.");
      });
  
      test("etkinlik varsa döner", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, title: "Bahar Şenliği" });
  
        const result = await getEventById(1);
  
        expect(result.title).toBe("Bahar Şenliği");
      });
    });
  
    describe("registerForEvent", () => {
      test("etkinlik bulunamazsa hata fırlatır", async () => {
        Event.findByPk.mockResolvedValue(null);
  
        await expect(registerForEvent({ studentId: 1, eventId: 99 })).rejects.toThrow(
          "Etkinlik bulunamadı."
        );
      });
  
      test("etkinlik 'Scheduled' durumunda değilse hata fırlatır", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, status: "Cancelled", capacity: 10 });
  
        await expect(registerForEvent({ studentId: 1, eventId: 1 })).rejects.toThrow(
          "Bu etkinlik kayıt için uygun değil."
        );
      });
  
      test("öğrenci zaten kayıtlıysa hata fırlatır", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, status: "Scheduled", capacity: 10 });
        EventRegistration.findOne.mockResolvedValue({ id: 5 });
  
        await expect(registerForEvent({ studentId: 1, eventId: 1 })).rejects.toThrow(
          "Bu etkinliğe zaten kayıtlısınız."
        );
      });
  
      test("kontenjan dolu ise hata fırlatır", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, status: "Scheduled", capacity: 2 });
        EventRegistration.findOne.mockResolvedValue(null);
        EventRegistration.count.mockResolvedValue(2);
  
        await expect(registerForEvent({ studentId: 1, eventId: 1 })).rejects.toThrow(
          "Etkinlik kontenjanı dolu."
        );
        expect(EventRegistration.create).not.toHaveBeenCalled();
      });
  
      test("kontenjan hesaplaması yalnızca 'Registered' durumundaki kayıtları sayar", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, status: "Scheduled", capacity: 5 });
        EventRegistration.findOne.mockResolvedValue(null);
        EventRegistration.count.mockResolvedValue(0);
        EventRegistration.create.mockResolvedValue({ id: 1 });
  
        await registerForEvent({ studentId: 1, eventId: 1 });
  
        expect(EventRegistration.count).toHaveBeenCalledWith(
          expect.objectContaining({ where: { eventId: 1, status: "Registered" } })
        );
      });
  
      test("uygun durumda kayıt başarıyla oluşturulur", async () => {
        Event.findByPk.mockResolvedValue({ id: 1, status: "Scheduled", capacity: 5 });
        EventRegistration.findOne.mockResolvedValue(null);
        EventRegistration.count.mockResolvedValue(1);
        EventRegistration.create.mockResolvedValue({ id: 10, status: "Registered" });
  
        const result = await registerForEvent({ studentId: 1, eventId: 1 });
  
        expect(EventRegistration.create).toHaveBeenCalledWith({
          eventId: 1,
          studentId: 1,
          status: "Registered",
          qrUsed: false
        });
        expect(result.status).toBe("Registered");
      });
    });
  
    describe("getMyRegistrations", () => {
      test("öğrencinin kayıtlarını etkinlik bilgisiyle birlikte, en yeniden eskiye döner", async () => {
        EventRegistration.findAll.mockResolvedValue([{ id: 1 }]);
  
        const result = await getMyRegistrations(7);
  
        expect(EventRegistration.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { studentId: 7 },
            order: [["createdAt", "DESC"]]
          })
        );
        expect(result).toHaveLength(1);
      });
    });
  
    describe("generateRegistrationQr", () => {
      test("kayıt bulunamazsa hata fırlatır", async () => {
        EventRegistration.findOne.mockResolvedValue(null);
  
        await expect(generateRegistrationQr(1, 5)).rejects.toThrow("Kayıt bulunamadı.");
      });
  
      test("kayıt 'Registered' durumunda değilse hata fırlatır", async () => {
        EventRegistration.findOne.mockResolvedValue({ id: 1, status: "Cancelled", qrUsed: false });
  
        await expect(generateRegistrationQr(1, 5)).rejects.toThrow("Bu kayıt aktif değil.");
      });
  
      test("QR daha önce kullanılmışsa hata fırlatır", async () => {
        EventRegistration.findOne.mockResolvedValue({ id: 1, status: "Registered", qrUsed: true });
  
        await expect(generateRegistrationQr(1, 5)).rejects.toThrow(
          "Bu kaydın QR kodu daha önce kullanılmış."
        );
      });
  
      test("geçerli kayıt için QR üretir ve kaydeder", async () => {
        const update = jest.fn().mockResolvedValue();
        EventRegistration.findOne.mockResolvedValue({
          id: 1,
          status: "Registered",
          qrUsed: false,
          update
        });
        QRCode.toDataURL.mockResolvedValue("data:image/png;base64,XYZ");
  
        const result = await generateRegistrationQr(1, 5);
  
        expect(update).toHaveBeenCalledWith({ qrCode: "data:image/png;base64,XYZ" });
        expect(result).toEqual({ registrationId: 1, qrCode: "data:image/png;base64,XYZ" });
      });
    });
  
    describe("validateRegistrationQr", () => {
      test("geçersiz JSON için hata fırlatır", async () => {
        await expect(validateRegistrationQr("bozuk-json")).rejects.toThrow("Geçersiz QR kodu.");
      });
  
      test("registrationId veya token eksikse hata fırlatır", async () => {
        await expect(validateRegistrationQr(JSON.stringify({ token: "abc" }))).rejects.toThrow(
          "Geçersiz QR verisi."
        );
      });
  
      test("kayıt bulunamazsa hata fırlatır", async () => {
        EventRegistration.findByPk.mockResolvedValue(null);
  
        await expect(
          validateRegistrationQr(JSON.stringify({ registrationId: 1, token: "abc" }))
        ).rejects.toThrow("Kayıt bulunamadı.");
      });
  
      test("kayıt 'Registered' değilse hata fırlatır", async () => {
        EventRegistration.findByPk.mockResolvedValue({ id: 1, status: "Cancelled", qrUsed: false });
  
        await expect(
          validateRegistrationQr(JSON.stringify({ registrationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu kayıt aktif değil.");
      });
  
      test("QR zaten kullanılmışsa hata fırlatır", async () => {
        EventRegistration.findByPk.mockResolvedValue({ id: 1, status: "Registered", qrUsed: true });
  
        await expect(
          validateRegistrationQr(JSON.stringify({ registrationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu QR kod daha önce kullanılmış.");
      });
  
      test("QR hiç üretilmemişse hata fırlatır", async () => {
        EventRegistration.findByPk.mockResolvedValue({
          id: 1,
          status: "Registered",
          qrUsed: false,
          qrCode: null
        });
  
        await expect(
          validateRegistrationQr(JSON.stringify({ registrationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu kayıt için QR kod oluşturulmamış.");
      });
  
      test("token uyuşmuyorsa hata fırlatır", async () => {
        EventRegistration.findByPk.mockResolvedValue({
          id: 1,
          status: "Registered",
          qrUsed: false,
          qrCode: "kayitli-kod"
        });
        QRCode.toDataURL.mockResolvedValue("farkli-kod");
  
        await expect(
          validateRegistrationQr(JSON.stringify({ registrationId: 1, token: "abc" }))
        ).rejects.toThrow("Geçersiz veya değiştirilmiş QR kodu.");
      });
  
      // BULGU: Meal modülünün aksine (status='Used'), burada QR ile başarılı giriş yapıldığında
      // kaydın durumu 'Cancelled' olarak işaretleniyor. Muhtemelen meal.service'ten kopyalanırken
      // isim güncellenmemiş - "check-in yapıldı" durumu "iptal edildi" gibi görünüyor.
      // Bu, kaydı "Cancelled" filtreleyen başka bir ekranda yanlışlıkla gizlenmesine yol açabilir.
      test("BULGU: geçerli QR doğrulamasında kayıt durumu yanlışlıkla 'Cancelled' yapılıyor (olması gereken: check-in/used)", async () => {
        const update = jest.fn().mockResolvedValue();
        const matchingQr = "eslesen-kod";
        EventRegistration.findByPk.mockResolvedValue({
          id: 1,
          status: "Registered",
          qrUsed: false,
          qrCode: matchingQr,
          update
        });
        QRCode.toDataURL.mockResolvedValue(matchingQr);
  
        const result = await validateRegistrationQr(
          JSON.stringify({ registrationId: 1, token: "abc" })
        );
  
        expect(update).toHaveBeenCalledWith({ qrUsed: true, status: "Cancelled" });
        expect(result.success).toBe(true);
      });
    });
  });