FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

FROM alpine:3.21
RUN adduser -D -u 1001 appuser
WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/seed ./seed
COPY --from=builder /app/admin-assets ./admin-assets
USER appuser
EXPOSE 8080
ENV ADMIN_ASSETS_DIR=/app/admin-assets
CMD ["./server"]
