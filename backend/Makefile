.PHONY: build test

build:
	mkdir -p bin
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/galleon-backend .

test:
	go test -v ./...
