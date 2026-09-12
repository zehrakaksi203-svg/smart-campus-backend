const cron = require("node-cron");
const { Op } = require("sequelize");
const {
  Event,
  EventRegistration,
  Student,
  User,
  Notification
} = require("../../models");
const { createNotification } = require("../modules/notifications/notification.service");

const startEventReminderJob = () => {
    cron.schedule("*/15 * * * *", async () => {
    console.log("⏰ [CRON] Etkinlik hatırlatma görevi başlatıldı...");

    try {
      const now = new Date();

      await sendRemindersForWindow({
        now,
        windowStartMs: 0,
        windowEndMs: 30 * 24 * 60 * 60 * 1000, // TEST: 30 gün (geniş pencere)
        reminderType: "EventReminder1h",
        buildMessage: (event) =>
          `${event.title} etkinliği yaklaşık 1 saat içinde başlayacak.`
      });

      await sendRemindersForWindow({
        now,
        windowStartMs: 0,
        windowEndMs: 30 * 24 * 60 * 60 * 1000, // TEST: 30 gün (geniş pencere)
        reminderType: "EventReminder1h",
        buildMessage: (event) =>
          `${event.title} etkinliği yaklaşık 1 saat içinde başlayacak.`
      });

      console.log("✅ [CRON] Etkinlik hatırlatma görevi tamamlandı.");
    } catch (error) {
      console.error("❌ [CRON HATASI] Etkinlik hatırlatma sırasında hata:", error);
    }
  });
};

async function sendRemindersForWindow({ now, windowStartMs, windowEndMs, reminderType, buildMessage }) {
  const windowStart = new Date(now.getTime() + windowStartMs);
  const windowEnd = new Date(now.getTime() + windowEndMs);

  const events = await Event.findAll({
    where: {
      status: "Scheduled",
      eventDate: { [Op.between]: [windowStart, windowEnd] }
    }
  });

  for (const event of events) {
    const registrations = await EventRegistration.findAll({
      where: {
        eventId: event.id,
        status: "Registered"
      },
      include: [
        {
          model: Student,
          as: "student",
          include: [{ model: User, as: "user", attributes: ["id", "fullName"] }]
        }
      ]
    });

    for (const registration of registrations) {
      const userId = registration.student?.user?.id;
      if (!userId) continue;

      const alreadySent = await Notification.findOne({
        where: {
          userId,
          relatedEntityType: reminderType,
          relatedEntityId: registration.id
        }
      });

      if (alreadySent) continue;

      await createNotification({
        userId,
        title: "Etkinlik Hatırlatması",
        message: buildMessage(event),
        type: "event",
        relatedEntityType: reminderType,
        relatedEntityId: registration.id
      });

      console.log(`✉️ [ETKİNLİK HATIRLATMA] userId=${userId}, event="${event.title}", tip=${reminderType}`);
    }
  }
}

module.exports = startEventReminderJob;