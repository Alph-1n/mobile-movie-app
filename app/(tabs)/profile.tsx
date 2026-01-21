import { View, Text, Image, ScrollView, StyleSheet, Button } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants/images';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Modal } from 'react-native';

const Profile = () => {
  const [recording, setRecording] = React.useState<Audio.Recording | undefined>();
  const [recordings, setRecordings] = React.useState<any[]>([]);
  const [selectedVerse, setSelectedVerse] = React.useState<any>(null);
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
    
    // FIXED: Check if status has durationMillis
    const duration = status.durationMillis || 0;
    
    allRecordings.push({
      sound: sound,
      duration: getDurationFormatted(duration),
      file: recording.getURI(),
      isPlaying: false,
    });

    setRecordings(allRecordings);
  }

  function getDurationFormatted(milliseconds: number) {
    // FIXED: Handle invalid/zero values
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
  
          {/* PLAY / PAUSE - FIXED: Using Ionicons instead */}
          <TouchableOpacity onPress={togglePlayPause} style={styles.iconBtn}>
            {recordingLine.isPlaying ? (
              <Ionicons name="pause-circle" size={28} color="#AB8BFF" />
            ) : (
              <Ionicons name="play-circle" size={28} color="#AB8BFF" />
            )}
          </TouchableOpacity>
  
          {/* DELETE */}
          <TouchableOpacity onPress={deleteRecording} style={styles.iconBtn}>
            <Ionicons name="trash" size={24} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      );
    });
  }

  async function clearRecordings() {
    // FIXED: Unload all sounds before clearing
    for (const rec of recordings) {
      await rec.sound.unloadAsync();
    }
    setRecordings([]);
  }

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
        {/* Background Image */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image
            source={images.bg}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        </View>

        {/* Your Content Here */}
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
            
            {/* FIXED: Clear All button with delete icon */}
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
    {PSALM_1.slice(0, 3).map((item) => (
      <TouchableOpacity
        key={item.verse}
        style={styles.verseCard}
        onPress={() => setSelectedVerse(item)}
      >
        <Text style={styles.verseNumber}>Verse {item.verse}</Text>
        <Text style={styles.verseText}>{item.text}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

        </ScrollView>
      </View>
      <Modal visible={!!selectedVerse} animationType="slide">
  <SafeAreaView className="flex-1 bg-primary">
    <View style={{ flex: 1, padding: 20 }}>
      
      {/* Close Button */}
      <TouchableOpacity
        onPress={() => setSelectedVerse(null)}
        style={{ marginBottom: 20 }}
      >
        <Ionicons name="close" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Verse Content */}
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
    maxHeight: 220, // limits height → forces scroll
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
  
});

export default Profile;