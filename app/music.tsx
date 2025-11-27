import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from "expo-av";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const FREESOUND_API_KEY = "cUBi6vZab4NtW0sC4dJpDFAnQGzRz0HVFTjwsV5c";

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
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMusic();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const playTrack = async (index: number) => {
    if (sound) await sound.unloadAsync();

    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: tracks[index].audio,
    });

    setSound(newSound);
    setCurrentIndex(index);
    setIsPlaying(true);
    await newSound.playAsync();
  };

  const togglePause = async () => {
    if (!sound) return;
    const status: AVPlaybackStatus = await sound.getStatusAsync();

    if (!status.isLoaded) return;

    const s = status as AVPlaybackStatusSuccess;

    if (s.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentIndex === null) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const playPrevious = () => {
    if (currentIndex === null) return;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={styles.header}>🎵 Relaxing Music for Elders</Text>

      {tracks.map((track, index) => {
        const isCurrent = currentIndex === index;

        return (
          <View key={track.id} style={styles.card}>
            <Text style={styles.title}>{track.name}</Text>
            <Text>Duration: {track.duration} sec</Text>

            {/* Row 1 - Play + Pause */}
            <View style={styles.row}>
              <Button title="Play" onPress={() => playTrack(index)} />

              <Button
                title="Pause"
                onPress={togglePause}
                disabled={!isCurrent}
              />
            </View>

            {/* Row 2 - Prev + Next */}
            <View style={styles.row}>
              <Button
                title="◀ Previous"
                onPress={playPrevious}
                disabled={!isCurrent}
              />

              <Button title="Next ▶" onPress={playNext} disabled={!isCurrent} />
            </View>
          </View>
        );
      })}

      {/* Now Playing Section */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>
          Now Playing:{" "}
          {currentIndex !== null ? tracks[currentIndex].name : "None"}
        </Text>
      </View>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
