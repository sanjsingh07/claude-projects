export function generateInterpretation(
  planet1: string,
  type: string,
  planet2?: string,
  sign?: string,
  isIngress: boolean = false,
  isRetrograde: boolean = false,
  natalChart?: any,
): string {
  const p1 = planet1.toLowerCase();
  const p2 = planet2?.toLowerCase();
  const s = sign?.toLowerCase();
  const chartAnchor = natalChart
    ? `your ${formatSign(natalChart.sunSign)} Sun, ${formatSign(natalChart.moonSign)} Moon${natalChart.risingSign ? `, and ${formatSign(natalChart.risingSign)} Rising` : ""}`
    : "your natal chart";
  const natalHouse = findNatalHouse(natalChart, planet2);
  const housePhrase = natalHouse ? ` in your natal ${ordinal(natalHouse)} house` : "";

  if (isRetrograde) {
    if (p1 === 'neptune') {
      return `<em>The dream shifts register.</em> Against ${chartAnchor}, Neptune asks you to notice where longing has been louder than evidence. Reality reasserts itself gently, then unmistakably.`;
    }
    return `<em>${planet1} is shifting direction</em> against ${chartAnchor}. Outer action becomes secondary; the important movement is the private revision. What looked settled may need a cleaner motive.`;
  }

  if (isIngress) {
    if (p1 === 'venus' && s === 'cancer') {
      return `<em>Home and heart</em> align for ${chartAnchor}. What you love becomes easier to locate in daily life, not as fantasy but as a place your body recognizes.`;
    }
    if (p1 === 'mars' && s === 'scorpio') {
      return `Desire goes underground. <em>You stop performing</em> what you think you should want and start noticing what your chart has been protecting. Power is not loud here.`;
    }
    if (p1 === 'jupiter' && s === 'aries') {
      return `A surge of <em>raw initiative</em> meets ${chartAnchor}. You are no longer waiting for permission to expand; the next move needs courage more than consensus.`;
    }
    return `<em>${planet1} enters ${sign}</em> and changes the weather around ${chartAnchor}. The shift is subtle at first: appetite, timing, and attention begin choosing different rooms.`;
  }

  // Specific Planet-to-Natal Aspects
  if (p1 === 'mercury' && p2 === 'saturn') {
    return `Think twice before you speak. <em>What feels blocked is being clarified</em> around your natal Saturn${housePhrase} — not stopped. Re-express the point with fewer defenses.`;
  }
  
  if (p1 === 'saturn' && p2 === 'sun' && type === 'SQUARE') {
    return `This is a test against your ${formatSign(natalChart?.sunSign)} Sun${housePhrase}. You are being asked to prove something to yourself, not to perform certainty for everyone else. <em>The structure you built is being tested.</em>`;
  }

  if (p1 === 'venus' && p2 === 'mars' && type === 'TRINE') {
    return `Desire and action <em>find a common language</em> through your natal Mars${housePhrase}. You do not have to choose between what you want and how you move toward it.`;
  }

  const aspectMap: Record<string, string> = {
    CONJUNCTION: "merges with",
    SEXTILE: "harmonizes with",
    SQUARE: "challenges",
    TRINE: "flows with",
    OPPOSITION: "confronts",
  };

  const action = aspectMap[type] || "influences";
  const natalRef = p2 === 'sun' ? `your ${formatSign(natalChart?.sunSign)} Sun` : p2 === 'moon' ? `your ${formatSign(natalChart?.moonSign)} Moon` : `your natal ${planet2}`;
  
  return `${planet1} ${action} ${natalRef}${housePhrase}. <em>The specific degrees matter here:</em> this contact asks for a precise response from the part of you ruled by ${planet2}. Watch how your ${formatSign(natalChart?.sunSign)} Sun navigates this pressure.`;
}

function findNatalHouse(natalChart: any, planet?: string): number | null {
  if (!natalChart || !planet) return null;
  const positions = natalChart.planetaryPositions || {};
  const pos = positions[String(planet).toLowerCase()] || positions[String(planet).toUpperCase()];
  return typeof pos?.house === "number" ? pos.house : null;
}

function formatSign(sign?: string): string {
  if (!sign) return "natal";
  return sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}
