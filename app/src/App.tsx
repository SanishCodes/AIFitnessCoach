import { useState } from "react";
import { Text, StyleSheet, View, Dimensions } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import Coach from "./screens/Coach";
import Progress from "./screens/Progress";
import Profile from "./screens/Profile";
import NavBar from "./components/NavBar";
import CameraScreen from "./screens/CameraScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const handleTabPress = (tabId) => {
    console.log("Tab Pressed", tabId);
    setActiveTab(tabId);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        console.log("Home");
        return <HomeScreen />;
      case "coach":
        console.log("coach");
        return <Coach />;
      case "progress":
        console.log("progress");
        return <Progress />;
      case "profile":
        console.log("profile");
        return <Profile />;
    }
  };
  return (
    <View style={styles.container}>
      {renderScreen()}
      <View style={styles.navContainer}>
        <NavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
