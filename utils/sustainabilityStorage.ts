import AsyncStorage from '@react-native-async-storage/async-storage';

const SUSTAINABILITY_KEY = 'sustainability_impact';
const KG_CO2_PER_REPORT = 0.05;
const KG_CO2_PER_TELEMEDICINE = 4.0;
const SHEETS_PER_REPORT = 3;

export interface LocalSustainabilityData {
  reportsGenerated: number;
  telemedicineSessions: number;
  year: number;
}

export interface SustainabilityImpactResult {
  reportsGenerated: number;
  telemedicineSessions: number;
  paperSavedSheets: number;
  carbonSavedKg: number;
  tripsAvoided: number;
  year: number;
  powerDraw?: number;
  solarActive?: boolean;
  devicesRecycled?: number;
}

async function getStorageKey(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  return `${SUSTAINABILITY_KEY}_${userId}_${year}`;
}

export async function getLocalSustainability(userId: string): Promise<LocalSustainabilityData> {
  try {
    const key = await getStorageKey(userId);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to get local sustainability data', e);
  }
  const year = new Date().getFullYear();
  return { reportsGenerated: 0, telemedicineSessions: 0, year };
}

export async function incrementLocalReports(userId: string, count = 1): Promise<LocalSustainabilityData> {
  const current = await getLocalSustainability(userId);
  const updated = {
    ...current,
    reportsGenerated: current.reportsGenerated + count,
    year: new Date().getFullYear(),
  };
  const key = await getStorageKey(userId);
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export async function incrementLocalTelemedicine(userId: string, count = 1): Promise<LocalSustainabilityData> {
  const current = await getLocalSustainability(userId);
  const updated = {
    ...current,
    telemedicineSessions: current.telemedicineSessions + count,
    year: new Date().getFullYear(),
  };
  const key = await getStorageKey(userId);
  await AsyncStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export function computeImpact(data: LocalSustainabilityData): SustainabilityImpactResult {
  const carbonFromReports = data.reportsGenerated * KG_CO2_PER_REPORT;
  const carbonFromTelemedicine = data.telemedicineSessions * KG_CO2_PER_TELEMEDICINE;
  const totalCarbonKg = carbonFromReports + carbonFromTelemedicine;

  return {
    reportsGenerated: data.reportsGenerated,
    telemedicineSessions: data.telemedicineSessions,
    paperSavedSheets: data.reportsGenerated * SHEETS_PER_REPORT,
    carbonSavedKg: Math.round(totalCarbonKg * 100) / 100,
    tripsAvoided: data.telemedicineSessions,
    year: data.year,
  };
}
