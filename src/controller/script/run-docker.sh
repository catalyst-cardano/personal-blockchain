#!/usr/bin/env bash

# Check epoch length, slot length and max transaction size parameters
if [ "$#" -ne 3 ]; then
  exit 1
fi
#
# Prepare environment to run the demo cluster, then launches docker-compose demo.
# If there's already a demo running, bail out.
set -e

SCRIPT_DIR=$(dirname $(realpath $0))
# SCRIPT_DIR=$SCRIPT_DIR/../../cardano/
cd ${SCRIPT_DIR}

DOCKER_COMPOSE_CMD=
if docker compose --version > /dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

SUDO=""
if sudo --version > /dev/null 2>&1; then
  SUDO="sudo"
fi

# Sanity check to prevent accidentally tripping oneself with an existing demo
# if ( ${DOCKER_COMPOSE_CMD} ps | grep hydra-node > /dev/null 2>&1 ); then
#   echo >&2 -e "# Demo already in progress, exiting"
#   echo >&2 -e "# To stop the demo use: ${DOCKER_COMPOSE_CMD} down"
#   exit 1
# fi

"${SCRIPT_DIR}/prepare-devnet.sh" "$1" "$2" "$3"
${DOCKER_COMPOSE_CMD} stop
${DOCKER_COMPOSE_CMD} up -d cardano-node postgres kupo cardano-node-ogmios icarus cardano-wallet
# ${DOCKER_COMPOSE_CMD} --profile cardano-node up -d

echo >&2 -e "\n# Sleep 5 sec"
sleep 5
echo >&2 -e "\n# Waiting for services:"
# Check http endpoint
kupo_url="http://localhost:1442/matches"
ogmios_url="http://localhost:1337"
service_urls=("$kupo_url" "$ogmios_url")
for url in "${service_urls[@]}"; do
  while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)

    if [[ $response == "200" ]]; then
      echo >&2 -e "Service is ready."
      break
    else
      echo >&2 -e "Service is starting. Continue checking..."
      sleep 5
    fi
  done
done


# Check cardano node
connected="Connected"
while true; do
  response=$(echo -e '\x1dclose\x0d' | telnet localhost 3001 | grep Connected)

  if [[ $response == *$connected* ]]; then
    echo >&2 -e "Cardano node is ready."
    break
  else
    echo >&2 -e "Cardano node is starting. Continue checking..."
    sleep 5
  fi
done
echo >&2 -e "\n# All services are ready!"

${SUDO} chown "${USER:=$(/usr/bin/id -run)}" "$SCRIPT_DIR/devnet/node.socket"

"${SCRIPT_DIR}/prepare-db-sync.sh"
#${DOCKER_COMPOSE_CMD} stop cardano-db-sync || true
${DOCKER_COMPOSE_CMD} up -d cardano-db-sync blockfrost
# ${DOCKER_COMPOSE_CMD} --profile cardano-db-sync up -d

echo >&2 -e "\n# Run to connect to socket: export CARDANO_NODE_SOCKET_PATH=${SCRIPT_DIR}/devnet/node.socket"
echo >&2 -e "\n# Query tip: cardano-cli query tip --testnet-magic 42"
echo >&2 -e "\n# Or: docker compose exec cardano-node cardano-cli query tip --testnet-magic 42"
echo >&2 -e "\n# Query address utxo: docker compose exec cardano-node cardano-cli query utxo --address addr_test1vz8nzrmel9mmmu97lm06uvm55cj7vny6dxjqc0y0efs8mtqsd8r5m --testnet-magic 42"
echo >&2 -e "\n# Stop the demo: ${DOCKER_COMPOSE_CMD} down\n"
