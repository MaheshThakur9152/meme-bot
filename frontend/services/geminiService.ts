
import { TweetSignal } from "../types";

export async function getMarketSentimentAnalysis(tweets: TweetSignal[]) {
  const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tweets }) });
  if (!res.ok) throw new Error('analyze failed');
  return res.json();
}

export async function getTradeExecutionRationale(trade: any, tweets: TweetSignal[]) {
  const res = await fetch('/api/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trade, tweets }) });
  if (!res.ok) throw new Error('explain failed');
  return res.json();
}
