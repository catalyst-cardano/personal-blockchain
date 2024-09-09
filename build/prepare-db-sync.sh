#!/usr/bin/env bash

# Prepare a "devnet" directory holding credentials, a dummy topology and
# "up-to-date" genesis files. If the directory exists, it is wiped out.
set -eo pipefail

SCRIPT_DIR=$(realpath $(dirname $(realpath $0)))
NETWORK_ID=42

CCLI_CMD=
DEVNET_DIR=/devnet
if [[ -n ${1} ]]; then
    echo >&2 "Using provided cardano-cli command: ${1}"
    $(${1} version > /dev/null)
    CCLI_CMD=${1}
    DEVNET_DIR=${SCRIPT_DIR}/devnet
fi

DOCKER_COMPOSE_CMD=
if docker compose --version > /dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

function ccli() {
  if [[ -x ${CCLI_CMD} ]]; then
      ${CCLI_CMD} ${@}
  else
      ${DOCKER_COMPOSE_CMD} exec cardano-node cardano-cli ${@}
  fi
}

function is_gnu_sed(){
  sed --version >/dev/null 2>&1
}

function sed_i_wrapper(){
  if is_gnu_sed; then
    $(which sed) "$@"
  else
    a=()
    for b in "$@"; do
      [[ $b == '-i' ]] && a=("${a[@]}" "$b" "") || a=("${a[@]}" "$b")
    done
    $(which sed) "${a[@]}"
  fi
}


# BASEDIR=$(realpath $(dirname $(realpath $0))/..)
TARGETDIR="devnet"

echo "Update genesis"
ByronGenesisHash=$(ccli byron genesis print-genesis-hash --genesis-json /devnet/genesis-byron.json)
ShelleyGenesisHash=$(ccli genesis hash --genesis /devnet/genesis-shelley.json)
AlonzoGenesisHash=$(ccli genesis hash --genesis /devnet/genesis-alonzo.json)
ConwayGenesisHash=$(ccli genesis hash --genesis /devnet/genesis-conway.json)

sed_i_wrapper -i "s/xByronGenesisHash/${ByronGenesisHash}/g" "$TARGETDIR/cardano-node-db.json"
sed_i_wrapper -i "s/xShelleyGenesisHash/${ShelleyGenesisHash}/g" "$TARGETDIR/cardano-node-db.json"
sed_i_wrapper -i "s/xAlonzoGenesisHash/${AlonzoGenesisHash}/g" "$TARGETDIR/cardano-node-db.json"
sed_i_wrapper -i "s/xConwayGenesisHash/${ConwayGenesisHash}/g" "$TARGETDIR/cardano-node-db.json"

echo "Collecting epoch 0 nonce and pools"

Epoch0Nonce=$(ccli query protocol-state --testnet-magic ${NETWORK_ID} | jq '.epochNonce.contents')
PoolParams=$(ccli query ledger-state --testnet-magic ${NETWORK_ID} | jq '.stateBefore.esSnapshots.pstakeMark.poolParams')

BASEINFODIR="baseinfo"
[ -d "baseinfo" ] || mkdir ${BASEINFODIR}
echo "{\"Epoch0Nonce\": ${Epoch0Nonce}, \"poolParams\": ${PoolParams}}" > "$BASEINFODIR/info.json"

echo "Epoch0Nonce: ${Epoch0Nonce}"
echo "Prepared genesis, you can start the cluster now"
