# Build stage
FROM rust:1.92-alpine AS builder

RUN apk add --no-cache musl-dev pkgconfig openssl-dev openssl-libs-static

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock* ./

# Create dummy main to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy source code
COPY src ./src
COPY .env ./.env

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM alpine:3.21

RUN apk add --no-cache ca-certificates libgcc

WORKDIR /app

COPY --from=builder /app/target/release/doc-proxy .

EXPOSE 3000

CMD ["./doc-proxy"]
