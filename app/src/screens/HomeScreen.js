import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import React, { useState } from "react";
import AnimatedContainer from "../components/AnimatedContainer";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <View style={styles.container}>
      <AnimatedContainer />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.card}></View>
          {/* Add more content here if needed */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: height * 0.1, // Space for NavBar
  },
  contentContainer: {
    // Renamed to avoid duplicate
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: 50, // Add some top padding
  },
  card: {
    width: width * 0.8, // Use screen width
    height: height * 0.2, // Use screen height
    backgroundColor: "#ff7700",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
});
