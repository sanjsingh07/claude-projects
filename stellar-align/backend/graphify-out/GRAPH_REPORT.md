# Graph Report - backend  (2026-05-20)

## Corpus Check
- 68 files · ~34,413 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 302 nodes · 479 edges · 17 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96d3b7b9`
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

## God Nodes (most connected - your core abstractions)
1. `getTransitsForPeriod()` - 26 edges
2. `AIContentService` - 23 edges
3. `UserController` - 15 edges
4. `AuthService` - 15 edges
5. `calculateVedicChart()` - 14 edges
6. `AuthController` - 12 edges
7. `getPlanetaryPositions()` - 12 edges
8. `ApiError` - 11 edges
9. `authMiddleware()` - 10 edges
10. `HoroscopeController` - 10 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `getTransitsForPeriod()`  [INFERRED]
  test-transits.ts → services/transits/transitEngine.ts
- `investigate()` --calls--> `getTransitsForPeriod()`  [INFERRED]
  investigate_may_11.ts → services/transits/transitEngine.ts
- `gracefulShutdown()` --calls--> `disconnectDatabase()`  [INFERRED]
  index.ts → config/database.ts
- `runHealthCheck()` --calls--> `checkDatabaseHealth()`  [INFERRED]
  index.ts → config/database.ts
- `startServer()` --calls--> `checkDatabaseHealth()`  [INFERRED]
  index.ts → config/database.ts

## Communities (32 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (10): ChatController, NotificationController, SettingsController, TransitController, authMiddleware(), validateRequest(), getUserSettings(), updateUserSettings() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (26): calculateUserTransits(), getOrb(), isAspectApplying(), investigate(), main(), findNatalHouse(), formatSign(), generateInterpretation() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (26): ChartService, calculateDivisional(), calculateNakshatra(), calculateVedicChart(), calculateVimshottariDasha(), createHouses(), detectYogas(), getAngularDistance() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (5): AuthService, getAllTimezones(), getTimezoneFromCoords(), getTimezoneOffset(), validateTimezone()

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (9): AnthropicProvider, GeminiProvider, GroqProvider, maskKey(), NvidiaProvider, OpencodeProvider, OpenRouterProvider, ResilientLLMProvider (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (17): assignHouses(), calcHouses(), calcPlanetPosition(), calculateAspects(), calculateCurrentTransits(), calculateForecast(), calculateNatalChart(), calculateTransits() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (4): UserController, formatPlacement(), getSignBadgeType(), buildUserProfile()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): ConflictError, ForbiddenError, UnauthorizedError, ValidationError

### Community 11 - "Community 11"
Cohesion: 0.43
Nodes (6): checkDatabaseHealth(), disconnectDatabase(), gracefulShutdown(), initJobs(), runHealthCheck(), startServer()

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (4): errorHandler(), notFoundHandler(), profilerMiddleware(), requestIdMiddleware()

## Knowledge Gaps
- **1 isolated node(s):** `Planet`
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `calculateVedicChart()` connect `Community 2` to `Community 0`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `getTransitsForPeriod()` connect `Community 1` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `ApiError` connect `Community 0` to `Community 9`, `Community 3`, `Community 12`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `getTransitsForPeriod()` (e.g. with `main()` and `investigate()`) actually correct?**
  _`getTransitsForPeriod()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `calculateVedicChart()` (e.g. with `.calculateVedicChartForUserInternal()` and `.calculateAllChartsForUser()`) actually correct?**
  _`calculateVedicChart()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Planet` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._