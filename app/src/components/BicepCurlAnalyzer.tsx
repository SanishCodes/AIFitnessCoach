import type { FlatListComponent } from 'react-native';
import calculateAngle from '../utils/CalculateAngle';

interface BicepAngles {
  elbowAngle: number;
  shoulderAngle: number;
  minShoulderAngle: number;
  maxElbowAngle: number;
}

interface BicepState {
  descending: boolean;
  romWarningGiven: boolean;
  shoulderWarningGiven: boolean;
  noRepWarningGiven: boolean;
  maxElbowAngle: number;
  minShoulderAngle: number;
}

export interface BicepCurlMetrics {
  elbowAngle: number;
  shoulderAngle: number;
  maxElbowAngle: number;
  minShoulderAngle: number;
  reps: number;
  stage: string | null;
  warnings: string[];
}

export class BicepCurlAnalyzer {
  private curlCounter: number = 0;
  private curlStage: string | null = null;
  private warnings: string[] = [];
  private warningTimeStamp: number = 0;

  private readonly LANDMARK_INDICES = {
    RIGHT_SHOULDER: 11,
    RIGHT_ELBOW: 13,
    RIGHT_HIP: 23,
    RIGHT_ANKLE: 15,
  };

  private currentAngles: BicepAngles = {
    elbowAngle: 0,
    shoulderAngle: 0,
    maxElbowAngle: 0,
    minShoulderAngle: 0,
  };

  private bicepState: BicepState = {
    descending: false,
    romWarningGiven: false,
    shoulderWarningGiven: false,
    noRepWarningGiven: false,
    maxElbowAngle: 0,
    minShoulderAngle: 180,
  };

  private resetCurlRep(): void {
    this.bicepState = {
      ...this.bicepState,
      descending: false,
      maxElbowAngle: 0,
      minShoulderAngle: 180,
      romWarningGiven: false,
      noRepWarningGiven: false,
      shoulderWarningGiven: false,
    };
  }

  public analyzeBicepCurl(landmarks: any[]): string[] {
    try {
      const currentTime = Date.now();

      if (
        this.warnings.length > 0 &&
        currentTime - this.warningTimeStamp > 2000
      ) {
        this.warnings = [];
        this.warningTimeStamp = 0;
        this.bicepState.descending = false;
        this.bicepState.romWarningGiven = false;
        this.bicepState.shoulderWarningGiven = false;
        this.bicepState.noRepWarningGiven = false;
      }

      const rShoulder = landmarks[this.LANDMARK_INDICES.RIGHT_SHOULDER];
      const rElbow = landmarks[this.LANDMARK_INDICES.RIGHT_ELBOW];
      const rHip = landmarks[this.LANDMARK_INDICES.RIGHT_HIP];
      const rAnkle = landmarks[this.LANDMARK_INDICES.RIGHT_ANKLE];
      if (!rShoulder || !rElbow || !rHip) {
        return [...this.warnings];
      }

      // Calculate angles
      const elbowAngle = calculateAngle(
        [rShoulder.x, rShoulder.y],
        [rElbow.x, rElbow.y],
        [rAnkle.x, rAnkle.y]
      );
      const shoulderAngle = calculateAngle(
        [rElbow.x, rElbow.y],
        [rShoulder.x, rShoulder.y],
        [rHip.x, rHip.y]
      );

      this.currentAngles = {
        elbowAngle,
        shoulderAngle,
        maxElbowAngle: this.bicepState.maxElbowAngle,
        minShoulderAngle: this.bicepState.minShoulderAngle,
      };

      // 1. Start descending when elbow angle > 60
      if (!this.bicepState.descending && elbowAngle > 60) {
        this.bicepState.descending = true;
        this.curlStage = 'down';
      }

      // 2. Track max angles during descending
      if (this.bicepState.descending) {
        this.bicepState.maxElbowAngle = Math.max(
          this.bicepState.maxElbowAngle,
          elbowAngle
        );
        this.bicepState.minShoulderAngle = Math.min(
          this.bicepState.minShoulderAngle,
          shoulderAngle
        );
      }

      // 3. Stop descending when elbow angle < 40
      if (this.bicepState.descending && elbowAngle < 40) {
        const newWarnings: string[] = [];

        // 4. If maxElbowAngle < 70, give no rep warning, else count rep
        if (
          !this.bicepState.noRepWarningGiven &&
          this.bicepState.maxElbowAngle < 80
        ) {
          newWarnings.push('NO REP!!!!');
          this.bicepState.noRepWarningGiven = true;
        } else {
         
          if (
            !this.bicepState.shoulderWarningGiven &&
            this.bicepState.minShoulderAngle < 140
          ) {
            newWarnings.push('Dont Move Your Shoulders');
            this.bicepState.shoulderWarningGiven = true;
          }
          this.curlCounter += 1;
          this.curlStage = 'up';
        }

        if (newWarnings.length > 0) {
          this.warnings = newWarnings;
          this.warningTimeStamp = currentTime;
        }

        this.resetCurlRep();
      }

      return [...this.warnings];
    } catch (e) {
      return [...this.warnings];
    }
  }

  public handleLandmark(data: any): BicepCurlMetrics {
    const landmarks = data?.landmarks || [];
    // Optionally, track frame count or other metadata here

    if (landmarks.length) {
      this.analyzeBicepCurl(landmarks);
    }

    return {
      shoulderAngle: this.currentAngles.shoulderAngle,
      elbowAngle: this.currentAngles.elbowAngle,
      maxElbowAngle: this.currentAngles.maxElbowAngle,
      minShoulderAngle: this.currentAngles.minShoulderAngle,
      reps: this.curlCounter,
      stage: this.curlStage,
      warnings: [...this.warnings],
    };
  }
}
