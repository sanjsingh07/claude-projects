# Graph Report - stellar-align  (2026-05-04)

## Corpus Check
- 73 files · ~36,362 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 311 nodes · 369 edges · 19 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fad44b5e`
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `ApiService` - 34 edges
2. `AIContentService` - 17 edges
3. `AuthService` - 15 edges
4. `AuthController` - 14 edges
5. `UserController` - 13 edges
6. `calculateVedicChart()` - 11 edges
7. `ApiError` - 9 edges
8. `HoroscopeController` - 9 edges
9. `calculateDivisional()` - 9 edges
10. `authMiddleware()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `gracefulShutdown()` --calls--> `disconnectDatabase()`  [INFERRED]
  backend/src/index.ts → backend/src/config/database.ts
- `runHealthCheck()` --calls--> `checkDatabaseHealth()`  [INFERRED]
  backend/src/index.ts → backend/src/config/database.ts
- `startServer()` --calls--> `checkDatabaseHealth()`  [INFERRED]
  backend/src/index.ts → backend/src/config/database.ts

## Communities (52 total, 10 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (25): calculateDivisional(), calculateNakshatra(), calculateVedicChart(), calculateVimshottariDasha(), createHouses(), detectYogas(), getAngularDistance(), getAyanamsa() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (4): ChatController, authMiddleware(), validateRequest(), ApiError

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (6): HoroscopeController, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (11): assignHouses(), calcHouses(), calcPlanetPosition(), calculateAspects(), calculateNatalChart(), generateDailyHoroscope(), getCurrentPlanetaryPositions(), getMoonPhase() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (4): handleNext(), handleSubmit(), validateStep1(), validateStep2()

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (5): AnthropicProvider, GeminiProvider, GroqProvider, NvidiaProvider, ResilientLLMProvider

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (4): errorHandler(), notFoundHandler(), profilerMiddleware(), requestIdMiddleware()

### Community 13 - "Community 13"
Cohesion: 0.43
Nodes (6): checkDatabaseHealth(), disconnectDatabase(), gracefulShutdown(), initJobs(), runHealthCheck(), startServer()

### Community 14 - "Community 14"
Cohesion: 0.38
Nodes (4): displayPlanetLabel(), displayPlanetName(), formatSign(), normalizeSign()

## Knowledge Gaps
- **1 isolated node(s):** `Planet`
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `Community 2` to `Community 3`, `Community 12`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `calculateVedicChart()` connect `Community 1` to `Community 3`, `Community 6`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `Planet` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._