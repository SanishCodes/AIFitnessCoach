// Calculate angle function using vector dot product method
const calculateAngle = (a: number[], b: number[], c: number[]): number => {
  // Calculate vectors from b to a and b to c
  const vectorBA = [a[0] - b[0], a[1] - b[1]];
  const vectorBC = [c[0] - b[0], c[1] - b[1]];

  // Calculate dot product
  const dotProduct = vectorBA[0] * vectorBC[0] + vectorBA[1] * vectorBC[1];

  // Calculate magnitudes
  const magnitudeBA = Math.sqrt(vectorBA[0] ** 2 + vectorBA[1] ** 2);
  const magnitudeBC = Math.sqrt(vectorBC[0] ** 2 + vectorBC[1] ** 2);

  // Calculate cosine of angle
  const cosTheta = dotProduct / (magnitudeBA * magnitudeBC);

  // Ensure cosTheta is within valid range [-1, 1] to avoid NaN
  const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));

  // Calculate angle in radians and convert to degrees
  const angleInRadians = Math.acos(clampedCosTheta);
  let angleInDegrees = (angleInRadians * 180) / Math.PI;

  // For joint angles, we often want the exterior angle (supplementary angle)
  // This gives us the "opening" of the joint rather than the "closing"
  angleInDegrees = 180 - angleInDegrees;

  return Math.round(angleInDegrees);
};

export default calculateAngle;
