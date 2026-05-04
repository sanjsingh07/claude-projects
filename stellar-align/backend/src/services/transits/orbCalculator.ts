export interface OrbData {
  value: number;
  formatted: string;
}

export function calculateOrb(angle1: number, angle2: number, targetAngle: number): OrbData {
  let diff = Math.abs(angle1 - angle2);
  if (diff > 180) diff = 360 - diff;
  
  const orbValue = Math.abs(diff - targetAngle);
  
  const degrees = Math.floor(orbValue);
  const minutes = Math.round((orbValue - degrees) * 60);
  
  // Format: 0°12'
  const formatted = `${degrees}°${minutes.toString().padStart(2, '0')}'`;
  
  return {
    value: orbValue,
    formatted
  };
}
