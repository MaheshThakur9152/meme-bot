import { IncomingMessage, ServerResponse } from 'http';
import { config } from './config';

export async function handleExplain(req: IncomingMessage, res: ServerResponse) {
  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { trade, signals } = JSON.parse(body || '{}');
    // If OpenAI key present, call OpenAI; otherwise return rule-based rationale
    const openaiKey = process.env.OPENAI_API_KEY || '';

    if (openaiKey) {
      try {
        const prompt = `Explain why a trading bot would execute a ${trade?.type || 'buy'} order for ${trade?.symbol || trade?.asset || 'ASSET'} based on these signals:\n${JSON.stringify((signals||[]).map((t:any)=>t.content||t.text))}\nKeep it short and data-driven.`;
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 200 }),
        });
        const json = await resp.json();
        const text = (json?.choices?.[0]?.message?.content) || JSON.stringify(json);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text }));
        return;
      } catch (err) {
        // Fallthrough to rule-based
      }
    }

    // Rule-based fallback
    const sigCount = (signals || []).filter((t:any) => /(moon|🚀|to the moon|all in)/i.test(t.content || t.text || '')).length;
    const reason = sigCount > 0 ? `Detected ${sigCount} high-hype messages; signal appears bullish.` : 'No strong hype keywords detected; decision likely low-confidence.';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: reason }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }
}
