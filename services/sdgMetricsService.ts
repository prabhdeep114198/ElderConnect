import AsyncStorage from '@react-native-async-storage/async-storage';


/**
 * SDG Metrics Service
 * Tracks application usage corresponding to UN Sustainable Development Goals
 * and synchronizes with the ElderConnect backend telemetry tracker.
 */
class SDGMetricsService {
  private metrics = {
    sdg3_vitalsLogged: 0,
    sdg3_sosHandled: 0,
    sdg10_wcagInteractions: 0,
    sdg10_voiceQueries: 0,
    sdg11_safeDays: 0,
    sdg12_ecoHours: 0,
    sdg12_telemetryBatched: 0
  };

  /**
   * Log an event corresponding to an SDG metric
   */
  async logEvent(eventType: keyof typeof this.metrics, value: number = 1) {
    try {
      this.metrics[eventType] += value;
      // Store locally for offline persistence
      await AsyncStorage.setItem('sdg_metrics_cache', JSON.stringify(this.metrics));
    } catch (e) {
      console.warn("SDG Metrics Logging Failed:", e);
    }
  }

  /**
   * Sync metrics to the backend server
   * Example: POST /api/v1/sdg-metrics
   */
  async syncWithBackend() {
    try {
      const stored = await AsyncStorage.getItem('sdg_metrics_cache');
      if (!stored) return;

      const payload = JSON.parse(stored);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/sdg-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Clear cached metrics once successfully synced
        this.metrics = {
          sdg3_vitalsLogged: 0,
          sdg3_sosHandled: 0,
          sdg10_wcagInteractions: 0,
          sdg10_voiceQueries: 0,
          sdg11_safeDays: 0,
          sdg12_ecoHours: 0,
          sdg12_telemetryBatched: 0
        };
        await AsyncStorage.removeItem('sdg_metrics_cache');
        console.log("SDG Metrics Synced Successfully");
      }
    } catch (error) {
      console.warn("Failed to sync SDG metrics to backend:", error);
    }
  }
}

export const sdgMetricsService = new SDGMetricsService();
