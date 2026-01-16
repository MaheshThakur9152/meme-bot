import EventEmitter from 'events';

/**
 * VolumeVelocityManager
 * - When a new pair is discovered (DexScreener emits 'newpair'), start a short window (default 5m)
 * - Aggregate on-chain trades (Helius emits 'trade' events) for that symbol
 * - If within the window we see >= thresholdVolume USD and >= thresholdUniqueBuyers, emit a 'validated' event
 */

type NewPair = { id: string; symbol: string; source: string; text: string; raw?: any; createdAt: number };

export class VolumeVelocityManager extends EventEmitter {
  windowMs: number;
  thresholdVolume: number;
  thresholdUniqueBuyers: number;
  trackers: Map<string, any> = new Map();

  constructor(opts?: { windowMs?: number; thresholdVolume?: number; thresholdUniqueBuyers?: number }) {
    super();
    const { VVM_WINDOW_MS, VVM_THRESHOLD_VOLUME, VVM_THRESHOLD_BUYERS } = require('./config');
    this.windowMs = opts?.windowMs ?? Number(VVM_WINDOW_MS) || 5 * 60 * 1000; // 5 minutes
    this.thresholdVolume = opts?.thresholdVolume ?? Number(VVM_THRESHOLD_VOLUME) || 5000; // $5k
    this.thresholdUniqueBuyers = opts?.thresholdUniqueBuyers ?? Number(VVM_THRESHOLD_BUYERS) || 20;
  }

  onNewPair(p: NewPair) {
    const key = p.symbol;
    if (this.trackers.has(key)) return; // already tracking
    const start = Date.now();
    const tracker = { symbol: key, start, end: start + this.windowMs, totalVolume: 0, buyers: new Set(), events: [] };
    this.trackers.set(key, tracker);

    // schedule evaluation
    setTimeout(() => this.evaluate(key), this.windowMs);
  }

  onTrade(t: { symbol: string; buyer: string; amountUsd: number; txId: string; createdAt: number }) {
    const key = t.symbol;
    const tracker = this.trackers.get(key);
    if (!tracker) return; // not tracking this symbol
    // Only include trades in the window
    if (t.createdAt < tracker.start || t.createdAt > tracker.end) return;
    tracker.totalVolume += t.amountUsd;
    tracker.buyers.add(t.buyer);
    tracker.events.push(t);

    // quick evaluation: if already passed thresholds, emit early
    if (tracker.totalVolume >= this.thresholdVolume && tracker.buyers.size >= this.thresholdUniqueBuyers) {
      this.emitValidated(tracker);
      this.trackers.delete(key);
    }
  }

  evaluate(key: string) {
    const tracker = this.trackers.get(key);
    if (!tracker) return;
    if (tracker.totalVolume >= this.thresholdVolume && tracker.buyers.size >= this.thresholdUniqueBuyers) {
      this.emitValidated(tracker);
    }
    // otherwise no-op
    this.trackers.delete(key);
  }

  emitValidated(tracker: any) {
    const payload = { symbol: tracker.symbol, totalVolume: tracker.totalVolume, uniqueBuyers: tracker.buyers.size, events: tracker.events, start: tracker.start, end: tracker.end };
    this.emit('validated', payload);
  }
}
