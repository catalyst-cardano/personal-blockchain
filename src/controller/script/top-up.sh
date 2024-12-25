#!/usr/bin/env bash

set -eo pipefail

SCRIPT_DIR=$(realpath $(dirname $(realpath $0)))
NETWORK_ID=42

CCLI_CMD=
DEVNET_DIR=/devnet
# if [[ -n ${1} ]]; then
#     echo >&2 "Using provided cardano-cli command: ${1}"
#     $(${1} version > /dev/null)
#     CCLI_CMD=${1}
#     DEVNET_DIR=${SCRIPT_DIR}/devnet
# fi

DOCKER_COMPOSE_CMD=
if docker compose --version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

# Invoke cardano-cli in running cardano-node container or via provided cardano-cli
function ccli() {
  ccli_ ${@} --testnet-magic ${NETWORK_ID}
}
function ccli_() {
  # if [[ -x ${CCLI_CMD} ]]; then
  #     ${CCLI_CMD} ${@}
  # else
  #     ${DOCKER_COMPOSE_CMD} exec cardano-node cardano-cli ${@}
  # fi
  ${DOCKER_COMPOSE_CMD} exec cardano-node cardano-cli ${@}
}

# Retrieve some lovelace from faucet
function seedFaucet() {
  ACTOR=${1}
  AMOUNT=${2}

  # Determine faucet address and just the **first** txin addressed to it
  FAUCET_ADDR=$(ccli address build --payment-verification-key-file ${DEVNET_DIR}/credentials/faucet.vk)
  FAUCET_TXIN=$(ccli query utxo --address ${FAUCET_ADDR} --out-file /dev/stdout | jq -r 'keys[0]')

  # ACTOR_ADDR=$(ccli address build --payment-verification-key-file ${DEVNET_DIR}/credentials/${ACTOR}.vk)
  ACTOR_ADDR=${ACTOR}

  echo >&2 "Seeding a UTXO from faucet to ${ACTOR} with ${AMOUNT}Ł"

  ccli transaction build --babbage-era --cardano-mode \
    --change-address ${FAUCET_ADDR} \
    --tx-in ${FAUCET_TXIN} \
    --tx-out ${ACTOR_ADDR}+${AMOUNT} \
    --out-file ${DEVNET_DIR}/seed-${ACTOR}.draft >&2
  ccli transaction sign \
    --tx-body-file ${DEVNET_DIR}/seed-${ACTOR}.draft \
    --signing-key-file ${DEVNET_DIR}/credentials/faucet.sk \
    --out-file ${DEVNET_DIR}/seed-${ACTOR}.signed >&2
  SEED_TXID=$(ccli_ transaction txid --tx-file ${DEVNET_DIR}/seed-${ACTOR}.signed | tr -d '\r')
  SEED_TXIN="${SEED_TXID}#0"
  ccli transaction submit --tx-file ${DEVNET_DIR}/seed-${ACTOR}.signed >&2

  echo -n "Waiting for utxo ${SEED_TXIN}.." >&2

  while [[ "$(ccli query utxo --tx-in "${SEED_TXIN}" --out-file /dev/stdout | jq ".\"${SEED_TXIN}\"")" = "null" ]]; do
    sleep 1
    echo -n "." >&2
  done
  echo >&2 "Done"
}


echo "Seeding a UTXO from faucet to $1 with $2Ł"
seedFaucet $1 $2
