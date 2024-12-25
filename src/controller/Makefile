GO_CMD_MAIN = cmd/*.go
TARGET=build
TARGET_BIN=bin

$(GO_TOOLS):
	GOSUMDB=off go get -u $@

run:
	go run $(GO_CMD_MAIN) server

build:
	go build -o $(TARGET)/$(TARGET_BIN) $(GO_CMD_MAIN)
