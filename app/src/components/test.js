import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function NavBar({ activeTab, onTabPress }) {
  const tabs = [
    {
      id: "home",
      label: null,
      icon: require("../assets/images/nav-icons/home.png"),
    },
    {
      id: "coach",
      label: null,
      icon: require("../assets/images/nav-icons/coach.png"),
    },
    {
      id: "progress",
      label: null,
      icon: require("../assets/images/nav-icons/progress.png"),
    },
    {
      id: "profile",
      label: null,
      icon: require("../assets/images/nav-icons/profile.png"),
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab == tab.id && styles.activeTab]}
          onPress={() => onTabPress(tab.id)}
        >
          <Image
            source={tab.icon}
            style={[styles.icon, activeTab === tab.id && styles.activeIcon]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(38, 38, 38, 0.2)",
    height: height * 0.1,
    borderRadius: 15,
    borderTopWidth: 1,
    borderTopColor: "#9bc063",
    shadowColor: "#9bc063",

    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  activeIcon: {
    // Add this missing style
    tintColor: "#9bc063",
    width: width * 0.08, // 6% of screen width
    height: width * 0.08,
  },
  icon: {
    width: width * 0.06, // 6% of screen width
    height: width * 0.06,
    marginBottom: 4,
    tintColor: "#ffffff",
  },

  label: {
    fontSize: 12,
    color: "#666",
  },
  activeLabel: {
    color: "#9bc063",
  },
});
