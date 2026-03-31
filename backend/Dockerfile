FROM golang:1.26 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /galleon-backend .


FROM scratch

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /galleon-backend /galleon-backend

EXPOSE 8080

ENV PORT=8080
ENV K8S_NAMESPACE=default

ENTRYPOINT ["/galleon-backend"]
