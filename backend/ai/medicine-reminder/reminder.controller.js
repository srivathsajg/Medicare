const { createReminder, getPatientReminders } = require("./reminder.service");

const createReminderController = async (req, res, next) => {
  try {
    const { medicine, time, status } = req.body;

    const reminder = await createReminder({
      patientId: req.user.id,
      medicine,
      time,
      status,
    });

    res.status(201).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReminders = async (req, res, next) => {
  try {
    const reminders = await getPatientReminders(req.user.id);

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReminder: createReminderController,
  getMyReminders,
};

