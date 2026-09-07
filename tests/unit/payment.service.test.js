// Bu dosya UNIT testtir: gerçek veritabanına ve gerçek Stripe'a bağlanmaz.

const mockStripeSessionsCreate = jest.fn();

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockStripeSessionsCreate
      }
    }
  }));
});

jest.mock("../../models", () => ({
  Payment: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  Student: {}
}));

const { Payment } = require("../../models");

const {
  createPayment,
  payPayment,
  createCheckoutSession,
  markPaymentCompletedFromStripe,
  getMyPayments,
  getAllPayments
} = require("../../src/modules/payment/payment.service");

describe("PaymentService (unit)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPayment", () => {
    test("durum 'Pending' olarak başlatılır ve boş referenceId/description null'a çevrilir", async () => {
      Payment.create.mockResolvedValue({ id: 1 });

      await createPayment({ studentId: 1, type: "Tuition", amount: 500 });

      expect(Payment.create).toHaveBeenCalledWith({
        studentId: 1,
        type: "Tuition",
        referenceId: null,
        amount: 500,
        description: null,
        status: "Pending"
      });
    });
  });

  describe("payPayment", () => {
    test("ödeme bulunamazsa 404 fırlatır", async () => {
      Payment.findByPk.mockResolvedValue(null);

      await expect(payPayment(1, 5, "Student")).rejects.toMatchObject({ status: 404 });
    });

    test("başka bir öğrencinin ödemesi Student rolüyle gerçekleştirilemez (403)", async () => {
      Payment.findByPk.mockResolvedValue({ id: 1, studentId: 99, status: "Pending" });

      await expect(payPayment(1, 5, "Student")).rejects.toMatchObject({ status: 403 });
    });

    test("Admin/Faculty rolü sahiplik kontrolüne tabi değildir", async () => {
      const save = jest.fn().mockResolvedValue();
      const payment = { id: 1, studentId: 99, status: "Pending", save };
      Payment.findByPk.mockResolvedValue(payment);

      await expect(payPayment(1, 5, "Admin")).resolves.toMatchObject({ status: "Completed" });
    });

    test("zaten tamamlanmış ödeme tekrar ödenemez (400)", async () => {
      Payment.findByPk.mockResolvedValue({ id: 1, studentId: 5, status: "Completed" });

      await expect(payPayment(1, 5, "Student")).rejects.toMatchObject({ status: 400 });
    });

    test("geçerli ödeme tamamlanır ve paidAt set edilir", async () => {
      const save = jest.fn().mockResolvedValue();
      const payment = { id: 1, studentId: 5, status: "Pending", save };
      Payment.findByPk.mockResolvedValue(payment);

      const result = await payPayment(1, 5, "Student");

      expect(save).toHaveBeenCalled();
      expect(result.status).toBe("Completed");
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe("createCheckoutSession", () => {
    test("ödeme bulunamazsa 404 fırlatır", async () => {
      Payment.findByPk.mockResolvedValue(null);

      await expect(createCheckoutSession(1, 5, "Student")).rejects.toMatchObject({ status: 404 });
    });

    test("başka öğrencinin ödemesi için Student rolüyle checkout açılamaz (403)", async () => {
      Payment.findByPk.mockResolvedValue({ id: 1, studentId: 99, status: "Pending" });

      await expect(createCheckoutSession(1, 5, "Student")).rejects.toMatchObject({ status: 403 });
    });

    test("zaten tamamlanmış ödeme için checkout açılamaz (400)", async () => {
      Payment.findByPk.mockResolvedValue({ id: 1, studentId: 5, status: "Completed" });

      await expect(createCheckoutSession(1, 5, "Student")).rejects.toMatchObject({ status: 400 });
    });

    test("tutarı kuruşa çevirip Stripe session oluşturur ve URL döner", async () => {
      const save = jest.fn().mockResolvedValue();
      Payment.findByPk.mockResolvedValue({
        id: 7,
        studentId: 5,
        status: "Pending",
        amount: "150.50",
        type: "Tuition",
        description: null,
        save
      });
      mockStripeSessionsCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pay/abc" });

      const result = await createCheckoutSession(7, 5, "Student");

      expect(mockStripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: "try",
                unit_amount: 15050
              })
            })
          ],
          metadata: { paymentId: "7" }
        })
      );
      expect(result).toEqual({ url: "https://checkout.stripe.com/pay/abc" });
    });
  });

  describe("markPaymentCompletedFromStripe", () => {
    test("metadata'da paymentId yoksa hiçbir şey yapmaz", async () => {
      await markPaymentCompletedFromStripe({ metadata: {} });

      expect(Payment.findByPk).not.toHaveBeenCalled();
    });

    test("ödeme bulunamazsa hiçbir şey yapmaz", async () => {
      Payment.findByPk.mockResolvedValue(null);

      await markPaymentCompletedFromStripe({ metadata: { paymentId: "5" } });

      // hata fırlatmadan sessizce çıkmalı
    });

    test("zaten Completed olan ödemeyi tekrar güncellemez", async () => {
      const save = jest.fn();
      Payment.findByPk.mockResolvedValue({ id: 5, status: "Completed", save });

      await markPaymentCompletedFromStripe({ metadata: { paymentId: "5" } });

      expect(save).not.toHaveBeenCalled();
    });

    test("Pending ödemeyi Completed yapar ve paidAt set eder", async () => {
      const save = jest.fn().mockResolvedValue();
      const payment = { id: 5, status: "Pending", save };
      Payment.findByPk.mockResolvedValue(payment);

      await markPaymentCompletedFromStripe({ metadata: { paymentId: "5" } });

      expect(payment.status).toBe("Completed");
      expect(payment.paidAt).toBeInstanceOf(Date);
      expect(save).toHaveBeenCalled();
    });
  });

  describe("getMyPayments", () => {
    test("öğrencinin ödemelerini en yeniden eskiye döner", async () => {
      Payment.findAll.mockResolvedValue([{ id: 1 }]);

      await getMyPayments(5);

      expect(Payment.findAll).toHaveBeenCalledWith({
        where: { studentId: 5 },
        order: [["createdAt", "DESC"]]
      });
    });
  });

  describe("getAllPayments", () => {
    test("filtre verilmezse where boş obje olur", async () => {
      Payment.findAll.mockResolvedValue([]);

      await getAllPayments();

      expect(Payment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });

    test("status ve type filtreleri where'e eklenir", async () => {
      Payment.findAll.mockResolvedValue([]);

      await getAllPayments({ status: "Pending", type: "Meal" });

      expect(Payment.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "Pending", type: "Meal" } })
      );
    });
  });
});