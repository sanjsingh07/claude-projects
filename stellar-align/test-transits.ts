import { getTransitsForPeriod } from "./backend/src/services/transits/transitEngine";
import { DateTime } from "luxon";

async function main() {
  const mockNatal = {
    planetaryPositions: [],
    houses: [],
    aspects: []
  };
  const result = await getTransitsForPeriod(mockNatal, "week", new Date());
  console.log(JSON.stringify(result.transits.slice(0, 2), null, 2));
}
main().catch(console.error);
