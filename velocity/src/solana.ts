import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { config } from './config';
import { quoteSwap } from './jupiter';

export type TxPrep = { transaction: Transaction; readyAt: number };

/**
 * Build a simple placeholder transaction for a BUY using Jupiter quote skeleton.
 * Returns quote details in `details.quote` and a prepared (empty) Transaction for simulation.
 */
export async function buildAndSimulate(symbol: string, usdAmount = 10, payerPubKey?: string): Promise<{ ok: boolean; details?: any; prep?: TxPrep; latencyMs: number }> {
  const start = Date.now();
  // get a quote from Jupiter (or simulated)
  const quote = await quoteSwap(symbol, usdAmount);

  // Connect to RPC
  const conn = new Connection(config.RPC_URL, 'confirmed');
  // Build a dummy Transaction placeholder; in production you'd build the real swap instructions
  const tx = new Transaction();

  try {
    await conn.getLatestBlockhash('finalized');
    const latencyMs = Date.now() - start;
    return { ok: true, details: { simulated: true, quote }, prep: { transaction: tx, readyAt: Date.now() }, latencyMs };
  } catch (err) {
    return { ok: false, details: { error: String(err), quote }, latencyMs: Date.now() - start };
  }
}

/**
 * Sign and send a prepared transaction (only if SEND_ENABLED=true and payer private key provided).
 */
export async function signAndSend(prep: TxPrep, meta?: { symbol?: string; qty?: number; price?: number }): Promise<{ ok: boolean; txSig?: string; latencyMs: number; error?: string; paperTrade?: any }> {
  const start = Date.now();
  if (!config.SEND_ENABLED) {
    // Paper trade fallback
    try {
      // Lazy import to avoid circular problems in some envs
      const { executePaperTrade } = await import('./paper');
      const trade = await executePaperTrade({ symbol: meta?.symbol || 'UNKNOWN', qty: meta?.qty || 1, price: meta?.price || 0, source: { meta } });
      return { ok: true, txSig: `paper:${trade.id}`, latencyMs: Date.now() - start, paperTrade: trade };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }
  if (!config.PAYER_PRIVATE_KEY_BASE58) return { ok: false, latencyMs: Date.now() - start, error: 'no payer key' };

  try {
    const payer = Keypair.fromSecretKey(Buffer.from(config.PAYER_PRIVATE_KEY_BASE58, 'base64'));
    prep.transaction.feePayer = payer.publicKey;
    // In real flow you'd add instructions then sign
    prep.transaction.sign(payer);
    const conn = new Connection(config.RPC_URL, 'confirmed');
    const raw = prep.transaction.serialize();
    const sig = await conn.sendRawTransaction(raw);
    await conn.confirmTransaction(sig, 'confirmed');
    return { ok: true, txSig: sig, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: String(err) };
  }
}
