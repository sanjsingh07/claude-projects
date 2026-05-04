export function generateInterpretation(
  planet1: string,
  type: string,
  planet2?: string,
  sign?: string,
  isIngress: boolean = false,
  isRetrograde: boolean = false
): string {
  if (isRetrograde) {
    return `<em>${planet1} is shifting direction</em>. Illusion lifts — not all at once, but with a kind of internal reflection. Outer action becomes secondary.`;
  }

  if (isIngress) {
    if (planet1.toLowerCase() === 'venus' && sign?.toLowerCase() === 'cancer') {
      return `<em>Home and heart</em> align. What you love becomes where you are, and where you are becomes what you love. A phase of deep emotional rooting begins.`;
    }
    if (planet1.toLowerCase() === 'mars' && sign?.toLowerCase() === 'scorpio') {
      return `Desire goes underground. <em>You stop performing</em> what you think you should want and start wanting what you actually need. Power is not loud here.`;
    }
    return `<em>${planet1} enters ${sign}</em>. A new phase of energy in your life. Focus on the themes of ${sign} to make the most of this transition.`;
  }

  if (planet1.toLowerCase() === 'mercury' && planet2?.toLowerCase() === 'saturn') {
    return `Think twice before you speak. <em>What feels blocked is being clarified</em> — not stopped. Re-express your point. Slower is faster.`;
  }

  if (planet1.toLowerCase() === 'neptune' && type === 'retrograde') {
    return `<em>The dream shifts register.</em> Illusion lifts — not all at once, but with a kind of grief that is also relief. Reality reasserts itself in the places you had hoped it wouldn't.`;
  }

  const aspectMap: Record<string, string> = {
    CONJUNCTION: "merges with",
    SEXTILE: "harmonizes with",
    SQUARE: "challenges",
    TRINE: "flows with",
    OPPOSITION: "confronts",
  };

  const action = aspectMap[type] || "influences";
  
  return `Transit ${planet1} ${action} your natal ${planet2}. <em>This is a time for growth</em> and understanding the deeper connections between these planetary energies.`;
}
