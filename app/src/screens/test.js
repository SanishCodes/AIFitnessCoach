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
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";

import { Ionicons } from "@expo/vector-icons";
import { Animated } from "react-native";


export default function CameraScreen({ onBack }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("");
  const [selectedCamera, setSelectedCamera] = useState(0);
  const [isSquare, setIsSquare] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [frameCount, setFrameCount] = useState(0);
  const [processedFrame, setProcessedFrame] = useState(null);
  const [showProcessedFrame, setShowProcessedFrame] = useState(true);
  const [isCaptureInProgress, setIsCaptureInProgress] = useState(false);
  const borderRadiusAnim = useRef(new Animated.Value(32)).current;
  const cameraRef = useRef(null);
  const wsRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const frameCounterRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Frame processor for live video streaming (no camera sounds!)
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      // For now, we'll use this to track frame availability
      // The actual streaming will be handled by interval-based capture
    },
    [isStreaming]
  );

  const captureAndStreamFrame = async () => {
    try {
      if (!cameraRef.current || !isStreaming) return;

      // Take a photo without sound using silent mode
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableShutterSound: false, // Disable camera sound
        quality: 0.5, // Lower quality for faster processing and streaming
        skipMetadata: true, // Skip metadata for faster processing
      });

      // Convert the photo to base64
      const base64String = await FileSystem.readAsStringAsync(photo.path, {
        encoding: FileSystem.EncodingType.Base64,
      });

      frameCounterRef.current++;

      // Send frame data to backend
      await processAndSendFrame(
        base64String,
        frameCounterRef.current,
        640,
        480
      );

      // Clean up the temporary file immediately
      try {
        await FileSystem.deleteAsync(photo.path, { idempotent: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.log("Cleanup warning:", cleanupError.message);
      }
    } catch (error) {
      console.error("Failed to capture frame:", error);
    }
  };

  const processAndSendFrame = async (base64String, frameId, width, height) => {
    try {
      const frameData = {
        type: "frame",
        timestamp: Date.now(),
        frame_id: frameId,
        image_data: base64String,
        message: "Live frame captured",
        width: width,
        height: height,
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(frameData));
        setFrameCount(frameId);
      }
    } catch (error) {
      console.error("Failed to process frame:", error);
    }
  };

  const connectWebSocket = () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        return;
      }

      setConnectionStatus("Connecting...");
      wsRef.current = new WebSocket("ws://192.168.0.239:8000/ws/video-stream/");

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setConnectionStatus("Connected");

        // Send ping to test connection
        const pingMessage = {
          type: "ping",
          timestamp: Date.now(),
        };
        wsRef.current.send(JSON.stringify(pingMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received from backend:", data);

          if (data.type === "processed_frame") {
            // Display the processed frame with landmarks
            setProcessedFrame(`data:image/jpeg;base64,${data.processed_image}`);
            console.log(
              "Processed frame received with landmarks:",
              data.landmarks_detected
            );
          } else if (data.type === "frame_received") {
            // Frame was successfully received by backend
            console.log("Frame acknowledged:", data.message);
          } else if (data.type === "pong") {
            console.log("Pong received - connection is alive");
          } else if (data.type === "error") {
            console.error("Backend error:", data.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
        setConnectionStatus("Disconnected");
        setIsStreaming(false);

        // Clear streaming interval if active
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("Error");
        Alert.alert(
          "Connection Error",
          "Failed to connect to server. Make sure the backend is running."
        );
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      Alert.alert("WebSocket Error", error.message);
      setConnectionStatus("Error");
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus("Disconnected");
  };

  const startStreaming = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      Alert.alert("Error", "WebSocket not connected. Trying to reconnect...");
      connectWebSocket();
      return;
    }

    setIsStreaming(true);
    frameCounterRef.current = 0;
    console.log("Started live video streaming (no camera sounds)");

    // Start interval-based frame capture (2 FPS for smooth streaming)
    streamingIntervalRef.current = setInterval(() => {
      captureAndStreamFrame();
    }, 500); // 500ms = 2 FPS
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    frameCounterRef.current = 0;
    setFrameCount(0); // Reset frame counter

    // Clear streaming interval
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    console.log("Stopped live video streaming");
  };

  const sendPhotoToBackend = async (uri) => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    });
    try {
      console.log("Sending photo to backend:", uri);
      const response = await fetch("http://192.168.0.239:8000/upload-frame/", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const result = await response.json();
      console.log("Backend response:", result);
      Alert.alert(
        "Feedback",
        Array.isArray(result.feedback)
          ? result.feedback.join("\n")
          : result.feedback || result.error
      );
    } catch (error) {
      console.log("Upload failed:", error);
      Alert.alert("Upload failed", error.message);
    }
  };
  const handleCirclePress = async () => {
    if (!isStreaming) {
      // Start streaming
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log("Connecting to WebSocket...");
        connectWebSocket();

        // Wait for connection to establish before starting streaming
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("Starting streaming...");
            startStreaming();
          } else {
            Alert.alert(
              "Connection Failed",
              "Could not connect to server. Please check if the backend is running."
            );
          }
        }, 2000); // Increased timeout for better reliability
      } else {
        console.log("Starting streaming...");
        startStreaming();
      }
    } else {
      // Stop streaming
      console.log("Stopping streaming...");
      stopStreaming();
    }
  };

  useEffect(() => {
    (async () => {
      const { Camera } = await import("react-native-vision-camera");
      const status = await Camera.requestCameraPermission();
      console.log("Camera Status: ", status);
      setPermissionStatus(status);
      setHasPermission(
        status === "granted" || status === "authorized" || status === "limited"
      );
    })();

    // Cleanup on unmount
    return () => {
      stopStreaming();
      disconnectWebSocket();
    };
  }, []);
  const devices = useCameraDevices();
  console.log("All Devices:", Object.keys(devices));
  const device = devices[5];

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ color: "#fff" }}></Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ color: "#fff" }}>
          Loading camera...{" "}
          {device ? JSON.stringify(device, null, 2) : "No device found"}
        </Text>
      </View>
    );
  }
  if (!device) return null;
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        device={device}
        isActive={true}
        style={StyleSheet.absoluteFill}
        video={true}
        frameProcessor={frameProcessor}
      />

      {/* Processed frame overlay with pose landmarks */}
      {processedFrame && showProcessedFrame && (
        <Image
          source={{ uri: processedFrame }}
          style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
          resizeMode="cover"
        />
      )}

      {/* Status indicators */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Connection: {connectionStatus}</Text>
        <Text style={styles.statusText}>
          {isStreaming ? "🔴 Streaming" : "⚫ Not Streaming"}
        </Text>
        {isStreaming && (
          <Text style={styles.statusText}>Frames sent: {frameCount}</Text>
        )}
        <TouchableOpacity
          onPress={() => setShowProcessedFrame(!showProcessedFrame)}
          style={styles.toggleButton}
        >
          <Text style={styles.statusText}>
            {showProcessedFrame ? "Hide Landmarks" : "Show Landmarks"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <Ionicons name="camera-reverse" size={32} color="#fff" />

        <TouchableOpacity onPress={handleCirclePress}>
          <Animated.View
            style={[
              styles.circleBorder,
              { borderRadius: borderRadiusAnim },
              isStreaming ? styles.streamingButton : styles.normalButton,
            ]}
          >
            <Ionicons
              name={isStreaming ? "stop" : "play"}
              size={24}
              color="#fff"
            />
          </Animated.View>
        </TouchableOpacity>

        <Ionicons name="close" size={32} color="#fff" onPress={onBack} />
      </View>
    </View>
  );
  /*
  return (
    <View style={styles.container}>
      <CustomCamera device={device} />
      <TouchableOpacity style={styles.closeButton} onPress={onBack}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );*/
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  statusBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 2,
  },
  toggleButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  bottomBar: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto", // Pushes the bar to the bottom
    // Optionally add paddingBottom for safe area
    paddingBottom: 30,
    flexDirection: "row",
    alignContent: "center",
  },

  closeText: { color: "#fff", fontSize: 16 },

  circleBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 40,
    // Glow effect (iOS)
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    // Glow effect (Android)
    elevation: 12,
  },
  normalButton: {
    backgroundColor: "#FF8C00",
  },
  streamingButton: {
    backgroundColor: "#FF0000",
    shadowColor: "#FF0000",
  },
});
