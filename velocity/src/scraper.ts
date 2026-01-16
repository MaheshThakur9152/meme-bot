import { EventEmitter } from 'events';
import { config } from './config';

export type Signal = { id: string; source: string; text: string; symbol?: string; createdAt: number };

/**
 * ScraperArray - rotates multiple accounts (A,B,C) and emits "signal" quickly (simulator).
 * Swap in real adapters (DexScreener/Telegram/Helius) to use live data.
 */
export class ScraperArray extends EventEmitter {
  accounts: string[];
  intervalMs: number;
  timer: NodeJS.Timer | null = null;
  counter = 0;

  constructor(accounts: string[] = config.ACCOUNTS, intervalMs = config.POLL_INTERVAL_MS) {
    super();
    this.accounts = accounts;
    this.intervalMs = intervalMs;
  }

  start() {
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    this.counter++;
    const account = this.accounts[this.counter % this.accounts.length];
    const isSignal = Math.random() < 0.25; // 25% chance
    const symbol = ['DOGE', 'SOL', 'BTC', 'ETH'][Math.floor(Math.random() * 4)];
    const text = isSignal ? `${symbol} is going to moon! 🚀` : `random chatter about ${symbol}`;
    const signal: Signal = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source: account,
      text,
      symbol: isSignal ? symbol : undefined,
      createdAt: Date.now(),
    };
    // Emit 'signal' for consumers
    this.emit('signal', signal);
  }
}
