const notificationPreferenceService = require("./notification-preference.service");

const getPreferences = async (req, res, next) => {
  try {
    const preferences =
      await notificationPreferenceService.getPreferences(req.user.id);

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences =
      await notificationPreferenceService.updatePreferences(
        req.user.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Bildirim tercihleri güncellendi.",
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences
};