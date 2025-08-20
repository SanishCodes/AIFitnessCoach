import calculateAngle from '../utils/CalculateAngle';

interface SquatAngles {
  kneeAngle: number;
  hipAngle: number;
  heelAngle: number;
  maxKneeAngle: number;
  maxHipAngle: number;
  maxHeelAngle: number;
}

interface SquatState {
  descending: boolean;
  maxKneeForward: number;
  depthWarningGiven: boolean;
  backWarningGiven: boolean;
  toeWarningGiven: boolean;
  maxKneeAngle: number;
  maxHipAngle: number;
  maxHeelAngle: number;
  minHipAnkleDiff: number;
}

export class SquatAnalyzer {
  private squatCounter: number = 0;
  private squatStage: string | null = null;
  private frameCount: number = 0;
  private warnings: string[] = []; // Move warnings to class level
  private warningTimestamp: number = 0; // Track when warnings were set

  private readonly LANDMARK_INDICES = {
    RIGHT_SHOULDER: 11,
    RIGHT_HIP: 23,
    RIGHT_KNEE: 25,
    RIGHT_ANKLE: 27,
    RIGHT_HEEL: 29,
    RIGHT_FOOT_INDEX: 31,
  };

  private currentAngles: SquatAngles = {
    kneeAngle: 0,
    hipAngle: 0,
    heelAngle: 0,
    maxKneeAngle: 0,
    maxHipAngle: 0,
    maxHeelAngle: 0,
  };

  private squatState: SquatState = {
    descending: false,
    maxKneeForward: -1,
    depthWarningGiven: false,
    backWarningGiven: false,
    toeWarningGiven: false,
    maxKneeAngle: 0,
    maxHipAngle: 0,
    maxHeelAngle: 0,
    minHipAnkleDiff: 999,
  };

  private resetSquatRep(): void {
    this.squatState = {
      ...this.squatState,
      descending: false,
      maxKneeAngle: 0,
      maxHipAngle: 0,
      maxHeelAngle: 0,
      maxKneeForward: -1,
      minHipAnkleDiff: 999,
      // Don't reset warning flags here - let them persist until warnings are cleared
    };
  }

