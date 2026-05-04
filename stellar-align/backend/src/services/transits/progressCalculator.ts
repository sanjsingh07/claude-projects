export type ProgressLabel = "upcoming" | "active" | "completed" | "shadow";

export interface ProgressData {
  percentage: number | null;
  label: ProgressLabel;
}

export function computeTransitProgress(
  currentDate: Date,
  transitDate: Date,
  type: string,
  orb: number
): ProgressData {
  const now = currentDate.getTime();
  const event = transitDate.getTime();
  
  if (now < event - 86400000 * 2) {
    return { percentage: null, label: "upcoming" };
  }
  
  if (type === "shadow") {
    return { percentage: null, label: "shadow" };
  }
  
  // Calculate percentage based on orb (simplified)
  // Assume a 10 degree window for most transits
  let percentage = Math.max(0, Math.min(100, (1 - orb / 10) * 100));
  
  if (now > event + 86400000 * 2) {
    return { percentage: 100, label: "completed" };
  }
  
  return {
    percentage: Math.round(percentage),
    label: "active"
  };
}
