run-cluster:
	./build/run-docker.sh

stop-cluster:
	cd build && docker-compose down