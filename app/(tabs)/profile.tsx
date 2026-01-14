import { View, Text, Image, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Interface for saved recordings
interface SavedRecording {
  id: string;
  uri: string;
  duration: number;
  timestamp: string;
}

const Profile = () => {
  // Recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Playback states
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Saved recordings list (stored in component state - demo only)
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Format duration to MM:SS
  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Start recording
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1000);
      }, 1000);

      (recording as any).durationInterval = interval;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Stop recording and save
  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      
      if ((recording as any).durationInterval) {
        clearInterval((recording as any).durationInterval);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        // Save to state (demo - no database)
        const newRecording: SavedRecording = {
          id: Date.now().toString(),
          uri,
          duration: recordingDuration,
          timestamp: new Date().toISOString(),
        };
        
        setSavedRecordings((prev) => [newRecording, ...prev]);
        Alert.alert('Success', 'Recording saved!');
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Play recording
  const playRecording = async (recordingItem: SavedRecording) => {
    try {
      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingItem.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(recordingItem.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  // Stop playback
  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingId(null);
    }
  };

  // Delete recording
  const deleteRecording = (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSavedRecordings((prev) => prev.filter((r) => r.id !== id));
            if (playingId === id) {
              stopPlayback();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
        {/* Background */}
        <Image 
          source={images.bg} 
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          {/* <View className="items-center mb-6">
            <View className="w-24 h-24 bg-accent rounded-full items-center justify-center mb-3">
              <Ionicons name="person" size={48} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold">My Profile</Text>
            <Text className="text-light-200 text-sm mt-1">Movie Enthusiast</Text>
          </View> */}

          {/* Audio Recording Section */}
          <View className="bg-dark-100/80 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="mic-circle" size={24} color="#AB8BFF" />
              <Text className="text-white text-lg font-bold ml-2">
                Voice Recording
              </Text>
            </View>

            {/* Recording Status */}
            {isRecording && (
              <View className="bg-red-500/20 rounded-lg p-3 mb-4">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <Text className="text-red-500 font-semibold">
                    Recording... {formatDuration(recordingDuration)}
                  </Text>
                </View>
              </View>
            )}

            {/* Record Button */}
            <View className="items-center mb-4">
              {!isRecording ? (
                <TouchableOpacity
                  onPress={startRecording}
                  className="bg-accent rounded-full w-20 h-20 items-center justify-center shadow-lg"
                  style={{ 
                    shadowColor: '#AB8BFF',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8
                  }}
                >
                  <Ionicons name="mic" size={36} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={stopRecording}
                  className="bg-red-500 rounded-full w-20 h-20 items-center justify-center"
                >
                  <Ionicons name="stop" size={36} color="white" />
                </TouchableOpacity>
              )}
              <Text className="text-light-200 text-xs mt-2">
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </Text>
            </View>

            {/* Saved Recordings List */}
            {savedRecordings.length > 0 && (
              <View className="mt-4">
                <Text className="text-light-100 text-sm font-semibold mb-3">
                  Saved Recordings ({savedRecordings.length})
                </Text>
                
                {savedRecordings.map((item) => (
                  <View 
                    key={item.id} 
                    className="bg-dark-200 rounded-lg p-3 mb-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm">
                        Recording #{item.id.slice(-4)}
                      </Text>
                      <Text className="text-light-300 text-xs mt-1">
                        {formatTimestamp(item.timestamp)} • {formatDuration(item.duration)}
                      </Text>
                    </View>

                    <View className="flex-row gap-2">
                      {/* Play/Stop Button */}
                      <TouchableOpacity
                        onPress={() => 
                          playingId === item.id 
                            ? stopPlayback() 
                            : playRecording(item)
                        }
                        className="bg-accent rounded-full w-10 h-10 items-center justify-center"
                      >
                        <Ionicons 
                          name={playingId === item.id ? "pause" : "play"} 
                          size={18} 
                          color="white" 
                        />
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => deleteRecording(item.id)}
                        className="bg-red-500/20 rounded-full w-10 h-10 items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {savedRecordings.length === 0 && !isRecording && (
              <View className="bg-dark-200/50 rounded-lg p-4 items-center">
                <Ionicons name="musical-notes-outline" size={32} color="#9CA4AB" />
                <Text className="text-light-300 text-sm mt-2 text-center">
                  Click the mic to start
                </Text>
              </View>
            )}
          </View>

          {/* Stats Section */}
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 bg-dark-100/80 rounded-xl p-4 mr-2">
              <Text className="text-light-200 text-xs mb-1">Recordings</Text>
              <Text className="text-white text-2xl font-bold">
                {savedRecordings.length}
              </Text>
            </View>
            <View className="flex-1 bg-dark-100/80 rounded-xl p-4 ml-2">
              <Text className="text-light-200 text-xs mb-1">Total Time</Text>
              <Text className="text-white text-2xl font-bold">
                {formatDuration(
                  savedRecordings.reduce((sum, r) => sum + r.duration, 0)
                )}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          {/* <View className="bg-accent/20 border border-accent/30 rounded-xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#AB8BFF" />
              <View className="flex-1 ml-2">
                <Text className="text-accent font-semibold text-sm mb-1">
                  Demo Feature
                </Text>
                <Text className="text-light-200 text-xs">
                  Recordings are saved in memory only. They will be cleared when you close the app.
                </Text>
              </View>
            </View>
          </View> */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
