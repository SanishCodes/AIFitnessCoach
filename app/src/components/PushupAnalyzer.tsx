import calculateAngle from '../utils/CalculateAngle';

interface PushupAngles {
  elbowAngle: number;
  shoulderAngle: number;
  maxElbowAngle: number;
  lShoulderAngle: number;
  elbowDistance: number;
  maxRElbowDistance: number;
}

interface PushupState {
  descending: boolean;
  romWarningGiven: boolean;
  elbowFlareWarningGiven: boolean;
  noRepWarningGiven: boolean;
  maxElbowAngle: number;
  elbowDistance: number;
  maxRElbowDistance: number;
}

export interface PushupMetrics {
  shoulderAngle: number;
  elbowAngle: number;
  lShoulderAngle: number;
  reps: number;
  maxElbowAngle: number;
  stage: string | null;
  warnings: string[];
  elbowDistance: number;
  maxRElbowDistance: number;
}

export class PushupAnalyzer {
  private pushupCounter: number = 0;
  private pushupStage: string | null = null;
  private frameCount: number = 0;
  private warnings: string[] = [];
  private warningTimestamp: number = 0;

  private readonly LANDMARK_INDICES = {
    RIGHT_SHOULDER: 11,
    LEFT_SHOULDER: 12,
    RIGHT_ELBOW: 13,
    RIGHT_ANKLE: 15,
    RIGHT_HIP: 23,
  };

  private currentAngles: PushupAngles = {
    elbowAngle: 0,
    shoulderAngle: 0,
    maxElbowAngle: 0,
    lShoulderAngle: 0,
    elbowDistance: 0,
    maxRElbowDistance: 0,
  };

  private pushupState: PushupState = {
    descending: false,
    romWarningGiven: false,
    elbowFlareWarningGiven: false,
    noRepWarningGiven: false,
    maxElbowAngle: 0,
    elbowDistance: 0,
    maxRElbowDistance: 0,
  };

  private resetPushupRep(): void {
    this.pushupState = {
      ...this.pushupState,
      descending: false,
      maxElbowAngle: 0,
      romWarningGiven: false,
      noRepWarningGiven: false,
      elbowFlareWarningGiven: false,
      maxRElbowDistance: 0,
    };
  }

  public analyzePushup(landmarks: any[]): string[] {
    try {
      const currentTime = Date.now();

      if (
        this.warnings.length > 0 &&
        currentTime - this.warningTimestamp > 2000
      ) {
        this.warnings = [];
        this.warningTimestamp = 0;
        this.pushupState.descending = false;
        this.pushupState.romWarningGiven = false;
        this.pushupState.elbowFlareWarningGiven = false;
      }

      const rHip = landmarks[this.LANDMARK_INDICES.RIGHT_HIP];
      const rShoulder = landmarks[this.LANDMARK_INDICES.RIGHT_SHOULDER];
      const rElbow = landmarks[this.LANDMARK_INDICES.RIGHT_ELBOW];
      const rAnkle = landmarks[this.LANDMARK_INDICES.RIGHT_ANKLE];
      const lShoulder = landmarks[this.LANDMARK_INDICES.LEFT_SHOULDER];

      if (!rHip || !rShoulder || !rElbow || !rAnkle) {
        return [...this.warnings];
      }

      // Calculate shoulder width for normalization
      const shoulderWidth = Math.sqrt(
        Math.pow(rShoulder.x - lShoulder.x, 2) +
          Math.pow(rShoulder.y - lShoulder.y, 2)
      );

      // Distance from each elbow to the torso centerline
      const torsoCenter = {
        x: (rShoulder.x + rHip.x) / 2,
        y: (rShoulder.y + rHip.y) / 2,
      };

      const rElbowDistance = Math.sqrt(
        Math.pow(rElbow.x - torsoCenter.x, 2) +
          Math.pow(rElbow.y - torsoCenter.y, 2)
      );

      // Normalize by shoulder width
      const elbowDistance = rElbowDistance / shoulderWidth;

      const elbowAngle = calculateAngle(
        [rShoulder.x, rShoulder.y],
        [rElbow.x, rElbow.y],
        [rAnkle.x, rAnkle.y]
      );

      const shoulderAngle = calculateAngle(
        [rHip.x, rHip.y],
        [rShoulder.x, rShoulder.y],
        [rElbow.x, rElbow.y]
      );
      const lShoulderAngle = calculateAngle(
        [lShoulder.x, lShoulder.y],
        [rShoulder.x, rShoulder.y],
        [rElbow.x, rElbow.y]
      );

      this.currentAngles = {
        elbowAngle,
        shoulderAngle,
        lShoulderAngle,
        maxElbowAngle: this.pushupState.maxElbowAngle,
        elbowDistance,
        maxRElbowDistance: this.pushupState.maxRElbowDistance,
      };

      if (!this.pushupState.descending && elbowAngle > 20) {
        this.pushupState.descending = true;
        this.pushupStage = 'down';
      }

      if (this.pushupState.descending) {
        this.pushupState.maxElbowAngle = Math.max(
          this.pushupState.maxElbowAngle,
          elbowAngle
        );
        this.pushupState.maxRElbowDistance = Math.max(
          this.pushupState.maxRElbowDistance,
          elbowDistance
        );
      }

      if (this.pushupState.descending && elbowAngle < 10) {
        const newWarnings: string[] = [];

        if (
          !this.pushupState.noRepWarningGiven &&
          this.pushupState.maxElbowAngle < 100
        ) {
          newWarnings.push('NO REP!!!!');
          this.pushupState.noRepWarningGiven = true;
        } else {
          this.pushupCounter += 1;
          this.pushupStage = 'up';
          if (
            !this.pushupState.elbowFlareWarningGiven &&
            this.pushupState.maxRElbowDistance > 1.0
          ) {
            newWarnings.push('Elbow Flaring Out Too Much');
            this.pushupState.elbowFlareWarningGiven = true;
          }

          if (
            !this.pushupState.romWarningGiven &&
            this.pushupState.maxElbowAngle < 120
          ) {
            newWarnings.push('Poor Range of Motion');
            this.pushupState.romWarningGiven = true;
          }
          if (newWarnings.length > 0) {
            this.warnings = newWarnings;
            this.warningTimestamp = currentTime;
          }
        }

        this.resetPushupRep();
      }

      return [...this.warnings];
    } catch (e) {
      return [...this.warnings];
    }
  }

  public handleLandmark(data: any): PushupMetrics {
    const landmarks = data?.landmarks || [];
    this.frameCount = data?.additionalData?.frameNumber || 0;

    if (landmarks.length) {
      this.analyzePushup(landmarks);
    }
    return {
      shoulderAngle: this.currentAngles.shoulderAngle,
      elbowAngle: this.currentAngles.elbowAngle,
      lShoulderAngle: this.currentAngles.lShoulderAngle,
      reps: this.pushupCounter,
      stage: this.pushupStage,
      maxElbowAngle: this.currentAngles.maxElbowAngle,
      warnings: [...this.warnings],
      elbowDistance: this.currentAngles.elbowDistance,
      maxRElbowDistance: this.currentAngles.maxRElbowDistance,
    };
  }
  public getCurrentAngles(): PushupAngles {
    return { ...this.currentAngles };
  }

  public getPushupCounter(): number {
    return this.pushupCounter;
  }

  public getPushupStage(): string | null {
    return this.pushupStage;
  }
}
