# High Pedaller — runner and Swarm setup
## Prerequisites
1. Create and commit package-lock.json using Node 22 on a trusted machine: `npm install --package-lock-only`. Run `npm ci && npm run verify` before pushing. Never disable the lockfile gate.
2. Configure GitHub Actions and packages; grant GITHUB_TOKEN package write for the publish job and ensure Swarm hosts can pull from GHCR.
3. Configure a dedicated **production** GitHub Environment with required reviewer approval. Protect main and require the Verify job to pass; avoid allowing unreviewed PRs to execute on your Docker-capable runner.
4. Provision a trusted isolated self-hosted GitHub runner labelled `self-hosted`, `linux`, `swarm-manager` on a machine with access to the Docker Swarm manager. Do not allow arbitrary/untrusted workflow changes to run there. Prefer ephemeral runners and a tightly scoped deployment identity; Docker group membership is effectively root.
5. Set environment variables `GAME_DOMAIN` (e.g. highpedaller.virtualhowto.com) and `TRAEFIK_NETWORK` (the existing attachable overlay network name).
6. Confirm DNS resolves to Traefik, your TLS certificate is issued, and Traefik's Swarm service-provider mode reads deploy.labels from the same overlay network.
7. Verify a schedulable worker exists (stack uses node.role == worker). Confirm outbound registry access, runner disk space, and network ingress.
8. Manually run the Deploy Swarm workflow with a SHA that passed checks on main. Verify WebSockets survive Traefik proxying.
## Guardrails
- Single replica, in-memory room state. Deploy/restarts interrupt games. Don't scale until using shared session/matchmaking state.
- The deployed game has no account auth, anti-abuse, persistence or rate-limits beyond connection/input controls. Keep beta access restricted at ingress (e.g. VPN/IP allow-list/Authentik) until hardened, ensuring websocket upgrades work.
- Pin third-party Actions to commit SHAs, generate SBOM, sign images and add vulnerability scans in a subsequent hardening step before public launch.
- Roll back with `docker service update --rollback highpedaller_game` (on Swarm manager); capture logs before rollback. Ensure image and previous service spec remain available.
- No privileged Docker socket access is needed for PR checks; deployment job only on manual approval with dedicated runner.
