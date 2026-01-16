import { checkHype } from './ai';
import { buildAndSimulate } from './solana';

async function demoRun(text: string) {
  const start = Date.now();
  const p1 = buildAndSimulate('DOGE');
  const p2 = checkHype(text);
  const [a, b] = await Promise.all([p1, p2]);
  console.log('Demo result:', { buildOk: a.ok, simulateLatency: a.latencyMs, hypeScore: b.score, hypeLatency: b.latencyMs, totalMs: Date.now() - start });
}

(async () => {
  await demoRun('DOGE is going to moon! 🚀');
  await demoRun('some normal chatter about markets');
})();