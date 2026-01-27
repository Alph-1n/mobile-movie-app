import { View, Text, Image, ScrollView, StyleSheet, Button,Alert } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants/images';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Modal } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


const Profile = () => {
  const [recording, setRecording] = React.useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = React.useState<any[]>([]);
  const [selectedVerse, setSelectedVerse] = React.useState<any>(null);

  // NEW: Modal audio states
  const [modalSound, setModalSound] = React.useState<Audio.Sound | null>(null);
  const [isModalPlaying, setIsModalPlaying] = React.useState(false);
  const [modalRecording, setModalRecording] = React.useState<Audio.Recording | undefined>();
  const [isModalRecording, setIsModalRecording] = React.useState(false);
  const [isPausedRecording, setIsPausedRecording] = React.useState(false);

  // Storage for verse-specific recordings (in-memory, like your other recordings)
  const [verseRecordings, setVerseRecordings] = React.useState<{ [key: number]: any }>({});

  // Audio files mapping (put these files in assets/audio/)
  const VERSE_AUDIO: { [key: number]: any } = {
    1: require('@/assets/audio/psalm1_verse1.mp3'),
    2: require('@/assets/audio/psalm1_verse2.mp3'),
    3: require('@/assets/audio/psalm1_verse3.mp3'),
    4: require('@/assets/audio/psalm1_verse4.mp3'),
    // Add more as needed, or leave undefined if no audio
  };

  const PSALM_1 = [
    {
      verse: 1,
      text: "Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers,"
    },
    {
      verse: 2,
      text: "but whose delight is in the law of the Lord, and who meditates on his law day and night."
    },
    {
      verse: 3,
      text: "That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither—whatever they do prospers."
    },
    {
      verse: 4,
      text: "Not so the wicked! They are like chaff that the wind blows away."
    },
    {
      verse: 5,
      text: "Therefore the wicked will not stand in the judgment, nor sinners in the assembly of the righteous."
    },
    {
      verse: 6,
      text: "For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction."
    }
  ];

  //for unloading audio 
  async function safelyUnloadSound(sound: Audio.Sound | null) {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (e) {
      // ignore – sound was already unloaded
    }
  }

  //start recording and stop recording
  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setRecording(undefined);

    await recording.stopAndUnloadAsync();
    let allRecordings = [...recordings];
    const { sound, status } = await recording.createNewLoadedSoundAsync();

    const duration = status.isLoaded && status.durationMillis ? status.durationMillis : 0;

    allRecordings.push({
      sound: sound,
      duration: getDurationFormatted(duration),
      file: recording.getURI(),
      isPlaying: false,
    });

    setRecordings(allRecordings);
  }

  function getDurationFormatted(milliseconds: number) {
    if (!milliseconds || isNaN(milliseconds)) return "0:00";

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds < 10 ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`;
  }

  function getRecordingLines() {
    return recordings.map((recordingLine, index) => {
      const togglePlayPause = async () => {
        const status = await recordingLine.sound.getStatusAsync();

        if (status.isPlaying) {
          await recordingLine.sound.pauseAsync();
          recordingLine.isPlaying = false;
        } else {
          await recordingLine.sound.playAsync();
          recordingLine.isPlaying = true;
        }

        setRecordings([...recordings]);
      };

      const deleteRecording = async () => {
        await recordingLine.sound.unloadAsync();
        const updated = recordings.filter((_, i) => i !== index);
        setRecordings(updated);
      };

      return (
        <View key={index} style={styles.row}>
          <Text style={styles.fill} className="text-white">
            Recording #{index + 1} | {recordingLine.duration}
          </Text>

          <TouchableOpacity onPress={togglePlayPause} style={styles.iconBtn}>
            {recordingLine.isPlaying ? (
              <Ionicons name="pause-circle" size={28} color="#AB8BFF" />
            ) : (
              <Ionicons name="play-circle" size={28} color="#AB8BFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={deleteRecording} style={styles.iconBtn}>
            <Ionicons name="trash" size={24} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      );
    });
  }

  async function clearRecordings() {
    for (const rec of recordings) {
      await rec.sound.unloadAsync();
    }
    setRecordings([]);
  }
 
  // NEW: Modal audio functions
  async function playModalAudio() {
    if (!selectedVerse) return;

    try {
      await safelyUnloadSound(modalSound);
      setModalSound(null);


      // Check if there's a user recording for this verse
      const userRecording = verseRecordings[selectedVerse.verse];
      if (userRecording) {
        // Play user's recording
        const { sound } = await Audio.Sound.createAsync(
          { uri: userRecording.file },
          { shouldPlay: true }
        );
        setModalSound(sound);
        setIsModalPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsModalPlaying(false);
          }
        });
        return;
      }

      // Otherwise play pre-loaded audio if exists
      const audioFile = VERSE_AUDIO[selectedVerse.verse];
      if (!audioFile) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(audioFile, { shouldPlay: true });
      setModalSound(sound);
      setIsModalPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsModalPlaying(false);
        }
      });
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  }

  async function pauseModalAudio() {
    if (modalSound) {
      await modalSound.pauseAsync();
      setIsModalPlaying(false);
    }
  }

  async function startModalRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setModalRecording(recording);
      setIsModalRecording(true);
      setIsPausedRecording(false);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function pauseResumeModalRecording() {
    if (!modalRecording) return;

    try {
      if (isPausedRecording) {
        await modalRecording.startAsync();
        setIsPausedRecording(false);
      } else {
        await modalRecording.pauseAsync();
        setIsPausedRecording(true);
      }
    } catch (err) {
      console.error('Failed to pause/resume', err);
    }
  }

  async function stopModalRecording() {
    if (!modalRecording || !selectedVerse) return;

    setIsModalRecording(false);
    setIsPausedRecording(false);
    await modalRecording.stopAndUnloadAsync();

    // Save recording for THIS specific verse
    const { sound, status } = await modalRecording.createNewLoadedSoundAsync();
    const duration = status.isLoaded && status.durationMillis ? status.durationMillis : 0;

    const newRecording = {
      sound,
      duration: getDurationFormatted(duration),
      file: modalRecording.getURI(),
      verse: selectedVerse.verse,
    };

    // Store in verse-specific storage
    setVerseRecordings({
      ...verseRecordings,
      [selectedVerse.verse]: newRecording
    });

    setModalRecording(undefined);
    console.log(`Recording saved for Verse ${selectedVerse.verse}`);
  }

  function hasAudio(verseNum: number) {
    return !!VERSE_AUDIO[verseNum] || !!verseRecordings[verseNum];
  }

  // Navigate to next verse
  async function goToNextVerse() {
    if (!selectedVerse) return;
    const currentIndex = PSALM_1.findIndex(v => v.verse === selectedVerse.verse);
    if (currentIndex < PSALM_1.length - 1) {
      setSelectedVerse(PSALM_1[currentIndex + 1]);
      // Clean up audio/recording when switching verses
      await safelyUnloadSound(modalSound);
      setModalSound(null);

      if (modalRecording) modalRecording.stopAndUnloadAsync();
      setIsModalPlaying(false);
      setIsModalRecording(false);
    }
  }

  // Navigate to previous verse
  async function goToPreviousVerse() {
    if (!selectedVerse) return;
    const currentIndex = PSALM_1.findIndex(v => v.verse === selectedVerse.verse);
    if (currentIndex > 0) {
      setSelectedVerse(PSALM_1[currentIndex - 1]);
      // Clean up audio/recording when switching verses
      await safelyUnloadSound(modalSound);
      setModalSound(null); //made the function async to use await and setModalSOund      
      if (modalRecording) modalRecording.stopAndUnloadAsync();
      setIsModalPlaying(false);
      setIsModalRecording(false);
    }
  }

  //export audio
  async function exportAudio() {
    if (!selectedVerse) {
      Alert.alert('Error', 'No verse selected');
      return;
    }

    try {
      // Check if user has recorded audio for this verse
      const userRecording = verseRecordings[selectedVerse.verse];

      if (!userRecording?.file) {
        // Check if pre-loaded audio exists
        if (VERSE_AUDIO[selectedVerse.verse]) {
          Alert.alert(
            'Export Audio',
            'Only recorded audio can be exported. Would you like to record this verse?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Record Now', onPress: startModalRecording }
            ]
          );
        } else {
          Alert.alert('No Audio', 'No audio available for this verse');
        }
        return;
      }

      const audioUri = userRecording.file;

      // Check if sharing is available
      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the audio file directly
      await Sharing.shareAsync(audioUri, {
        mimeType: 'audio/m4a',
        dialogTitle: `Export Psalm 1:${selectedVerse.verse}`,
      });

      console.log('Audio exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export audio. Please try again.');
    }
  }


  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image
            source={images.bg}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-white text-2xl font-bold mb-4">
            Profile Screen
          </Text>
          <View>
            <Button
              title={recording ? 'Stop Recording' : 'Start Recording'}
              onPress={recording ? stopRecording : startRecording}
            />
            {getRecordingLines()}

            {recordings.length > 0 && (
              <TouchableOpacity
                onPress={clearRecordings}
                style={styles.clearAllBtn}
              >
                <Ionicons name="trash-bin" size={20} color="#ff4d4f" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PSALMS CHAPTER 1 */}
          <View style={styles.psalmContainer}>
            <Text style={styles.psalmTitle}>Psalms – Chapter 1</Text>

            <ScrollView
              style={styles.psalmScroll}
              showsVerticalScrollIndicator={false}
            >
              {PSALM_1.map((item) => (
                <TouchableOpacity
                  key={item.verse}
                  style={styles.verseCard}
                  onPress={() => setSelectedVerse(item)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.verseNumber}>Verse {item.verse}</Text>
                    {hasAudio(item.verse) && (
                      <Ionicons name="volume-high" size={16} color="#AB8BFF" />
                    )}
                  </View>
                  <Text style={styles.verseText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* MODAL */}
      <Modal visible={!!selectedVerse} animationType="slide">
        <SafeAreaView className="flex-1 bg-primary">
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => {
                setSelectedVerse(null);
                if (modalSound) modalSound.unloadAsync();
                if (modalRecording) modalRecording.stopAndUnloadAsync();
              }}
              style={{ marginBottom: 20 }}
            >
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedVerse && (
              <>
                <Text style={styles.fullVerseTitle}>
                  Psalm 1 : {selectedVerse.verse}
                </Text>
                <Text style={styles.fullVerseText}>
                  {selectedVerse.text}
                </Text>
              </>
            )}
          </ScrollView>

          {/* MEDIA NAVBAR */}
          <View style={styles.mediaNavbar}>
            {/* Previous Verse */}
            <TouchableOpacity onPress={goToPreviousVerse}>
              <Ionicons name="play-skip-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Play Button - Only if audio exists */}
            {!isModalPlaying && hasAudio(selectedVerse?.verse) && (
              <TouchableOpacity onPress={playModalAudio}>
                <Ionicons name="play" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Pause Button */}
            {isModalPlaying && (
              <TouchableOpacity onPress={pauseModalAudio}>
                <Ionicons name="pause" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Mic Button - ONLY if NO audio exists */}
            {!hasAudio(selectedVerse?.verse) && !isModalRecording && (
              <TouchableOpacity onPress={startModalRecording}>
                <Ionicons name="mic" size={26} color="#ff4d4f" />
              </TouchableOpacity>
            )}

            {/* Pause/Resume Recording */}
            {isModalRecording && (
              <TouchableOpacity onPress={pauseResumeModalRecording}>
                <Ionicons
                  name={isPausedRecording ? "play" : "pause"}
                  size={26}
                  color="#ffcc00"
                />
              </TouchableOpacity>
            )}

            {/* Stop Recording */}
            {isModalRecording && (
              <TouchableOpacity onPress={stopModalRecording}>
                <Ionicons name="square" size={24} color="#ff4d4f" />
              </TouchableOpacity>
            )}

            {/* Next Verse */}
            <TouchableOpacity onPress={goToNextVerse}>
              <Ionicons name="play-skip-forward" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Share (placeholder) */}
            <TouchableOpacity onPress={exportAudio}>
              <Ionicons name="share-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15, 13, 35, 0.6)',
    borderRadius: 8,
    padding: 12,
  },
  fill: {
    flex: 1,
    marginRight: 10,
  },
  iconBtn: {
    padding: 8,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 79, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  clearAllText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '600',
  },
  psalmContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(15, 13, 35, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  psalmTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  psalmScroll: {
    maxHeight: 300,
  },
  verseCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  verseNumber: {
    color: '#AB8BFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  verseText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  fullVerseTitle: {
    color: '#AB8BFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  fullVerseText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 30,
  },
  mediaNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(15, 13, 35, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
  },
});

export default Profile;

