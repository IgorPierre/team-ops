# syntax=docker/dockerfile:1
FROM golang:1.23-alpine AS build
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY apps/api/go.mod apps/api/go.sum ./apps/api/
RUN --mount=type=cache,target=/go/pkg/mod cd apps/api && go mod download
COPY apps/api ./apps/api
COPY db ./db
WORKDIR /src/apps/api
RUN CGO_ENABLED=0 go build -o /out/server ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=build /out/server /app/server
COPY db/migrations /migrations
ENV MIGRATIONS_DIR=/migrations
ENV HTTP_ADDR=:8080
EXPOSE 8080
USER nobody
ENTRYPOINT ["/app/server"]
