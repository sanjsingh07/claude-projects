export type ProgressLabel = "upcoming" | "active" | "completed" | "shadow";

export interface ProgressData {
  percentage: number | null;
  label: ProgressLabel;
}

export function computeTransitProgress(
  currentDate: Date,
  transitDate: Date,
  type: string,
  orb: number,
  maxOrb: number = 2.5,
  isApplying: boolean = true
): ProgressData {
  const now = currentDate.getTime();
  const event = transitDate.getTime();
  
  if (now < event - 86400000 * 2 && isApplying && orb > maxOrb * 0.9) {
    return { percentage: null, label: "upcoming" };
  }
  
  if (type === "shadow") {
    return { percentage: null, label: "shadow" };
  }
  
  // Calculate percentage based on orb and applying/separating status
  // Applying: 0% -> 50% (at exact)
  // Separating: 50% -> 100%
  let percentage: number;
  
  const intensity = Math.max(0, Math.min(1, 1 - orb / maxOrb));
  
  if (isApplying) {
    percentage = intensity * 50;
  } else {
    percentage = 50 + (1 - intensity) * 50;
  }
  
  if (now > event + 86400000 * 2 && !isApplying && orb > maxOrb * 0.9) {
    return { percentage: 100, label: "completed" };
  }
  
  return {
    percentage: Math.round(percentage),
    label: "active"
  };
}
