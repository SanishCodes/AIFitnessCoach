import * as React from 'react';
import { useState, useRef } from 'react';
import { StyleSheet, Text, SafeAreaView, Dimensions, View } from 'react-native';
import { RNMediapipe } from '@thinksys/react-native-mediapipe';
import { SquatAnalyzer } from '../components/SquatAnalyzer';
import { PushupAnalyzer } from '../components/PushupAnalyzer';
import { BicepCurlAnalyzer } from '../components/BicepCurlAnalyzer';

const screenHeight = Dimensions.get('window').height;

export default function FormAnalyzer() {
  const [squatCounter, setSquatCounter] = useState(0);
  const [warningMessages, setWarningMessages] = useState<string[]>([]);
  const squatAnalyzerRef = useRef(new SquatAnalyzer());
  const pushupAnalyzerRef = useRef(new PushupAnalyzer());
  const bicepAnalyzerRef = useRef(new BicepCurlAnalyzer());

  const [pushupAngles, setPushupAngles] = useState({
    shoulder: 0,
    lShoulder: 0,
    elbow: 0,
    maxElbow: 0,
    elbowDistance: 0,
    maxRElbowDistance: 0,
  });
  const [bicepAngles, setBicepAngles] = useState({
    shoulder: 0,
    elbow: 0,
  });
  const [pushupReps, setPushupReps] = useState(0);
  const [bicepReps, setBicepReps] = useState(0);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLandmark = (data: any) => {
    // const analyzer = squatAnalyzerRef.current;
    //const metrics = pushupAnalyzerRef.current.handleLandmark(data);
    const metrics = bicepAnalyzerRef.current.handleLandmark(data);
    //const analyzer = pushupAnalyzerRef.current;
    {
      /*
    setPushupAngles({
      shoulder: metrics.shoulderAngle,
      lShoulder: metrics.lShoulderAngle,
      elbow: metrics.elbowAngle,
      maxElbow: metrics.maxElbowAngle,
      elbowDistance: metrics.elbowDistance,
      maxRElbowDistance: metrics.maxRElbowDistance,
    });
     */
    }
    setBicepAngles({
      shoulder: metrics.shoulderAngle,
      elbow: metrics.elbowAngle,
    });
    setBicepReps(metrics.reps);

    setWarningMessages(metrics.warnings);
    //setPushupReps(metrics.reps);
    //const warnings = analyzer.handleLandmark(data);

    //setWarningMessages(warnings);
    //setSquatCounter(analyzer.getSquatCounter());
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNMediapipe
        style={styles.fullScreenCamera}
        width={Dimensions.get('window').width}
        height={Dimensions.get('window').height}
        onLandmark={handleLandmark}
        face={true}
        leftArm={true}
        rightArm={false}
        leftWrist={true}
        rightWrist={false}
        torso={true}
        leftLeg={true}
        rightLeg={false}
        leftAnkle={true}
        rightAnkle={false}
        minDetectionConfidence={0.6}
        minTrackingConfidence={0.2}
        modelComplexity={1}
      />

      {/*
      <View>
       <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Analyzing Squats</Text>
      </View>
       <Text style={styles.angleText}>
            Current Knee: {currentAngles.kneeAngle.toFixed(1)}°
          </Text>
         <Text style={styles.angleText}>
            Current Heel: {currentAngles.heelAngle.toFixed(1)}°
          </Text>
        <Text style={styles.angleText}>
            Current Hip: {currentAngles.hipAngle.toFixed(1)}°
          </Text>

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           <View style={styles.dataFeed}>
        <View style={styles.CounterContainer}>
          <Text style={styles.CounterLabel}>Squat Reps</Text>
          <Text style={styles.CounterNumber}>{squatCounter}</Text>
        </View>
        <View style={styles.warningOverlay}>
          {warningMessages.length > 0 ? (
            warningMessages.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                ⚠️ {warning}
              </Text>
            ))
          ) : (
            <Text style={styles.warningPlaceholder}></Text>
          )}
        </View>
      </View>
      </View>
     */}

      {/*
      <View>
        <View style={styles.dataFeed}>
          <View style={styles.CounterContainer}>
            <Text style={styles.CounterLabel}>Pushup Reps</Text>
            <Text style={styles.CounterNumber}>{pushupReps}</Text>
          </View>
          <View style={styles.warningOverlay}>
            {warningMessages.length > 0 ? (
              warningMessages.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))
            ) : (
              <Text style={styles.warningPlaceholder}>No warning yet</Text>
            )}
          </View>
        </View>
        <Text style={styles.angleText}>
          LeftShoulder: {pushupAngles.elbowDistance.toFixed(2)}°
        </Text>
        <Text style={styles.angleText}>
          Max Distance: {pushupAngles.maxRElbowDistance.toFixed(2)}°
        </Text>
        <Text style={styles.angleText}>
          Elbow: {pushupAngles.elbow.toFixed(1)}°
        </Text>
        <Text style={styles.angleText}>
          Max Elbow: {pushupAngles.maxElbow.toFixed(1)}°
        </Text>
      </View>
      */}

      <View>
        <View style={styles.dataFeed}>
          <View style={styles.CounterContainer}>
            <Text style={styles.CounterLabel}>Bicep Curl Reps</Text>
            <Text style={styles.CounterNumber}>{bicepReps}</Text>
          </View>
          <View style={styles.warningOverlay}>
            {warningMessages.length > 0 ? (
              warningMessages.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠️ {warning}
                </Text>
              ))
            ) : (
              <Text style={styles.warningPlaceholder}>No warning yet</Text>
            )}
          </View>
        </View>
        <Text style={styles.angleText}>
          Shoulder: {bicepAngles.shoulder.toFixed(2)}°
        </Text>
        <Text style={styles.angleText}>
          Elbow: {bicepAngles.elbow.toFixed(2)}°
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },

  fullScreenCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    padding: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dataFeed: {
    flexDirection: 'row',
    height: screenHeight * 0.16,
    marginTop: 40,
  },
  CounterContainer: {
    margin: 10,
    flex: 1,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#ff8c00',
  },
  CounterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  CounterNumber: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  warningOverlay: {
    margin: 10,
    flex: 3,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 2,
  },
  warningPlaceholder: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  metricsOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 15,
    right: 15,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 10,
    padding: 15,
    zIndex: 10,
  },
  counterSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 10,
    marginRight: 10,
    padding: 15,
  },

  anglesSection: {
    flex: 1,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
  },
  angleLabel: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  angleText: {
    color: '#000000',
    fontSize: 40,
    marginBottom: 3,
    textAlign: 'center',
    fontFamily: 'Courier New',
  },
  coordinateText: {
    color: '#95a5a6',
    fontSize: 38,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Courier New',
  },
  lastRepIndicator: {
    color: '#f39c12',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },

  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 10,
  },
});
