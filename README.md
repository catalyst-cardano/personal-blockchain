# personal-blockchain
a powerful tool tailored for Cardano developers to efficiently set up and oversee their individual Cardano environments throughout the entire development cycle, enabling seamless development, deployment, and testing of dApps

## Run Cluster:
```sh
make run-cluster
```
## Stop Cluster:
```sh
make stop-cluster
```
### Seed devnet:
```sh
cd chains && ./seed-devnet.sh address1 address2 ... addressn amount

Example: cd chains && ./seed-devnet.sh addr_test1qpk6nfguu8y6sh8c66dr5ey42zx6jmvt6s0fwam6jc9uxjgej45defy7zhtkprzjte6r7fu0y97xczydcxve9qrzxslsnzc8tu seed-addr_test1qpk6nfguu8y6sh8c66dr5ey42zx6jmvt6s0fwam6jc9uxjgej45defy7zhtkprzjte6r7fu0y97xczydcxve9qrzxslsnzc8tu 30000000
```
