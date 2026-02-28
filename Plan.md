# Nexo 2.0 Execution Plan (Quality-first, Docker VM)

## Vision
Build Nexo 2.0 as a polished, reliable, and scalable game platform — not just a rewrite. With infra already paid and ready, this plan optimizes for engineering quality, UX quality, and operational robustness.

Core outcomes:
- Excellent player experience (smooth, consistent, fun)
- Correct and fair multiplayer behavior
- Clean architecture with low maintenance burden
- Fast development iteration with Docker-based workflows
- Production-grade deployment, backup, monitoring, and recovery

---

## 1) Deployment baseline (already available)

- Proxmox VE
- Docker VM (primary runtime)
- Xoraxy reverse proxy (TLS + domain routing)
- Custom domain (already managed)

Decision: **Docker VM is the canonical runtime for dev/staging/prod parity.**

---

## 2) Target stack

## Frontend
- SvelteKit
- TypeScript
- Tailwind CSS
- Svelte transitions (or Motion One where needed)

## Backend
- PocketBase (auth, db, realtime)
- SvelteKit server endpoints for game-critical operations
- Background jobs for daily puzzle generation and maintenance

## Infrastructure runtime
- Docker Compose (single source of truth)
- Dedicated internal bridge network
- Volumes for data durability
- healthchecks + restart policies

---

## 3) Engineering standards (non-negotiable)

## Architecture
- Feature modules only (no giant page orchestrators)
- Shared domain types and validators across client/server
- Server-authoritative multiplayer state transitions

## Code quality
- Strict TypeScript
- Lint + format in CI
- Conventional commit style
- PR checklist for state, security, and UX edge cases

## Reliability
- Every critical endpoint idempotent
- Structured logs with trace/request IDs
- Explicit error taxonomy (user vs system vs retryable)

## Security
- Validate all payloads at boundary
- Least-privilege API/collection access
- Rate limiting and abuse controls on matchmaking/auth/score endpoints

---

## 4) Docker-first architecture

## Services
- `app`: SvelteKit Node server
- `pocketbase`: PocketBase API + realtime + data
- `jobs`: scheduled tasks for daily puzzles/maintenance

## Network model
- Internal network: `nexo_internal`
- Only `app` exposed to Xoraxy target port
- PocketBase and jobs remain internal-only

## Data durability
- `pocketbase_data` volume
- `app_logs` volume
- `backup_output` volume

## Operational controls
- Healthcheck for each service
- Restart policy `unless-stopped`
- Readiness checks before dependent startup

---

## 5) Data and domain model direction

## Core collections/tables (PocketBase)
- users
- profiles
- ratings
- daily_puzzles
- duel_puzzles
- rooms
- matchmaking_queue
- scores
- leaderboard_snapshots

## Critical indexes
- queue: `game_type + status + created`
- rooms: `status + updated`
- scores: `game_type + puzzle_date + time_ms`
- ratings: `game_type + rating`

## Integrity rules
- Score writes only via server endpoint
- Winner resolution only via server endpoint
- Move submission requires room version check

---

## 6) Multiplayer correctness model

## Room contract
Each active room state contains:
- `gameType`
- `status`
- `participants`
- `turn`
- `boardState`
- `round`
- `winner`
- `version`

## Move flow
1. Client sends action with last known room version
2. Server validates turn, legality, and version
3. Server applies action atomically and increments version
4. Realtime update notifies clients

## Anti-desync safeguards
- Reject stale actions
- Reject out-of-turn actions
- Deterministic rule engine on server
- Optional periodic room checksum for long matches

---

## 7) UX quality targets

- Sub-100ms input feedback for local interactions
- Clear game-state banners: searching, connected, your turn, waiting, reconnecting
- Consistent win/lose/completion transitions across all games
- Minimal-friction onboarding (play fast, learn in-context)
- Robust retry flows with actionable errors

---

## 8) PWA strategy

- Installable app shell
- Cache-first shell, network-first dynamic game payloads
- Offline support for:
  - local modes
  - cached screens
- Online-only for:
  - ranked multiplayer
  - global leaderboard writes

