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
  const [isPaused, setIsPaused] = useState(false);
  
  // Saved recordings list (stored in component state - demo only)
  const [savedRecordings, setSavedRecordings] = useState<SavedRecording[]>([]);

  // ADDED: Clean up on unmount - WITH SAFETY CHECKS
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {
          // Ignore errors - already unloaded
        });
      }
      if (sound) {
        sound.unloadAsync().catch(() => {
          // Ignore errors - already unloaded
        });
      }
    };
  }, [recording, sound]);

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
      // FIXED: Stop any playing sound before recording
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
        setIsPaused(false);
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow microphone access');
        return;
      }

      // FIXED: Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
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
      
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  // Re-record 
  const rerecord = async (id: string) => {
    console.log('🔄 Re-record clicked for:', id); // Debug log
    
    Alert.alert(
      'Re-record',
      'This will delete the current recording and start a new one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-record',
          onPress: async () => {
            console.log('🗑️ Deleting recording:', id);
            
            // Delete existing recording
            setSavedRecordings((prev) => prev.filter((r) => r.id !== id));

            // Stop playback if playing
            if (playingId === id) {
              await stopPlayback();
            }

            // Start fresh recording
            await startRecording();
          },
        },
      ]
    );
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
      
      console.log('📍 Recording URI:', uri); // Debug log
      
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
        console.log('✅ Recording saved:', newRecording);
      } else {
        console.error('❌ No URI returned from recording');
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Play recording - FIXED VERSION
  const playRecording = async (recordingItem: SavedRecording) => {
    try {
      console.log('🎵 Attempting to play:', recordingItem.uri);
      
      // If same recording is paused → resume
      if (sound && playingId === recordingItem.id && isPaused) {
        console.log('▶️ Resuming playback');
        await sound.playAsync();
        setIsPaused(false);
        return;
      }
  
      // Stop and unload any existing sound
      if (sound) {
        console.log('⏹️ Stopping previous sound');
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (err) {
          console.log('Warning: Error stopping previous sound:', err);
        }
        setSound(null);
      }

      // FIXED: Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
  
      console.log('🔊 Loading sound from:', recordingItem.uri);
      
      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingItem.uri },
        { shouldPlay: true }, // Start playing immediately
        (status) => {
          // Playback status callback
          if (status.isLoaded) {
            console.log('📊 Playback status:', {
              isPlaying: status.isPlaying,
              position: status.positionMillis,
              duration: status.durationMillis,
            });
            
            if (status.didJustFinish) {
              console.log('✅ Playback finished');
              setPlayingId(null);
              setIsPaused(false);
            }
          }
        }
      );
  
      setSound(newSound);
      setPlayingId(recordingItem.id);
      setIsPaused(false);
      
      console.log('✅ Sound loaded and playing');
    } catch (error) {
      console.error('❌ Failed to play recording:', error);
      Alert.alert('Playback Error', `Failed to play recording: ${error}`);
      
      // Clean up on error
      setSound(null);
      setPlayingId(null);
      setIsPaused(false);
    }
  };

  // Pause playback
  const pausePlayback = async () => {
    if (sound) {
      try {
        console.log('⏸️ Pausing playback');
        await sound.pauseAsync();
        setIsPaused(true);
      } catch (error) {
        console.error('❌ Failed to pause:', error);
        Alert.alert('Error', 'Failed to pause playback');
      }
    }
  };

  // Stop playback - FIXED VERSION
  const stopPlayback = async () => {
    if (sound) {
      try {
        console.log('⏹️ Stopping playback');
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Warning: Error during stop:', error);
      }
      
      setSound(null); // FIXED: Added this
      setPlayingId(null);
      setIsPaused(false);
    }
  };

  // Delete recording - FIXED VERSION
  const deleteRecording = (id: string) => {
    console.log(' Delete clicked for:', id); // Debug log
    
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log(' Confirmed delete for:', id);
            
            // Stop if currently playing
            if (playingId === id) {
              await stopPlayback();
            }
            
            // Delete from state
            setSavedRecordings((prev) => {
              const updated = prev.filter((r) => r.id !== id);
              console.log(' Updated recordings:', updated.length);
              return updated;
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['top']}>
      <View className="flex-1">
        <View  style={StyleSheet.absoluteFillObject} pointerEvents="none">
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
                    className="bg-dark-200 rounded-lg p-3 mb-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-sm">
                          Recording #{item.id.slice(-4)}
                        </Text>
                        <Text className="text-light-300 text-xs mt-1">
                          {formatTimestamp(item.timestamp)} • {formatDuration(item.duration)}
                        </Text>
                      </View>

                      {/* FIXED: Changed gap-2 to marginLeft style */}
                      <View className="flex-row" style={{ gap: 8 }}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity
                          onPress={() => {
                            console.log('▶️ Play/Pause clicked');
                            if (playingId === item.id && !isPaused) {
                              pausePlayback();
                            } else {
                              playRecording(item);
                            }
                          }}
                          className="bg-accent rounded-full w-10 h-10 items-center justify-center"
                        >
                          <Ionicons
                            name={
                              playingId === item.id && !isPaused
                                ? 'pause'
                                : 'play'
                            }
                            size={18}
                            color="white"
                          />
                        </TouchableOpacity>

                        {/* Re-record Button */}
                        <TouchableOpacity
                          onPress={() => {
                            console.log('🔄 Re-record button pressed');
                            rerecord(item.id);
                          }}
                          className="bg-yellow-500/20 rounded-full w-10 h-10 items-center justify-center"
                        >
                          <Ionicons name="refresh" size={18} color="#facc15" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                          onPress={() => {
                            console.log('🗑️ Delete button pressed');
                            deleteRecording(item.id);
                          }}
                          className="bg-red-500/20 rounded-full w-10 h-10 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
