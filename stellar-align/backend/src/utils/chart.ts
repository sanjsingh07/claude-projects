/**
 * Transforms planetary positions from an object (as stored in DB) to an array for the frontend.
 * @param planetaryPositionsObj The planetary positions object from the database
 * @returns An array of planetary positions
 */
export function transformPlanetaryPositions(planetaryPositionsObj: any): any[] {
  if (!planetaryPositionsObj) return [];
  
  // If it's already an array, return it (but ensure planet names are lowercase)
  if (Array.isArray(planetaryPositionsObj)) {
    return planetaryPositionsObj.map((p: any) => ({
      ...p,
      planet: p.planet?.toString?.()?.toLowerCase?.() || p.planet,
    }));
  }

  return Object.values(planetaryPositionsObj).map((p: any) => ({
    planet: p.planet?.toString?.()?.toLowerCase?.() || p.planet,
    sign: p.sign,
    degree: p.degree,
    minute: p.minute,
    house: p.house,
    retrograde: p.retrograde,
  }));
}
