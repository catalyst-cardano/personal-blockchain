#!/usr/bin/env bash

SCRIPT_DIR=$(realpath $(dirname $(realpath $0)))
NETWORK_ID=42

FUND_AMOUNT=30000001

DEVNET_DIR=/devnet
SPO_DIR=/spos

if [ "$#" -eq 0 ]; then
  # Set default values
  name="alice"
else
  name="${!#}"
fi


COLDKEY_DIR="/${name}"

HOST_DEVNET_DIR=$SCRIPT_DIR$DEVNET_DIR
HOST_SPO_DIR=$HOST_DEVNET_DIR$SPO_DIR
HOST_COLDKEY_DIR=$HOST_SPO_DIR$COLDKEY_DIR
DOCKER_SPO_DIR=$DEVNET_DIR$SPO_DIR
DOCKER_COLDKEY_DIR=$DOCKER_SPO_DIR$COLDKEY_DIR

if [ ! -d "$HOST_COLDKEY_DIR" ]; then
    # Directory does not exist, exit with an error message
    echo "Error: Directory $HOST_COLDKEY_DIR does not exist. Exiting."
    exit 1
fi

##########################
# Helper funcs
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

# Invoke cardano-cli in running cardano-node container or via provided cardano-cli
function ccli() {
  ccli_ ${@} --testnet-magic ${NETWORK_ID}
}
function ccli_() {
  ${DOCKER_COMPOSE_CMD} exec cardano-node cardano-cli ${@}
}

##########################
# Retiring Your Stake Pool
# https://www.coincashew.com/coins/overview-ada/guide-how-to-build-a-haskell-stakepool-node/part-iv-administration/retiring-your-stake-pool

ccli query protocol-parameters \
    --out-file $DOCKER_SPO_DIR/params.json

startTimeGenesis=$(cat $HOST_DEVNET_DIR/genesis-shelley.json | jq -r .systemStart)
startTimeSec=$(date --date=${startTimeGenesis} +%s)
currentTimeSec=$(date -u +%s)
epochLength=$(cat $HOST_DEVNET_DIR/genesis-shelley.json | jq -r .epochLength)
epoch=$(( (${currentTimeSec}-${startTimeSec}) / ${epochLength} ))
echo current epoch: ${epoch}

poolRetireMaxEpoch=$(${SUDO} cat $HOST_SPO_DIR/params.json | jq -r '.poolRetireMaxEpoch')
echo poolRetireMaxEpoch: ${poolRetireMaxEpoch}

minRetirementEpoch=$(( ${epoch} + 1 ))
maxRetirementEpoch=$(( ${epoch} + ${poolRetireMaxEpoch} ))

echo earliest epoch for retirement is: ${minRetirementEpoch}
echo latest epoch for retirement is: ${maxRetirementEpoch}

retirementEpoch=$minRetirementEpoch

ccli_ stake-pool deregistration-certificate \
    --cold-verification-key-file $DOCKER_COLDKEY_DIR/node.vkey \
    --epoch $retirementEpoch \
    --out-file $DOCKER_COLDKEY_DIR/pool.dereg

paymentAddress=$(${SUDO} cat $HOST_COLDKEY_DIR/payment.addr)

ccli query utxo \
    --address $paymentAddress > $HOST_COLDKEY_DIR/fullUtxo.out

tail -n +3 $HOST_COLDKEY_DIR/fullUtxo.out | sort -k3 -nr > $HOST_COLDKEY_DIR/balance.out

cat $HOST_COLDKEY_DIR/balance.out

tx_in=""
total_balance=0
while read -r utxo; do
    type=$(awk '{ print $6 }' <<< "${utxo}")
    if [[ ${type} == 'TxOutDatumNone' ]]
    then
        in_addr=$(awk '{ print $1 }' <<< "${utxo}")
        idx=$(awk '{ print $2 }' <<< "${utxo}")
        utxo_balance=$(awk '{ print $3 }' <<< "${utxo}")
        total_balance=$((${total_balance}+${utxo_balance}))
        echo TxHash: ${in_addr}#${idx}
        echo ADA: ${utxo_balance}
        tx_in="${tx_in} --tx-in ${in_addr}#${idx}"
    fi
done < $HOST_COLDKEY_DIR/balance.out
txcnt=$(cat $HOST_COLDKEY_DIR/balance.out | wc -l)
echo Total available ADA balance: ${total_balance}
echo Number of UTXOs: ${txcnt}

currentSlot=$(ccli query tip | jq -r '.slot')
echo CurrentSlot: ${currentSlot}


ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+${total_balance} \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee 0 \
    --certificate-file $DOCKER_COLDKEY_DIR/pool.dereg \
    --out-file $DOCKER_COLDKEY_DIR/tx.tmp

fee=$(ccli transaction calculate-min-fee \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.tmp \
    --tx-in-count ${txcnt} \
    --tx-out-count 1 \
    --witness-count 2 \
    --byron-witness-count 0 \
    --protocol-params-file $DOCKER_SPO_DIR/params.json | awk '{ print $1 }')
echo fee: $fee

txOut=$((${total_balance}-${fee}))
echo txOut: ${txOut}

ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+${txOut} \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee ${fee} \
    --certificate-file $DOCKER_COLDKEY_DIR/pool.dereg \
    --out-file $DOCKER_COLDKEY_DIR/tx.raw

ccli transaction sign \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.raw \
    --signing-key-file $DOCKER_COLDKEY_DIR/payment.skey \
    --signing-key-file $DOCKER_COLDKEY_DIR/node.skey \
    --out-file $DOCKER_COLDKEY_DIR/tx.signed

SEED_TXID=$(ccli_ transaction txid --tx-file $DOCKER_COLDKEY_DIR/tx.signed | tr -d '\r')
SEED_TXIN="${SEED_TXID}#0"

ccli transaction submit \
    --tx-file $DOCKER_COLDKEY_DIR/tx.signed 

echo -n >&2 "Waiting for utxo ${SEED_TXIN}.."

while [[ "$(ccli query utxo --tx-in "${SEED_TXIN}" --out-file /dev/stdout | jq ".\"${SEED_TXIN}\"")" = "null" ]]; do
    sleep 1
    echo -n >&2 "."
done