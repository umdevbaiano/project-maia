FROM rust:1.75 as builder
WORKDIR /usr/src/app
COPY . .
# Will build and cache
# RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# COPY --from=builder /usr/src/app/target/release/vetta-shield /usr/local/bin/
# CMD ["vetta-shield"]

# Temporary dummy script since cargo build will fail locally if not prepared
CMD ["tail", "-f", "/dev/null"]
