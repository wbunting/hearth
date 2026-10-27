FROM rust:1.99.1-slim-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY crates ./crates
COPY examples ./examples
COPY demos ./demos
COPY benchmarks ./benchmarks
COPY docs ./docs
COPY site ./site
COPY README.md LICENSE NOTICE ./
RUN cargo build --locked --release -p hearth-site -p hearth-cli \
 && ./target/release/hearth asset bundle --release -p hearth-site

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 10001 --create-home hearth
WORKDIR /app
COPY --from=build --chown=hearth:hearth /src/target/release/hearth-site /app/hearth-demo
COPY --from=build --chown=hearth:hearth /src/target/release/assets /app/assets
USER hearth
ENV HOST=0.0.0.0 PORT=8080 HEARTH_SITE_SECURE=1
EXPOSE 8080
CMD ["/app/hearth-demo"]
