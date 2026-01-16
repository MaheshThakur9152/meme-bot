# Simple Dockerfile for running the prototype (expects bun installed in image)
FROM oven/bun:latest
WORKDIR /app
COPY . /app
RUN bun install
CMD ["bun", "run", "src/index.ts"]
