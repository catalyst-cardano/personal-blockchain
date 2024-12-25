FROM golang:1.22.4 as builder
WORKDIR /controller

COPY go.mod go.sum ./
RUN GOSUMDB=off go mod download

COPY ./ ./
RUN make build

# Use the official Docker-in-Docker image as a base
FROM docker:dind

RUN apk update && apk add --no-cache \
    curl \
    tar \
    bash \
    busybox-extras \
    jq \
    libc6-compat

WORKDIR /controller

COPY ./script /controller/script/

COPY start.sh /controller/start.sh

COPY --from=builder /controller/ /controller/

# Make the script executable
RUN chmod +x /controller/start.sh

EXPOSE 8888
ENTRYPOINT ["bash" , "/controller/start.sh"]