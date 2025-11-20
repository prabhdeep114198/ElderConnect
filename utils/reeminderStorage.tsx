import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "reminders";

export const saveReminder = async (reminder: any) => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const reminders = existing ? JSON.parse(existing) : [];

    reminders.push(reminder);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.error("Error saving reminder:", err);
  }
};

export const getReminders = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Error loading reminders:", err);
    return [];
  }
};

export const deleteReminder = async (id: string) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const reminders = stored ? JSON.parse(stored) : [];

    const updated = reminders.filter((item: any) => item.id !== id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error deleting reminder:", err);
  }
};
