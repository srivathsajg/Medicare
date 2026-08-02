const reminders = [];

const createReminder = async ({ patientId, medicine, time, status }) => {
  const reminder = {
    id: Date.now().toString(),
    patientId,
    medicine,
    time,
    status: status || "scheduled",
  };

  reminders.push(reminder);

  return reminder;
};

const getPatientReminders = async (patientId) => {
  return reminders.filter((item) => item.patientId === patientId);
};

module.exports = {
  createReminder,
  getPatientReminders,
};

