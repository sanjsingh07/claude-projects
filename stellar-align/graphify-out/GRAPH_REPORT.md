# Graph Report - stellar-align  (2026-05-06)

## Corpus Check
- 96 files · ~46,820 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 403 nodes · 521 edges · 28 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e7d0c7ab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `ApiService` - 37 edges
2. `AIContentService` - 27 edges
3. `getTransitsForPeriod()` - 22 edges
4. `AuthService` - 15 edges
5. `AuthController` - 14 edges
6. `UserController` - 14 edges
7. `calculateVedicChart()` - 11 edges
8. `getPlanetaryPositions()` - 11 edges
9. `ApiError` - 10 edges
10. `authMiddleware()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `getTransitsForPeriod()`  [INFERRED]
  backend/src/test-transits.ts → backend/src/services/transits/transitEngine.ts
- `calculateNatalChart()` --calls--> `toSiderealLongitude()`  [INFERRED]
  backend/src/services/astrology.ts → backend/src/services/vedicAstrology.ts
- `getPlanetaryPositions()` --calls--> `toSiderealLongitude()`  [INFERRED]
  backend/src/services/astrology.ts → backend/src/services/vedicAstrology.ts
- `calculateTransits()` --calls--> `toSiderealLongitude()`  [INFERRED]
  backend/src/services/astrology.ts → backend/src/services/vedicAstrology.ts
- `generateDailyHoroscope()` --calls--> `calculateNakshatra()`  [INFERRED]
  backend/src/services/astrology.ts → backend/src/services/vedicAstrology.ts

## Communities (68 total, 18 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (21): calculateUserTransits(), main(), findNatalHouse(), formatSign(), generateInterpretation(), ordinal(), computeTransitProgress(), classifyTransitType() (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (19): assignHouses(), calcHouses(), calcPlanetPosition(), calculateAspects(), calculateCurrentTransits(), calculateForecast(), calculateNatalChart(), calculateTransits() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (22): calculateDivisional(), calculateNakshatra(), calculateVedicChart(), calculateVimshottariDasha(), createHouses(), detectYogas(), getAngularDistance(), getChaturthamsaSign() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (4): UserController, formatPlacement(), getSignBadgeType(), buildUserProfile()

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (4): handleNext(), handleSubmit(), validateStep1(), validateStep2()

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (5): AnthropicProvider, GeminiProvider, GroqProvider, NvidiaProvider, ResilientLLMProvider

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (4): ConflictError, ForbiddenError, UnauthorizedError, ValidationError

### Community 14 - "Community 14"
Cohesion: 0.43
Nodes (6): checkDatabaseHealth(), disconnectDatabase(), gracefulShutdown(), initJobs(), runHealthCheck(), startServer()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (4): errorHandler(), notFoundHandler(), profilerMiddleware(), requestIdMiddleware()

### Community 18 - "Community 18"
Cohesion: 0.38
Nodes (4): displayPlanetLabel(), displayPlanetName(), formatSign(), normalizeSign()

## Knowledge Gaps
- **1 isolated node(s):** `Planet`
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `Community 23` to `Community 12`, `Community 13`, `Community 16`, `Community 17`, `Community 20`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `calculateVedicChart()` connect `Community 4` to `Community 16`, `Community 3`, `Community 13`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `AIContentService` connect `Community 2` to `Community 1`, `Community 3`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `getTransitsForPeriod()` (e.g. with `main()` and `.getTransits()`) actually correct?**
  _`getTransitsForPeriod()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Planet` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._