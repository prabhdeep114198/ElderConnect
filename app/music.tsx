import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from "react-native";

interface Track {
  id: number;
  name: string;
  audio: string;
  duration: string;
}

export default function FreesoundMusic() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const FREESOUND_API_KEY = "cUBi6vZab4NtW0sC4dJpDFAnQGzRz0HVFTjwsV5c"; // replace with your token

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const url = `https://freesound.org/apiv2/search/text/?query=relaxing&fields=id,name,previews,duration&token=${FREESOUND_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        const formatted: Track[] = data.results.map((track: any) => ({
          id: track.id,
          name: track.name,
          audio: track.previews["preview-hq-mp3"],
          duration: track.duration.toFixed(1),
        }));

        setTracks(formatted);
      } catch (err) {
        console.error("Freesound API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const playSound = async (audioUrl: string) => {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
    setSound(newSound);
    await newSound.playAsync();
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={styles.header}>🎵 Relaxing Music for Elders</Text>

      {tracks.map((track) => (
        <View key={track.id} style={styles.card}>
          <Text style={styles.title}>{track.name}</Text>
          <Text>Duration: {track.duration} sec</Text>
          <Button title="Play" onPress={() => playSound(track.audio)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
});
