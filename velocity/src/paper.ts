import fs from 'fs';
import path from 'path';

export type TradeRecord = { id: string; symbol: string; qty: number; price: number; time: number; side: 'buy'|'sell'; source?: any };
export type Realized = { id: string; symbol: string; qty: number; buyPrice: number; sellPrice: number; profit: number; time: number };

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'paper-trades.jsonl');
let ledger: TradeRecord[] = [];
let realized: Realized[] = [];
const buyQueues: Record<string, Array<{ qty: number; price: number; id: string; time: number }>> = {};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function replayLedger() {
  buyQueues && Object.keys(buyQueues).forEach(k => buyQueues[k] = []);
  realized = [];
  if (!fs.existsSync(FILE)) return;
  const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean);
  ledger = lines.map((l) => JSON.parse(l));
  for (const t of ledger) {
    if (t.side === 'buy') {
      const q = buyQueues[t.symbol] || [];
      q.push({ qty: t.qty, price: t.price, id: t.id, time: t.time });
      buyQueues[t.symbol] = q;
    } else if (t.side === 'sell') {
      // match FIFO
      let remaining = t.qty;
      const q = buyQueues[t.symbol] || [];
      while (remaining > 0 && q.length > 0) {
        const lot = q[0];
        const take = Math.min(remaining, lot.qty);
        const profit = take * (t.price - lot.price);
        realized.push({ id: `${t.id}:${lot.id}`, symbol: t.symbol, qty: take, buyPrice: lot.price, sellPrice: t.price, profit, time: t.time });
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 0) q.shift();
      }
      buyQueues[t.symbol] = q;
    }
  }
}

replayLedger();

export async function executePaperTrade({ symbol, qty = 1, price = 0, side = 'buy', source }: { symbol: string; qty?: number; price?: number; side?: 'buy'|'sell'; source?: any }) {
  ensureDataDir();
  const rec: TradeRecord = { id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, symbol, qty, price, time: Date.now(), side, source };
  ledger.push(rec);
  fs.appendFileSync(FILE, JSON.stringify(rec) + '\n');
  // update in-memory state
  if (side === 'buy') {
    const q = buyQueues[rec.symbol] || [];
    q.push({ qty: rec.qty, price: rec.price, id: rec.id, time: rec.time });
    buyQueues[rec.symbol] = q;
  } else {
    let remaining = rec.qty;
    const q = buyQueues[rec.symbol] || [];
    while (remaining > 0 && q.length > 0) {
      const lot = q[0];
      const take = Math.min(remaining, lot.qty);
      const profit = take * (rec.price - lot.price);
      realized.push({ id: `${rec.id}:${lot.id}`, symbol: rec.symbol, qty: take, buyPrice: lot.price, sellPrice: rec.price, profit, time: rec.time });
      lot.qty -= take;
      remaining -= take;
      if (lot.qty <= 0) q.shift();
    }
    buyQueues[rec.symbol] = q;
  }
  return rec;
}

export function getTrades() {
  return ledger.slice(-1000);
}

export function getStats() {
  const totalTrades = ledger.length;
  const buys = ledger.filter(t => t.side === 'buy').length;
  const sells = ledger.filter(t => t.side === 'sell').length;
  const realizedCount = realized.length;
  const realizedProfit = realized.reduce((s, r) => s + r.profit, 0);
  const wins = realized.filter(r => r.profit > 0).length;
  const winRate = realizedCount === 0 ? 0 : wins / realizedCount;
  const avgProfitPerRealized = realizedCount === 0 ? 0 : realizedProfit / realizedCount;
  return { totalTrades, buys, sells, realizedCount, realizedProfit, winRate, avgProfitPerRealized };
}
