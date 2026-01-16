/**
 * Minimal Jupiter adapter skeleton.
 * - Provides a `quoteSwap` method that returns a price/quote object.
 * - In production: wire to Jupiter quote API and swap router to build transaction instructions.
 */

export type JupiterQuote = { inputSymbol: string; outputSymbol: string; inputAmount: number; outAmount: number; price: number; latencyMs: number; raw?: any };

const SIM_PRICES: Record<string, number> = {
  'DOGE': 0.06,
  'SOL': 120,
  'BTC': 40000,
  'ETH': 2000,
  'USDC': 1,
};

export async function quoteSwap(symbol: string, usdAmount = 10): Promise<JupiterQuote> {
  const start = Date.now();
  // For prototype: simulate quote using SIM_PRICES. In production, call Jupiter quote API.
  const price = SIM_PRICES[symbol] ?? 1;
  // For example, buying `symbol` with USD (USDC) amount
  const outAmount = usdAmount / price;
  // tiny sleep to emulate network roundtrip
  await sleep(40);
  return { inputSymbol: 'USDC', outputSymbol: symbol, inputAmount: usdAmount, outAmount, price, latencyMs: Date.now() - start };
}

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)); }