  public analyzeSquat(landmarks: any[]): string[] {
    try {
      const currentTime = Date.now();

      // Check if we should clear existing warnings after 2 seconds
      if (
        this.warnings.length > 0 &&
        currentTime - this.warningTimestamp > 2000
      ) {
        this.warnings = [];
        this.warningTimestamp = 0;
        // Reset warning flags when warnings are cleared
        this.squatState.depthWarningGiven = false;
        this.squatState.backWarningGiven = false;
        this.squatState.toeWarningGiven = false;
      }

      // Get required landmarks
      const rShoulder = landmarks[this.LANDMARK_INDICES.RIGHT_SHOULDER];
      const rHip = landmarks[this.LANDMARK_INDICES.RIGHT_HIP];
      const rKnee = landmarks[this.LANDMARK_INDICES.RIGHT_KNEE];
      const rAnkle = landmarks[this.LANDMARK_INDICES.RIGHT_ANKLE];
      const rFootIndex = landmarks[this.LANDMARK_INDICES.RIGHT_FOOT_INDEX];
      const rHeel = landmarks[this.LANDMARK_INDICES.RIGHT_HEEL];

      if (!rShoulder || !rHip || !rKnee || !rAnkle || !rFootIndex || !rHeel) {
        return [...this.warnings]; // Return copy of existing warnings
      }

      // Calculate angles
      const kneeAngle = calculateAngle(
        [rHip.x, rHip.y],
        [rKnee.x, rKnee.y],
        [rAnkle.x, rAnkle.y]
      );

      const hipAngle = calculateAngle(
        [rShoulder.x, rShoulder.y],
        [rHip.x, rHip.y],
        [rKnee.x, rKnee.y]
      );

      const heelAngle = calculateAngle(
        [rFootIndex.x, rFootIndex.y],
        [rHeel.x, rHeel.y],
        [rKnee.x, rKnee.y]
      );

      // Update current angles
      this.currentAngles = {
        kneeAngle,
        hipAngle,
        heelAngle,
        maxKneeAngle: this.squatState.maxKneeAngle,
        maxHipAngle: this.squatState.maxHipAngle,
        maxHeelAngle: this.squatState.maxHeelAngle,
      };

      // Start going down - trigger when knee angle > 85°
      if (kneeAngle > 85 && hipAngle > 45 && !this.squatState.descending) {
        this.squatState.descending = true;
        this.squatState.maxKneeAngle = kneeAngle;
        this.squatState.maxHipAngle = hipAngle;
        this.squatState.maxHeelAngle = heelAngle;
        this.squatStage = 'down';
      }

      if (this.squatState.descending) {
        this.squatState.maxKneeAngle = Math.max(
          this.squatState.maxKneeAngle,
          kneeAngle
        );
        this.squatState.maxHipAngle = Math.max(
          this.squatState.maxHipAngle,
          hipAngle
        );
        this.squatState.maxHeelAngle = Math.max(
          this.squatState.maxHeelAngle,
          heelAngle
        );
        this.squatState.maxKneeForward = Math.max(
          this.squatState.maxKneeForward,
          rKnee.x
        );
      }

      // Rep completion - coming back up
      if (kneeAngle < 30 && this.squatState.descending) {
        this.squatCounter++;

        const newWarnings: string[] = [];

        // Generate warnings based on the completed rep
        if (!this.squatState.toeWarningGiven) {
          if (this.squatState.maxHeelAngle > 135) {
            newWarnings.push('Your knees are past your toe');
            this.squatState.toeWarningGiven = true;
          }
        }

        if (!this.squatState.backWarningGiven) {
          if (
            (this.squatState.maxKneeAngle > 130 &&
              this.squatState.maxHipAngle > 140) ||
            (this.squatState.maxKneeAngle < 120 &&
              this.squatState.maxHipAngle > 135)
          ) {
            newWarnings.push('Straighten your back');
            this.squatState.backWarningGiven = true;
          }
        }

        // Check knee position
        if (
          !this.squatState.depthWarningGiven &&
          !this.squatState.backWarningGiven
        ) {
          if (this.squatState.maxKneeAngle > 140) {
            newWarnings.push('Too deep! Protect your knees');
            this.squatState.depthWarningGiven = true;
          } else if (this.squatState.maxKneeAngle < 110) {
            newWarnings.push('Not deep enough! Go deeper');
            this.squatState.depthWarningGiven = true;
          }
        }

        // If new warnings were generated, update the warnings and timestamp
        if (newWarnings.length > 0) {
          this.warnings = newWarnings;
          this.warningTimestamp = currentTime;
        }

        this.resetSquatRep();
        this.squatStage = 'up';
      }

      // Return copy of current warnings
      return [...this.warnings];
    } catch (error) {
      console.log('Error in squat analysis:', error);
      return [...this.warnings];
    }
  }

  public handleLandmark(data: any): string[] {
    const landmarks = data.landmarks || [];
    const frameNumber = data.additionalData?.frameNumber || 0;

    this.frameCount = frameNumber;

    if (landmarks.length > 0) {
      return this.analyzeSquat(landmarks);
    }

    return [...this.warnings];
  }

  public resetCounter(): void {
    this.squatCounter = 0;
    this.resetSquatRep();
    this.squatStage = null;
    this.warnings = []; // Clear warnings on reset
    this.warningTimestamp = 0;
    // Reset warning flags on manual reset
    this.squatState.depthWarningGiven = false;
    this.squatState.backWarningGiven = false;
    this.squatState.toeWarningGiven = false;
    this.currentAngles = {
      kneeAngle: 0,
      hipAngle: 0,
      heelAngle: 0,
      maxKneeAngle: 0,
      maxHipAngle: 0,
      maxHeelAngle: 0,
    };
  }

  // Getters for accessing state
  public getSquatCounter(): number {
    return this.squatCounter;
  }

  public getSquatStage(): string | null {
    return this.squatStage;
  }

  public getCurrentAngles(): SquatAngles {
    return { ...this.currentAngles };
  }

  public getFrameCount(): number {
    return this.frameCount;
  }
}
