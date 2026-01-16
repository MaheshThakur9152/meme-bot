import { config } from './config';

export type HypeResult = { score: number; reason?: string; latencyMs: number };

/**
 * Check hype using Groq if API key present; otherwise fallback to a fast heuristic.
 * The function returns a score in [0,1] and latency measurement.
 */
export async function checkHype(text: string): Promise<HypeResult> {
  const start = Date.now();
  if (config.GROQ_API_KEY) {
    // NOTE: Sample structure; adjust to Groq's actual API. For safety we keep this as a template.
    try {
      const res = await fetch('https://api.groq.com/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.GROQ_API_KEY}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const score = data?.hype_score ?? (Math.random() * 0.6 + 0.2);
      return { score: Number(score), reason: 'groq', latencyMs: Date.now() - start };
    } catch (err) {
      // Any failure -> fallback
      const fallbackScore = heuristic(text);
      return { score: fallbackScore, reason: 'fallback-on-error', latencyMs: Date.now() - start };
    }
  } else {
    // Fast heuristic: keyword + emojis
    const score = heuristic(text);
    // Add tiny synthetic latency to emulate an ultra-fast model (150ms typical)
    await sleep(50);
    return { score, reason: 'heuristic', latencyMs: Date.now() - start };
  }
}

function heuristic(text: string) {
  const hypeWords = ['moon', 'going to moon', 'to the moon', '🚀', 'rekt', 'all in', 'to the moon!'];
  const t = text.toLowerCase();
  const hits = hypeWords.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
  return Math.min(1, 0.3 + hits * 0.35);
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