---

## 9) Observability and operations

## Monitoring
- Service health endpoint per container
- Uptime monitor against public app URL
- Error aggregation (client + server)

## Logging
- JSON logs
- Request ID correlation across app endpoints and jobs
- Matchmaking event timeline logs for diagnostics

## Runbooks
- Incident runbook (latency, outages, data corruption)
- Restore runbook (DB + uploads)
- Deploy rollback runbook

---

## 10) Backup and restore policy

## Backups
- Nightly PocketBase data snapshot
- Upload assets backup
- Retention policy (e.g., 14 daily + 8 weekly)

## Restore
- One-command restore script
- Monthly restore drill
- Record RTO/RPO and improve

---

## 11) CI/CD baseline

## CI gates
- typecheck
- lint
- unit tests
- integration tests
- e2e smoke

## Release strategy
- Tagged release images
- Staging validation before prod switch
- Quick rollback to previous compose image tags

---

## 12) Implementation roadmap

## Phase A — Platform foundation
- [ ] A1 Scaffold SvelteKit architecture
  - [ ] strict TS, module boundaries, shared validators
  - [ ] global and route-level error boundaries
- [ ] A2 Docker production baseline
  - [ ] compose stack (`app`, `pocketbase`, `jobs`)
  - [ ] healthchecks, internal networking, volumes
- [ ] A3 Xoraxy integration
  - [ ] secure route mapping
  - [ ] websocket/realtime forwarding verification

## Phase B — Auth + profile
- [ ] B1 Account system
  - [ ] signup/login/logout/session handling
  - [ ] optional guest-onboarding strategy
- [ ] B2 Profile domain
  - [ ] profile edit/preferences/avatar
  - [ ] profile validation + access controls

## Phase C — Single-player core
- [ ] C1 Crossword module
  - [ ] generator + quality thresholding
  - [ ] daily/random endpoints + UI flow
- [ ] C2 Wordsearch module
  - [ ] generator + hint penalties + completion
  - [ ] daily/random endpoints + UI flow
- [ ] C3 Score + leaderboard
  - [ ] validated score pipeline
  - [ ] leaderboard query and ranking

## Phase D — Multiplayer foundation
- [ ] D1 Matchmaking service
  - [ ] queue join/leave
  - [ ] public/private room matching
- [ ] D2 Shared room engine
  - [ ] versioned action pipeline
  - [ ] authoritative winner resolution

## Phase E — Competitive games
- [ ] E1 Tic-Tac-Toe
  - [ ] local polished mode
  - [ ] online validated mode
- [ ] E2 Battleship
  - [ ] local polished mode
  - [ ] online server-authoritative mode

## Phase F — Reliability, polish, launch
- [ ] F1 UX polish pass
  - [ ] animation consistency and feedback loops
- [ ] F2 Security pass
  - [ ] endpoint hardening + abuse controls
- [ ] F3 Ops pass
  - [ ] backup automation + restore drill + runbooks
- [ ] F4 Launch
  - [ ] staged rollout + monitoring + rollback readiness

---

## 13) First 2-week sprint (high-impact)

## Week 1
- Build Docker baseline (`app`, `pocketbase`, `jobs`)
- Wire Xoraxy route and verify realtime/websocket behavior
- Implement auth + profile foundations
- Ship crossword vertical slice

## Week 2
- Ship wordsearch vertical slice
- Implement validated score + leaderboard flow
- Add core tests + uptime checks + backup script

---

## 14) Definition of done

Nexo 2.0 is ready when:
- Deployment is reproducible via Docker Compose
- Multiplayer outcomes are server-correct and race-safe
- UX is smooth and consistent across games
- Monitoring and backup/restore are proven in practice
- Codebase remains modular and easy to evolve

---

## 15) Final direction

Given your current infra maturity (Proxmox + Docker VM + Xoraxy + domain), the right strategy is:
- prioritize product quality and reliability over cost constraints
- enforce engineering discipline early
- ship vertical slices with production-grade operations from day one

This gives you both a better game and a better codebase long-term.
