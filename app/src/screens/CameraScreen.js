import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Camera, useCameraDevices } from "react-native-vision-camera";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

export default function CameraScreen({ onBack }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const cameraRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert("Error", "Camera not available");
        return;
      }

      console.log("🎬 Starting video recording...");

      const video = await cameraRef.current.startRecording({
        flash: "off",
        onRecordingFinished: async (video) => {
          console.log("� Recording finished:", video.path);

          // Save to local storage
          const fileName = `workout_${Date.now()}.mp4`;
          const destination = `${FileSystem.documentDirectory}${fileName}`;

          try {
            // Use copyAsync instead of moveAsync to avoid permission issues
            await FileSystem.copyAsync({
              from: video.path,
              to: destination,
            });

            Alert.alert("Recording Saved!", `Video saved as ${fileName}`, [
              { text: "OK" },
            ]);
            console.log("✅ Video saved to:", destination);

            // Optionally delete the original temp file
            try {
              await FileSystem.deleteAsync(video.path, { idempotent: true });
            } catch (deleteError) {
              console.log(
                "⚠️ Could not delete temp file:",
                deleteError.message
              );
            }
          } catch (error) {
            console.error("❌ Error saving video:", error);
            Alert.alert("Error", `Failed to save video: ${error.message}`);
          }
        },
        onRecordingError: (error) => {
          console.error("❌ Recording error:", error);
          Alert.alert("Recording Error", error.message);
          setIsRecording(false);
          setRecordingDuration(0);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
          }
        },
      });

      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      console.log("✅ Recording started successfully");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (!cameraRef.current) {
        return;
      }

      console.log("⏹️ Stopping video recording...");
      await cameraRef.current.stopRecording();

      setIsRecording(false);
      setRecordingDuration(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log("✅ Recording stopped successfully");
    } catch (error) {
      console.error("❌ Failed to stop recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const handleRecordPress = async () => {
    console.log("🎬 Record button pressed");
    console.log(
      `Current state - isRecording: ${isRecording}, cameraReady: ${isCameraReady}`
    );

    if (!isCameraReady) {
      Alert.alert("Camera Not Ready", "Please wait for camera to initialize");
      return;
    }

    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    console.log("🔄 Component mounting...");

    (async () => {
      console.log("📷 Requesting camera permission...");
      const { Camera } = await import("react-native-vision-camera");
      const status = await Camera.requestCameraPermission();
      console.log("📷 Camera permission status:", status);
      setHasPermission(status === "granted" || status === "authorized");
    })();

    return () => {
      console.log("🧹 Component unmounting, cleaning up...");
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const devices = useCameraDevices();
  const device = devices[2] || devices.front;

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        device={device}
        isActive={true}
        style={StyleSheet.absoluteFill}
        video={true}
        onInitialized={() => {
          console.log("📷 Camera initialized!");
          setIsCameraReady(true);
        }}
        onError={(error) => {
          console.error("📷 Camera error:", error);
          setIsCameraReady(false);
        }}
      />

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            REC {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.cameraStatus}>
          Camera: {isCameraReady ? "Ready" : "Initializing..."}
        </Text>
        {isRecording && (
          <Text style={styles.durationText}>
            Duration: {formatDuration(recordingDuration)}
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onBack}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Record Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : styles.normalButton,
            !isCameraReady && styles.disabledButton,
          ]}
          onPress={handleRecordPress}
          disabled={!isCameraReady}
        >
          <Ionicons
            name={isRecording ? "stop" : "videocam"}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  recordingIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1001,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  recordingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  statusBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  cameraStatus: {
    color: "#00ff00",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  normalButton: {
    backgroundColor: "#FF8C00",
  },
  recordingButton: {
    backgroundColor: "#FF0000",
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.5,
  },
});
