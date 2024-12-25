# Controller
The Controller service is responsible for managing the lifecycle of the local blockchain. It encapsulates all the features of the Cardano tools and forwards requests from the UI service to the relevant Cardano tool, but only when the blockchain is active.
## Installation
1. Navigate to the directory where the Personal Blockchain project is located:
```bash
cd /path/to/persional-blockchain-project/src/controller
```
2. Install dependency
```bash
go mod tidy
```
3. Run service
```bash
go run cmd/main.go server || make run
```

## API documentation
The Controller service exposes the following APIs:

### POST /workspace
This API creates a new blockchain network workspace with custom configurations.

#### Request Body:
- `epochLength`: The number of slots in one epoch.
- `slotLength`: The duration of one slot.
- `txSize`: The maximum size (in bytes) of each transaction.

#### Example Request:
```bash
curl -X POST http://localhost:3000/workspace \
     -d '{"epochLength": <epochLength>, "slotLength": <slotLength>, "txSize": <txSize>}' \
     -H "Content-Type: application/json"
```

#### Notice: If there is an active workspace, this API will create a new workspace and wipe clean all data from the previous workspace.

### POST /top-up
This API tops up lovelaces to a given address.

#### Request Body:
- `address`: The address to which lovelaces will be added.
- `amount`: The number of lovelaces to add.

#### Example Request:
```bash
curl -X POST http://localhost:3000/top-up \
     -d '{"address": "<address>", "amount": <amount>}' \
     -H "Content-Type: application/json"
```

### /blockfrost/*
This API exposes Blockfrost APIs, where the `*` represents the specific endpoint path for Blockfrost APIs. For more details on Blockfrost APIs paths, refer to the [Blockfrost API documentation](https://docs.blockfrost.io/).

#### Notice: This APIs will only work if a blockchain network is currently active.

### /wallet/*
This API exposes Cardano Foundation wallet APIs, where the `*` represents the specific endpoint path for Cardano Foundation wallet APIs. For more details on Cardano Foundation wallet APIs paths, refer to the [Cardano Foundation Wallet API documentation](https://cardano-foundation.github.io/cardano-wallet/api/edge/).

#### Notice: This APIs will only work if a blockchain network is currently active.