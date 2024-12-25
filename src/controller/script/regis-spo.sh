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

HOST_SPO_DIR=$SCRIPT_DIR$DEVNET_DIR$SPO_DIR
HOST_COLDKEY_DIR=$HOST_SPO_DIR$COLDKEY_DIR
DOCKER_SPO_DIR=$DEVNET_DIR$SPO_DIR
DOCKER_COLDKEY_DIR=$DOCKER_SPO_DIR$COLDKEY_DIR


mkdir -p "$HOST_COLDKEY_DIR"
# mkdir -p "$DOCKER_COLDKEY_DIR"


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
# Generating Keys for the Block-producing Node
# https://www.coincashew.com/coins/overview-ada/guide-how-to-build-a-haskell-stakepool-node/part-iii-operation/generating-keys-for-the-block-producing-node

ccli_ node key-gen-KES \
    --verification-key-file $DOCKER_COLDKEY_DIR/kes.vkey \
    --signing-key-file $DOCKER_COLDKEY_DIR/kes.skey

ccli_ node key-gen \
    --cold-verification-key-file $DOCKER_COLDKEY_DIR/node.vkey \
    --cold-signing-key-file $DOCKER_COLDKEY_DIR/node.skey \
    --operational-certificate-issue-counter $DOCKER_COLDKEY_DIR/node.counter

slotsPerKESPeriod=$(cat $SCRIPT_DIR$DEVNET_DIR/genesis-shelley.json | jq -r '.slotsPerKESPeriod')
echo slotsPerKESPeriod: ${slotsPerKESPeriod}

slotNo=$(ccli query tip | jq -r '.slot')
echo slotNo: ${slotNo}

kesPeriod=$((${slotNo} / ${slotsPerKESPeriod}))
echo kesPeriod: ${kesPeriod}
startKesPeriod=${kesPeriod}
echo startKesPeriod: ${startKesPeriod}

ccli_ node issue-op-cert \
    --kes-verification-key-file $DOCKER_COLDKEY_DIR/kes.vkey \
    --cold-signing-key-file $DOCKER_COLDKEY_DIR/node.skey \
    --operational-certificate-issue-counter $DOCKER_COLDKEY_DIR/node.counter \
    --kes-period ${startKesPeriod} \
    --out-file $DOCKER_COLDKEY_DIR/node.cert

ccli_ node key-gen-VRF \
    --verification-key-file $DOCKER_COLDKEY_DIR/vrf.vkey \
    --signing-key-file $DOCKER_COLDKEY_DIR/vrf.skey

${SUDO} chmod 400 $HOST_COLDKEY_DIR/vrf.skey


##########################
# Setting Up Payment and Stake Keys
# https://www.coincashew.com/coins/overview-ada/guide-how-to-build-a-haskell-stakepool-node/part-iii-operation/setting-up-payment-and-stake-keys

ccli query protocol-parameters \
    --out-file $DOCKER_SPO_DIR/params.json


ccli_ address key-gen \
    --verification-key-file $DOCKER_COLDKEY_DIR/payment.vkey \
    --signing-key-file $DOCKER_COLDKEY_DIR/payment.skey

ccli_ stake-address key-gen \
    --verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --signing-key-file $DOCKER_COLDKEY_DIR/stake.skey

ccli stake-address build \
    --stake-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --out-file $DOCKER_COLDKEY_DIR/stake.addr

ccli address build \
    --payment-verification-key-file $DOCKER_COLDKEY_DIR/payment.vkey \
    --stake-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --out-file $DOCKER_COLDKEY_DIR/payment.addr

paymentAddress=$(${SUDO} cat $HOST_COLDKEY_DIR/payment.addr)

#fund for this account
. seed-devnet.sh $paymentAddress $FUND_AMOUNT

ccli query utxo \
    --address $paymentAddress

##########################
# Registering Your Stake Address
# https://www.coincashew.com/coins/overview-ada/guide-how-to-build-a-haskell-stakepool-node/part-iii-operation/registering-your-stake-address

ccli_ stake-address registration-certificate \
    --stake-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --out-file $DOCKER_COLDKEY_DIR/stake.cert

currentSlot=$(ccli query tip | jq -r '.slot')
echo slotNo: ${currentSlot}


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


stakeAddressDeposit=$(${SUDO} cat $HOST_SPO_DIR/params.json | jq -r '.stakeAddressDeposit')
echo stakeAddressDeposit : $stakeAddressDeposit

ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+0 \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee 0 \
    --out-file $DOCKER_COLDKEY_DIR/tx.tmp \
    --certificate $DOCKER_COLDKEY_DIR/stake.cert

