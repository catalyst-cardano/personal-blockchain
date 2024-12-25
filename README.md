<p align="center">
  <big><strong>Personal Blockchain</strong></big>
</p>

<hr/>

## Overview
A powerful tool tailored for Cardano developers to efficiently set up and oversee their individual Cardano environments throughout the entire development cycle, enabling seamless development, deployment, and testing of dApps.

High-level design system architecture: [link](https://github.com/catalyst-cardano/personal-blockchain/blob/main/doc/High_level_design_system_architecture.pdf)
## Quickstart
To run a local blockchain on your machine, follow these steps:

### 1. Install and Run the Controller Service

As described in the High-Level Design (HLD) documentation, we expose the services of the local blockchain network through the Controller Service. This service is responsible for managing the lifecycle of the local blockchain network you create. For more details, please refer to the Controller Service documentation: [link](https://github.com/catalyst-cardano/personal-blockchain/blob/main/doc/High_level_design_system_architecture.pdf).

#### Setting up via Docker
You can use Docker to download the Controller service image. For example, to pull the image, use the following command:

```bash
docker pull <controller-service-image>
docker run <controller-service-image>
```
To stop the service:
```bash
docker stop <container-id>
docker remove <container-id>
```

Alternatively, you can use the Docker Compose configuration defined in our project. To do this, follow these steps:

1. Navigate to the directory where the Personal Blockchain project is located:
```bash
cd /path/to/persional-blockchain-project
```
2. Run the Controller service using Docker Compose with the following command:
```bash
docker compose up -d
```
3. Stop service:
```bash
docker compose stop
```

#### Manual Setup
You can also run the Controller service manually by following the guide at the [link](https://github.com/catalyst-cardano/personal-blockchain/blob/main/src/controller/README.md).

### 2. Running blockchain cluster with Custom Configuration
Currently, we allow customization of certain configurations for the local blockchain network. These configurations include:

- **Epoch Size**: The number of slots in one epoch.
- **Slot Length**: The duration of one slot.
- **Tx Size**: The maximum number of bytes per transaction.

You can initialize a blockchain cluster network using the following methods:

#### Direct API Call to the Controller Service

You can initialize a blockchain cluster by making an API call to the Controller service:
```bash
curl -X POST http://localhost:3000/workspace \
     -d '{"epochLength": <epochSize>, "slotLength": <slotLength>, "txSize": <txSize>}' \
     -H "Content-Type: application/json"
```

#### UI-based Network Creation
To create a local blockchain network through the UI, first, follow the instructions to set up the UI service at [link](https://github.com/catalyst-cardano/personal-blockchain/blob/main/src/ui/README.md).

Once the UI service is running, you can create the local blockchain network through the following screen:
![UI Screenshot]()