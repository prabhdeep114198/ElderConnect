import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

interface Track {
  id: number;
  name: string;
  audio: string;
  duration: number;
  username: string;
}

const CATEGORIES = [
  {
    id: 'nature',
    name: 'Nature',
    query: 'relaxing nature forest birds water',
    image: require('../assets/images/nature_category.png'),
    description: 'Serene forest & water sounds'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    query: 'zen meditation ambient healing',
    image: require('../assets/images/meditation_category.png'),
    description: 'Deep calm for inner peace'
  },
  {
    id: 'sleep',
    name: 'Sleep',
    query: 'sleep lullaby soft delta waves rain',
    image: require('../assets/images/sleep_category.png'),
    description: 'Gentle melodies for rest'
  },
  {
    id: 'classical',
    name: 'Classical',
    query: 'relaxing piano classical violin cello',
    image: require('../assets/images/classical_category.png'),
    description: 'Timeless instrumental pieces'
  }
];

export default function RelaxingMusicScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const FREESOUND_API_KEY = "cUBi6vZab4NtW0sC4dJpDFAnQGzRz0HVFTjwsV5c";

  const fetchMusic = async (query: string) => {
    setLoading(true);
    try {
      const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&fields=id,name,previews,duration,username&token=${FREESOUND_API_KEY}&page_size=15`;
      const res = await fetch(url);
      const data = await res.json();

      const formatted: Track[] = data.results.map((track: any) => ({
        id: track.id,
        name: track.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        audio: track.previews["preview-hq-mp3"],
        duration: track.duration,
        username: track.username
      }));

      setTracks(formatted);
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusic(selectedCategory.query);
  }, [selectedCategory]);

  const playTrack = async (index: number) => {
    player.replace(tracks[index].audio);
    setCurrentIndex(index);
    player.play();
  };

  const togglePause = async () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
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

  const currentTrack = currentIndex !== null ? tracks[currentIndex] : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderTrackItem = ({ item, index }: { item: Track, index: number }) => {
    const isPlaying = currentIndex === index;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity
          style={[
            styles.trackCard,
            { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#FFFFFF' },
            isPlaying && { borderColor: colors.primary, borderWidth: 2 }
          ]}
          onPress={() => playTrack(index)}
        >
          <View style={styles.trackInfo}>
            <View style={[styles.playIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons
                name={isPlaying && player.playing ? "pause" : "play"}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.trackMeta}>
              <Text
                style={[styles.trackName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.trackArtist, { color: colors.mutedText }]}>
                By {item.username} • {formatTime(item.duration)}
              </Text>
            </View>
          </View>
          {isPlaying && (
            <View style={styles.playingBars}>
              <View style={[styles.bar, { backgroundColor: colors.primary, height: 12 }]} />
              <View style={[styles.bar, { backgroundColor: colors.primary, height: 18 }]} />
              <View style={[styles.bar, { backgroundColor: colors.primary, height: 14 }]} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '30', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Relaxation</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>Perfect sounds for your mood</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((category, index) => (
              <Animated.View key={category.id} entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryCard,
                    selectedCategory.id === category.id && styles.activeCategoryCard
                  ]}
                >
                  <Image source={category.image} style={styles.categoryImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.categoryGradient}
                  />
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDesc} numberOfLines={1}>{category.description}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Track List */}
        <View style={styles.trackSection}>
          <View style={styles.trackListHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {selectedCategory.name} Tracks
            </Text>
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {tracks.length > 0 ? (
            <FlatList
              data={tracks}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.trackList}
            />
          ) : !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color={colors.mutedText} />
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>No tracks found in this category.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Premium Player Bar */}
      {currentTrack && (
        <Animated.View entering={FadeInDown} style={styles.playerContainer}>
          <LinearGradient
            colors={[theme === 'dark' ? '#222' : '#FFF', theme === 'dark' ? '#111' : '#F9F9F9']}
            style={styles.playerBar}
          >
            <Image
              source={selectedCategory.image}
              style={styles.playerTrackImage}
            />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerTrackName, { color: colors.text }]} numberOfLines={1}>
                {currentTrack.name}
              </Text>
              <Text style={[styles.playerTrackArtist, { color: colors.mutedText }]}>
                {selectedCategory.name}
              </Text>
            </View>

            <View style={styles.playerControls}>
              <TouchableOpacity onPress={playPrevious}>
                <Ionicons name="play-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={togglePause}
                style={[styles.playPauseButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons
                  name={player.playing ? "pause" : "play"}
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={playNext}>
                <Ionicons name="play-forward" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          {/* Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(status.currentTime / status.duration) * 100}%`
                }
              ]}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 5,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  categorySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryScroll: {
    paddingHorizontal: 15,
  },
  categoryCard: {
    width: 240,
    height: 160,
    marginHorizontal: 5,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  activeCategoryCard: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  categoryTextContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
  },
  categoryName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  trackSection: {
    paddingHorizontal: 20,
  },
  trackListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  trackList: {
    paddingBottom: 20,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  trackMeta: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
  },
  playingBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  playerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    elevation: 10,
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 15,
  },
  playerTrackImage: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerTrackName: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerTrackArtist: {
    fontSize: 12,
    opacity: 0.7,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  playPauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
  }
});