fee=$(ccli transaction calculate-min-fee \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.tmp \
    --tx-in-count ${txcnt} \
    --tx-out-count 1 \
    --witness-count 2 \
    --byron-witness-count 0 \
    --protocol-params-file $DOCKER_SPO_DIR/params.json | awk '{ print $1 }')
echo fee: $fee

txOut=$((${total_balance}-${stakeAddressDeposit}-${fee}))
echo Change Output: ${txOut}

ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+${txOut} \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee ${fee} \
    --certificate-file $DOCKER_COLDKEY_DIR/stake.cert \
    --out-file $DOCKER_COLDKEY_DIR/tx.raw

ccli transaction sign \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.raw \
    --signing-key-file $DOCKER_COLDKEY_DIR/payment.skey \
    --signing-key-file $DOCKER_COLDKEY_DIR/stake.skey \
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

##########################
# Registering Your Stake Pool
# https://www.coincashew.com/coins/overview-ada/guide-how-to-build-a-haskell-stakepool-node/part-iii-operation/registering-your-stake-pool

${SUDO} cat > $HOST_SPO_DIR/md.json << EOF
{
"name": "MyPoolName",
"description": "My pool description",
"ticker": "MPN",
"homepage": "https://myadapoolnamerocks.com"
}
EOF

ccli_ stake-pool metadata-hash --pool-metadata-file $DOCKER_SPO_DIR/md.json > $HOST_SPO_DIR/poolMetaDataHash.txt

minPoolCost=$(${SUDO} cat $HOST_SPO_DIR/params.json | jq -r .minPoolCost)
echo minPoolCost: ${minPoolCost}

poolMetaDataHash=$(${SUDO} cat $HOST_SPO_DIR/poolMetaDataHash.txt)

ccli stake-pool registration-certificate \
    --cold-verification-key-file $DOCKER_COLDKEY_DIR/node.vkey \
    --vrf-verification-key-file $DOCKER_COLDKEY_DIR/vrf.vkey \
    --pool-pledge 100000000 \
    --pool-cost 345000000 \
    --pool-margin 0.15 \
    --pool-reward-account-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --pool-owner-stake-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --single-host-pool-relay relaynode1.myadapoolnamerocks.com \
    --pool-relay-port 6000 \
    --metadata-url https://myadapoolnamerocks.com \
    --metadata-hash $poolMetaDataHash \
    --out-file $DOCKER_COLDKEY_DIR/pool.cert

ccli_ stake-address delegation-certificate \
    --stake-verification-key-file $DOCKER_COLDKEY_DIR/stake.vkey \
    --cold-verification-key-file $DOCKER_COLDKEY_DIR/node.vkey \
    --out-file $DOCKER_COLDKEY_DIR/deleg.cert

currentSlot=$(ccli query tip | jq -r '.slot')
echo Current Slot: $currentSlot


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

stakePoolDeposit=$(${SUDO} cat $HOST_SPO_DIR/params.json | jq -r '.stakePoolDeposit')
echo stakePoolDeposit: $stakePoolDeposit

ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+$(( ${total_balance} - ${stakePoolDeposit}))  \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee 0 \
    --certificate-file $DOCKER_COLDKEY_DIR/pool.cert \
    --certificate-file $DOCKER_COLDKEY_DIR/deleg.cert \
    --out-file $DOCKER_COLDKEY_DIR/tx.tmp

fee=$(ccli transaction calculate-min-fee \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.tmp \
    --tx-in-count ${txcnt} \
    --tx-out-count 1 \
    --witness-count 3 \
    --byron-witness-count 0 \
    --protocol-params-file $DOCKER_SPO_DIR/params.json | awk '{ print $1 }')
echo fee: $fee

txOut=$((${total_balance}-${stakePoolDeposit}-${fee}))
echo txOut: ${txOut}

ccli_ transaction build-raw \
    ${tx_in} \
    --tx-out $paymentAddress+${txOut} \
    --invalid-hereafter $(( ${currentSlot} + 10000)) \
    --fee ${fee} \
    --certificate-file $DOCKER_COLDKEY_DIR/pool.cert \
    --certificate-file $DOCKER_COLDKEY_DIR/deleg.cert \
    --out-file $DOCKER_COLDKEY_DIR/tx.raw

ccli transaction sign \
    --tx-body-file $DOCKER_COLDKEY_DIR/tx.raw \
    --signing-key-file $DOCKER_COLDKEY_DIR/payment.skey \
    --signing-key-file $DOCKER_COLDKEY_DIR/node.skey \
    --signing-key-file $DOCKER_COLDKEY_DIR/stake.skey \
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

