import EventEmitter from 'events';

/**
 * DexScreener adapter skeleton
 * Polls DexScreener API for trending tokens or searches and emits { signal }
 * Config: USE_DEXSCREENER=true, DEXSCREENER_POLL_MS
 */
export class DexScreenerAdapter extends EventEmitter {
  pollMs: number;
  timer: any = null;

  constructor(pollMs = Number(process.env.DEXSCREENER_POLL_MS || 2000)) {
    super();
    this.pollMs = pollMs;
  }

  start() {
    this.timer = setInterval(() => this.tick(), this.pollMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick() {
    try {
      // Simple demo: poll a dexscreener search endpoint for trending tokens
      // Example: https://api.dexscreener.com/latest/dex/search?q=BTC
      const q = 'crypto';
      const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // Data parsing depends on API; emit top results as signals
      const results = data?.pairs || data?.tokens || [];
      for (const r of (results.slice ? results.slice(0, 3) : [])) {
        const symbol = r?.token?.symbol || r?.symbol || r?.pair || 'UNKNOWN';
        const text = `DexScreener NEW PAIR: ${symbol}`;
        const newpair = { id: `${Date.now()}-${Math.floor(Math.random()*10000)}`, source: 'dexscreener', text, symbol, createdAt: Date.now(), raw: r };
        this.emit('newpair', newpair);
      }
    } catch (err) {
      // ignore errors but log in prod
      // console.warn('dex tick error', err);
    }
  }
}
