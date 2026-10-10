# HIGH PEDALLER
Australian-inspired underground **closed-course** drag racing. Server-authoritative 402 m multiplayer prototype.

## Local
Requires Node 22+, Docker (for image builds).
```sh
npm install
npm run verify
npm start
```
Open http://localhost:8080 in two tabs. Public matchmaking or private six-character room code. Hold Space to accelerate; W/Up to shift.

## Delivery
PRs run verification, dependency audit, container build/smoke tests. Production deployment is **manual** via protected GitHub `production` environment on a separate trusted Swarm-manager runner. One replica only: matchmaking is in-memory; no durable garage/accounts/leaderboards yet.

**Important:** run `npm install --package-lock-only` on a network-connected trusted machine and commit `package-lock.json` **before CI/container builds can pass**. CI intentionally fails closed when lockfile is absent. See [operations guide](docs/OPERATIONS.md).
