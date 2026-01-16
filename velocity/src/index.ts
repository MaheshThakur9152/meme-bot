import { ScraperArray, Signal } from './scraper';
import { checkHype } from './ai';
import { buildAndSimulate, signAndSend } from './solana';
import { config } from './config';
import { bus } from './bus';
import { getStats } from './paper';

function nowMs() { return Date.now(); }

async function handleSignal(signal: Signal) {
  const start = nowMs();
  console.log(`\n[DETECT] ${signal.id} from ${signal.source} -> "${signal.text}"`);
  try { bus.emit('signal', signal); } catch(e){}

  const symbol = signal.symbol || extractSymbol(signal.text);
  const pathA = buildAndSimulate(symbol);
  const pathB = checkHype(signal.text);

  const [aRes, bRes] = await Promise.all([pathA, pathB]);

  console.log(`[METRIC] PathA latency: ${aRes.latencyMs}ms, PathB latency: ${bRes.latencyMs}ms, hype=${bRes.score}`);

  const quickDecision = bRes.score >= config.HYPE_THRESHOLD && aRes.ok;
  if (!quickDecision) { console.log('[DECIDE] No-op — either not hype or tx invalid'); return; }

  console.log('[TRIGGER] Conditions met — signing & sending');
  const sendRes = await signAndSend(aRes.prep!, { symbol, qty: aRes?.details?.quote?.outAmount ?? 1, price: aRes?.details?.quote?.price ?? 0 });
  if (sendRes.ok) {
    console.log(`[SENT] txSig=${sendRes.txSig} sent in ${sendRes.latencyMs}ms`);
    try {
      bus.emit('trade', { symbol, ...(sendRes.paperTrade ?? { id: sendRes.txSig }), time: Date.now(), details: sendRes });
      const stats = getStats();
      bus.emit('stats', stats);
      console.log('[STATS]', stats);
      if (config.AUTO_SWITCH && !config.SEND_ENABLED) {
        if (stats.winRate >= config.PAPER_TO_LIVE_WINRATE && stats.totalTrades >= config.PAPER_TO_LIVE_MIN_TRADES) {
          console.log('[AUTO-SWITCH] threshold reached — enabling SEND_ENABLED=true');
          (config as any).SEND_ENABLED = true;
          bus.emit('mode', { mode: 'live' });
        }
      }
    } catch(e){}
  } else console.log(`[FAILED SEND] ${sendRes.error} (${sendRes.latencyMs}ms)`);

  console.log(`[END] Total from detect to (attempted) send: ${nowMs() - start}ms`);
}

function extractSymbol(text: string): string {
  const m = text.match(/\$?([A-Z]{2,5})/);
  return m ? m[1] : 'UNKNOWN';
}

async function main() {
  console.log('Velocity prototype starting — target <1s flow (simulated)');
  // Select source adapters in order: DexScreener, Telegram, OnChain, Simulator fallback
  let scraper: any;
  // Start adapters: DexScreener (discovery) + Helius (on-chain feed) + simulator fallback
  let dexscreener: any = null;
  try {
    if (process.env.USE_DEXSCREENER === 'true') { const { DexScreenerAdapter } = await import('./dexscreener'); dexscreener = new DexScreenerAdapter(); await dexscreener.start(); }
  } catch (err) { console.error('failed to start DexScreener adapter', err); }

  let helius: any = null;
  try {
    if (process.env.USE_ONCHAIN === 'true') { const { HeliusAdapter } = await import('./helius'); helius = new HeliusAdapter(); await helius.start(); }
  } catch (err) { console.error('failed to start Helius adapter', err); }

  // Wire volume velocity manager
  const { VolumeVelocityManager } = await import('./volumeVelocity');
  const vvm = new VolumeVelocityManager();

  if (dexscreener) {
    dexscreener.on('newpair', (p:any) => {
      console.log('[DISCOVERY] newpair', p.symbol);
      vvm.onNewPair(p);
      try { bus.emit('signal', p); } catch(e){}
    });
  }

  if (helius) {
    helius.on('trade', (t:any) => {
      vvm.onTrade(t);
    });
  }

  // When VVM validates, run the normal flow (safety check then trade preparation)
  vvm.on('validated', async (payload:any) => {
    console.log('[VALIDATED] ', payload);
    // safety check
    const { simpleRugCheck } = await import('./safety');
    const ok = await simpleRugCheck(payload.symbol);
    if (!ok.ok) { console.log('[SAFETY] failed rug check:', ok.reason); return; }

    // Build a signal-like object and handle
    const signal = { id: `validated-${payload.symbol}-${Date.now()}`, source: 'volume-velocity', text: `Validated ${payload.symbol} with $${payload.totalVolume} across ${payload.uniqueBuyers} wallets`, symbol: payload.symbol, createdAt: Date.now() };
    try { bus.emit('signal', signal); } catch(e){}
    handleSignal(signal).catch(e => console.error('handleSignal error', e));
  });

  // If no adapters available, fallback to simulator
  if (!dexscreener && !helius) {
    const scraper = new ScraperArray();
    scraper.on('signal', (s: Signal) => { handleSignal(s).catch((e) => console.error('handleSignal error', e)); });
    scraper.start();
  }

  // If dexscreener or helius are present, keep a light-weight listener so UI receives discovery signals
  if (dexscreener && !helius) {
    // also fallback: attach no-op
  }

  // If helius exists but we still want simulator bursts for testing, keep the scraper but do not bind by default
  // const scraper = new ScraperArray(); scraper.start();
}

main().catch((e) => console.error(e));
