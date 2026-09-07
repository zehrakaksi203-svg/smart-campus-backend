// Bu dosya UNIT testtir: gerçek veritabanına bağlanmaz.

jest.mock("qrcode", () => ({
    toDataURL: jest.fn()
  }));
  
  jest.mock("../../models", () => ({
    MealReservation: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn()
    },
    Meal: {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn()
    }
  }));
  
  const QRCode = require("qrcode");
  const { MealReservation, Meal } = require("../../models");
  
  const {
    generateReservationQr,
    validateReservationQr,
    createMeal,
    createReservation,
    getAllMeals,
    getMyReservations
  } = require("../../src/modules/meals/meal.service");
  
  describe("MealService (unit)", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("generateReservationQr", () => {
      test("rezervasyon bulunamazsa hata fırlatır", async () => {
        MealReservation.findOne.mockResolvedValue(null);
  
        await expect(generateReservationQr(1, 5)).rejects.toThrow("Rezervasyon bulunamadı.");
      });
  
      test("rezervasyon başka bir öğrenciye aitse bulunamaz (studentId filtresiyle sorgulanır)", async () => {
        MealReservation.findOne.mockResolvedValue(null);
  
        await generateReservationQr(1, 5).catch(() => {});
  
        expect(MealReservation.findOne).toHaveBeenCalledWith({
          where: { id: 1, studentId: 5 }
        });
      });
  
      test("rezervasyon 'Reserved' durumunda değilse hata fırlatır", async () => {
        MealReservation.findOne.mockResolvedValue({ id: 1, status: "Used", qrUsed: false });
  
        await expect(generateReservationQr(1, 5)).rejects.toThrow("Bu rezervasyon aktif değil.");
      });
  
      test("QR kodu daha önce kullanılmışsa hata fırlatır", async () => {
        MealReservation.findOne.mockResolvedValue({ id: 1, status: "Reserved", qrUsed: true });
  
        await expect(generateReservationQr(1, 5)).rejects.toThrow(
          "Bu rezervasyonun QR kodu daha önce kullanılmış."
        );
      });
  
      test("geçerli rezervasyon için QR kod üretir ve kaydeder", async () => {
        const update = jest.fn().mockResolvedValue();
        MealReservation.findOne.mockResolvedValue({
          id: 1,
          status: "Reserved",
          qrUsed: false,
          update
        });
        QRCode.toDataURL.mockResolvedValue("data:image/png;base64,ABC");
  
        const result = await generateReservationQr(1, 5);
  
        expect(update).toHaveBeenCalledWith({ qrCode: "data:image/png;base64,ABC" });
        expect(result).toEqual({ reservationId: 1, qrCode: "data:image/png;base64,ABC" });
      });
    });
  
    describe("validateReservationQr", () => {
      test("geçersiz JSON için hata fırlatır", async () => {
        await expect(validateReservationQr("gecerli-olmayan-json")).rejects.toThrow(
          "Geçersiz QR kodu."
        );
      });
  
      test("reservationId veya token eksikse hata fırlatır", async () => {
        await expect(validateReservationQr(JSON.stringify({ token: "abc" }))).rejects.toThrow(
          "Geçersiz QR verisi."
        );
      });
  
      test("rezervasyon bulunamazsa hata fırlatır", async () => {
        MealReservation.findByPk.mockResolvedValue(null);
  
        await expect(
          validateReservationQr(JSON.stringify({ reservationId: 1, token: "abc" }))
        ).rejects.toThrow("Rezervasyon bulunamadı.");
      });
  
      test("rezervasyon 'Reserved' değilse hata fırlatır", async () => {
        MealReservation.findByPk.mockResolvedValue({ id: 1, status: "Used", qrUsed: false });
  
        await expect(
          validateReservationQr(JSON.stringify({ reservationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu rezervasyon aktif değil.");
      });
  
      test("QR zaten kullanılmışsa hata fırlatır", async () => {
        MealReservation.findByPk.mockResolvedValue({ id: 1, status: "Reserved", qrUsed: true });
  
        await expect(
          validateReservationQr(JSON.stringify({ reservationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu QR kod daha önce kullanılmış.");
      });
  
      test("rezervasyon için hiç QR üretilmemişse hata fırlatır", async () => {
        MealReservation.findByPk.mockResolvedValue({
          id: 1,
          status: "Reserved",
          qrUsed: false,
          qrCode: null
        });
  
        await expect(
          validateReservationQr(JSON.stringify({ reservationId: 1, token: "abc" }))
        ).rejects.toThrow("Bu rezervasyon için QR kod oluşturulmamış.");
      });
  
      test("token uyuşmuyorsa (üretilen QR ile kaydedilen QR farklıysa) hata fırlatır", async () => {
        MealReservation.findByPk.mockResolvedValue({
          id: 1,
          status: "Reserved",
          qrUsed: false,
          qrCode: "kayitli-qr-kodu"
        });
        QRCode.toDataURL.mockResolvedValue("uretilen-farkli-qr-kodu");
  
        await expect(
          validateReservationQr(JSON.stringify({ reservationId: 1, token: "abc" }))
        ).rejects.toThrow("Geçersiz veya değiştirilmiş QR kodu.");
      });
  
      test("geçerli ve eşleşen QR kod ile rezervasyon 'Used' olarak işaretlenir", async () => {
        const update = jest.fn().mockResolvedValue();
        const matchingQr = "eslesen-qr-kodu";
        MealReservation.findByPk.mockResolvedValue({
          id: 1,
          status: "Reserved",
          qrUsed: false,
          qrCode: matchingQr,
          update
        });
        QRCode.toDataURL.mockResolvedValue(matchingQr);
  
        const result = await validateReservationQr(
          JSON.stringify({ reservationId: 1, token: "abc" })
        );
  
        expect(update).toHaveBeenCalledWith({ qrUsed: true, status: "Used" });
        expect(result.success).toBe(true);
      });
    });
  
    describe("createMeal", () => {
      test("isActive belirtilmezse varsayılan olarak true kullanılır", async () => {
        Meal.create.mockResolvedValue({ id: 1 });
  
        await createMeal({
          name: "Tavuklu Salata",
          description: "Açıklama",
          price: 25,
          quota: 100,
          availableDate: "2026-10-01"
        });
  
        expect(Meal.create).toHaveBeenCalledWith(
          expect.objectContaining({ isActive: true })
        );
      });
  
      test("isActive açıkça false verilirse korunur", async () => {
        Meal.create.mockResolvedValue({ id: 1 });
  
        await createMeal({
          name: "Tavuklu Salata",
          price: 25,
          quota: 100,
          availableDate: "2026-10-01",
          isActive: false
        });
  
        expect(Meal.create).toHaveBeenCalledWith(
          expect.objectContaining({ isActive: false })
        );
      });
    });
  
    describe("createReservation", () => {
      test("yemek bulunamazsa hata fırlatır", async () => {
        Meal.findByPk.mockResolvedValue(null);
  
        await expect(createReservation({ studentId: 1, mealId: 99 })).rejects.toThrow(
          "Yemek bulunamadı."
        );
      });
  
      test("yemek aktif değilse hata fırlatır", async () => {
        Meal.findByPk.mockResolvedValue({ id: 1, isActive: false });
  
        await expect(createReservation({ studentId: 1, mealId: 1 })).rejects.toThrow(
          "Bu yemek aktif değil."
        );
      });
  
      test("aktif yemek için rezervasyon oluşturur", async () => {
        Meal.findByPk.mockResolvedValue({ id: 1, isActive: true });
        MealReservation.create.mockResolvedValue({ id: 10, status: "Reserved" });
  
        const result = await createReservation({ studentId: 1, mealId: 1 });
  
        expect(MealReservation.create).toHaveBeenCalledWith(
          expect.objectContaining({ studentId: 1, mealId: 1, status: "Reserved", qrUsed: false })
        );
        expect(result.status).toBe("Reserved");
      });
  
      // NOT: Spec'te istenen "burslu öğrenci günde max 2 öğün" / kota kontrolü
      // bu serviste hiç uygulanmamış - createReservation, Meal.quota alanına
      // veya günlük rezervasyon sayısına hiç bakmıyor. Bu test mevcut (eksik) davranışı belgeliyor.
      test("BİLİNEN EKSİK: kontenjan (quota) dolu olsa bile rezervasyon engellenmiyor", async () => {
        Meal.findByPk.mockResolvedValue({ id: 1, isActive: true, quota: 0 });
        MealReservation.create.mockResolvedValue({ id: 11, status: "Reserved" });
  
        const result = await createReservation({ studentId: 1, mealId: 1 });
  
        expect(result.status).toBe("Reserved");
      });
    });
  
    describe("getAllMeals", () => {
      test("yemekleri availableDate'e göre artan sırada döner", async () => {
        Meal.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  
        const result = await getAllMeals();
  
        expect(Meal.findAll).toHaveBeenCalledWith({ order: [["availableDate", "ASC"]] });
        expect(result).toHaveLength(2);
      });
    });
  
    describe("getMyReservations", () => {
      test("öğrencinin rezervasyonlarını yemek bilgisiyle birlikte, en yeniden eskiye döner", async () => {
        MealReservation.findAll.mockResolvedValue([{ id: 1 }]);
  
        const result = await getMyReservations(7);
  
        expect(MealReservation.findAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { studentId: 7 },
            order: [["createdAt", "DESC"]]
          })
        );
        expect(result).toHaveLength(1);
      });
    });
  });