const cron = require("node-cron");
const { Op } = require("sequelize");
const {
  Meal,
  MealReservation,
  Student,
  User,
  Notification
} = require("../../models");
const { createNotification } = require("../modules/notifications/notification.service");

/**
 * Yemek Rezervasyonu Hatırlatma Görevi
 * Her gün sabah 08:00'de çalışır ('0 8 * * *')
 * Test etmek istersen her dakika çalıştırmak için: '* * * * *'
 *
 * O günün tarihine (availableDate) sahip, aktif yemekler için "Reserved"
 * durumundaki rezervasyonlara bir hatırlatma bildirimi gönderir.
 * Aynı rezervasyona tekrar hatırlatma gitmemesi için Notification
 * tablosunda relatedEntityType/relatedEntityId kontrolü yapılır.
 */
const startMealReminderJob = () => {
    cron.schedule("0 8 * * *", async () => {
    console.log("⏰ [CRON] Yemek rezervasyonu hatırlatma görevi başlatıldı...");

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const meals = await Meal.findAll({
        where: {
          availableDate: todayStr,
          isActive: true
        }
      });

      for (const meal of meals) {
        const reservations = await MealReservation.findAll({
          where: {
            mealId: meal.id,
            status: "Reserved"
          },
          include: [
            {
              model: Student,
              as: "student",
              include: [{ model: User, as: "user", attributes: ["id", "fullName"] }]
            }
          ]
        });

        for (const reservation of reservations) {
          const userId = reservation.student?.user?.id;
          if (!userId) continue;

          const alreadySent = await Notification.findOne({
            where: {
              userId,
              relatedEntityType: "MealReminder",
              relatedEntityId: reservation.id
            }
          });

          if (alreadySent) continue;

          await createNotification({
            userId,
            title: "Yemek Rezervasyonu Hatırlatması",
            message: `${meal.name} için bugünkü rezervasyonunuz bulunuyor. Unutmayın!`,
            type: "meal",
            relatedEntityType: "MealReminder",
            relatedEntityId: reservation.id
          });

          console.log(`✉️ [YEMEK HATIRLATMA] userId=${userId}, yemek="${meal.name}"`);
        }
      }

      console.log("✅ [CRON] Yemek rezervasyonu hatırlatma görevi tamamlandı.");
    } catch (error) {
      console.error("❌ [CRON HATASI] Yemek hatırlatma sırasında hata:", error);
    }
  });
};

module.exports = startMealReminderJob;