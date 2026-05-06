/**
 * Transforms planetary positions from an object (as stored in DB) to an array for the frontend.
 * @param planetaryPositionsObj The planetary positions object from the database
 * @returns An array of planetary positions
 */
export function transformPlanetaryPositions(planetaryPositionsObj: any): any[] {
   if (!planetaryPositionsObj) return [];

   // Defensive check: if it has a 'planetaryPositions' key and it's an array, it might be a DivisionalChart object
   if (planetaryPositionsObj.planetaryPositions && Array.isArray(planetaryPositionsObj.planetaryPositions)) {
     return transformPlanetaryPositions(planetaryPositionsObj.planetaryPositions);
   }

   // If it's already an array, return it (but ensure planet names are lowercase)
   if (Array.isArray(planetaryPositionsObj)) {
     return planetaryPositionsObj.map((p: any) => ({
       ...p,
       planet: (p.planet || p.name)?.toString?.()?.toLowerCase?.(),
     }));
   }

   // If it's an object, transform entries to an array
   return Object.entries(planetaryPositionsObj).map(([key, p]: [string, any]) => {
    // If p is just a string or number (shouldn't happen with current logic but for robustness)
    if (typeof p !== 'object') {
      return {
        planet: key.toLowerCase(),
        value: p
      };
    }

    return {
      planet: (p.planet || p.name || key)?.toString?.()?.toLowerCase?.(),
      sign: p.sign,
      degree: p.degree,
      minute: p.minute,
      house: p.house,
      retrograde: p.retrograde,
    };
  });
}
