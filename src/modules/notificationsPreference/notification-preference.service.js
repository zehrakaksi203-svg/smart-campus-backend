const { NotificationPreference } = require("../../../models");

const getPreferences = async (userId) => {
  let preferences = await NotificationPreference.findOne({
    where: { userId }
  });

  if (!preferences) {
    preferences = await NotificationPreference.create({
      userId,
      email: true,
      push: true,
      sms: false
    });
  }

  return preferences;
};

const updatePreferences = async (userId, data) => {
  let preferences = await NotificationPreference.findOne({
    where: { userId }
  });

  if (!preferences) {
    preferences = await NotificationPreference.create({
      userId,
      email: true,
      push: true,
      sms: false
    });
  }

  const allowedFields = ["email", "push", "sms"];

  allowedFields.forEach((field) => {
    if (typeof data[field] === "boolean") {
      preferences[field] = data[field];
    }
  });

  await preferences.save();

  return preferences;
};

module.exports = {
  getPreferences,
  updatePreferences
};