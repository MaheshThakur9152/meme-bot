# Velocity — The Sentiment Sniper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh/)

A high-velocity sentiment trading prototype built with Bun and TypeScript. This system demonstrates an optimistic, parallel architecture for sentiment-based trading on Solana, featuring scraper rotation, AI-powered signal validation, and rapid transaction execution.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Data Sources](#data-sources)
- [Volume Velocity Strategy](#volume-velocity-strategy)
- [Dashboard](#dashboard)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Features

- **High-Velocity Architecture**: Parallel execution of AI analysis and transaction building for sub-200ms response times
- **Scraper Rotation**: Automated rotation of scraper accounts to avoid rate limits and bans
- **AI-Powered Validation**: Integration with Groq API for sentiment analysis with fast heuristic fallback
- **Optimistic Transactions**: Build and simulate transactions in parallel with signal processing
- **Volume Velocity Strategy**: On-chain validation using real trading volume and unique buyers
- **Paper Trading Mode**: Safe testing with paper trades before going live
- **Real-time Dashboard**: WebSocket-based UI for monitoring trades and signals
- **Modular Design**: Easy integration with various DEXes (Jupiter, Raydium) and data sources
- **Safety Checks**: Built-in rug pull detection and liquidity validation

## Architecture

The system follows a parallel, optimistic execution model:

1. **Signal Ingestion**: Rotate scraper accounts to collect sentiment signals from social media
2. **Parallel Processing**:
   - Path A: Build and simulate transactions optimistically
   - Path B: Run AI sentiment analysis
3. **Validation**: Combine AI scores with on-chain volume velocity checks
4. **Execution**: Trigger fast sends when all conditions are met

```
Signal → [Scraper Rotation] → [Parallel: AI + Tx Build] → [Validation] → [Execution]
```

## Installation

### Prerequisites

- [Bun](https://bun.sh/) (latest version recommended)
- Node.js 18+ (if not using Bun)
- A Solana RPC endpoint (Helius, QuickNode, or devnet)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd velocity
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables (see [Configuration](#configuration))

## Configuration

Create a `.env` file with the following variables:

### Required
- `RPC_URL`: Your Solana RPC endpoint (e.g., Helius or QuickNode URL)

### Optional
- `GROQ_API_KEY`: API key for Groq AI (falls back to heuristic if not provided)
- `SEND_ENABLED`: Set to `true` to enable live trading (default: `false`)
- `PAYER_PRIVATE_KEY_BASE58`: Base58-encoded private key for live trading
- `AUTO_SWITCH`: Enable automatic switching to live mode based on win rate (default: `false`)
- `PAPER_TO_LIVE_WINRATE`: Win rate threshold for auto-switch (default: 0.8)
- `PAPER_TO_LIVE_MIN_TRADES`: Minimum trades before considering auto-switch (default: 50)

### Data Source Configuration
- `USE_DEXSCREENER`: Enable DexScreener integration (default: `false`)
- `DEXSCREENER_POLL_MS`: Polling interval for DexScreener (default: 5000)
- `USE_ONCHAIN`: Enable on-chain data via Helius/QuickNode (default: `false`)

### Volume Velocity Thresholds
- `VVM_WINDOW_MS`: Validation window in milliseconds (default: 300000 = 5 minutes)
- `VVM_THRESHOLD_VOLUME`: Minimum USD volume for validation (default: 5000)
- `VVM_THRESHOLD_BUYERS`: Minimum unique buyers for validation (default: 20)

## Usage

### Quick Demo
Run a simulated trading demo:
```bash
bun run demo
```

### Start the Trading Worker
```bash
bun run start
```

### Start with Dashboard
```bash
bun run start:server
```
Then open http://localhost:8080 in your browser.

### Development Mode
```bash
bun run dev
```

## Data Sources

### DexScreener Integration
Monitor new trading pairs and market data:
- Set `USE_DEXSCREENER=true`
- Configure polling interval with `DEXSCREENER_POLL_MS`

### On-Chain Data (Helius/QuickNode)
Real-time blockchain analysis:
- Set `USE_ONCHAIN=true`
- Provide `RPC_URL` for your endpoint

### Social Media Scraping
Built-in scraper rotation for Twitter and Telegram signals.

## Volume Velocity Strategy

The Volume Velocity Manager validates trading opportunities using on-chain data:

1. **Discovery**: New pairs detected via DexScreener
2. **Aggregation**: Collect buy volume and unique buyers over a time window
3. **Validation**: Check against configurable thresholds
4. **Safety**: Perform liquidity and age checks

This approach prioritizes real money movement over social sentiment alone.

## Dashboard

The web dashboard provides real-time monitoring:

- Live tweet feed
- Paper trade history
- Performance metrics
- Runtime controls for auto-switch and mode toggling

Access at http://localhost:8080 after running `bun run start:server`.

## API

### WebSocket Events

The server emits real-time events via WebSocket:

- `tweet`: New sentiment signal
- `trade`: Paper or live trade execution
- `status`: System status updates

### HTTP Endpoints

- `GET /`: Dashboard HTML
- `GET /ws`: WebSocket upgrade endpoint

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the demo: `bun run demo`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for public APIs
- Test changes with paper trading mode first
- Update documentation for significant changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This is a prototype for educational and research purposes. Trading cryptocurrencies involves significant risk. Always test thoroughly and never risk more than you can afford to lose. The authors are not responsible for any financial losses incurred through the use of this software.
