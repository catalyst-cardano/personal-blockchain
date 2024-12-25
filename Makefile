run-cluster:
	docker compose up -d

stop-cluster:
	docker compose down

run-cluster-manual:
	./src/controller/script/run-docker.sh $(EPOCHLENGTH) $(SLOTLENGTH) $(MAXTXSIZE)

stop-cluster-manual:
	cd src/controller/script && docker compose down
