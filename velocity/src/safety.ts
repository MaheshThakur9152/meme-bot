/** Rudimentary safety/rug checks built for the prototype. 
 * In production, implement thorough checks: mint authorities, freeze authority, LP distribution, verified audits, token age, etc.
 */
export async function simpleRugCheck(symbol: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    // Heuristic: query DexScreener pair details (if available) and check age/liquidity.
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: true };
    const data = await res.json();
    const first = (data?.pairs && data.pairs[0]) || (data?.tokens && data.tokens[0]);
    if (!first) return { ok: true };
    const liquidity = Number(first?.liquidity?.usd) || Number(first?.liquidity) || 0;
    if (liquidity < 100) return { ok: false, reason: 'low liquidity' };
    // placeholder check: if token is extremely new and low liquidity -> fail
    return { ok: true };
  } catch (err) {
    return { ok: true };
  }
}
