#!/usr/bin/env bash
set -euo pipefail
: "${TRAEFIK_NETWORK:?Set TRAEFIK_NETWORK}"
: "${GAME_DOMAIN:?Set GAME_DOMAIN}"
command -v docker
command -v curl
test -s package-lock.json
[[ "$(docker info --format '{{.Swarm.ControlAvailable}}')" == true ]]
docker network inspect "$TRAEFIK_NETWORK" >/dev/null
docker node ls
echo "Swarm manager, overlay network and lockfile checked. Verify DNS, TLS and registry permissions."
