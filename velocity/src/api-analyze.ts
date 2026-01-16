import { IncomingMessage, ServerResponse } from 'http';
import { checkHype } from './ai';

export async function handleAnalyze(req: IncomingMessage, res: ServerResponse) {
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { tweets } = JSON.parse(body || '{}');
    if (!Array.isArray(tweets)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid body, expected { tweets: [] }' }));
      return;
    }

    const results = [] as any[];
    let sum = 0;
    for (const t of tweets.slice(0, 50)) {
      const r = await checkHype(t.content || t.text || '');
      results.push({ id: t.id, text: t.content || t.text, score: r.score, latency: r.latencyMs });
      sum += r.score;
    }
    const avg = results.length ? sum / results.length : 0;
    const summary = avg >= 0.75 ? 'Strong bullish sentiment' : avg >= 0.5 ? 'Moderate bullish sentiment' : 'Neutral/Low sentiment';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ avg, summary, results }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }
}
