import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { WebSocketServer } from 'ws';
import { config } from './config';
import { bus } from './bus';
import { getTrades, getStats } from './paper';

const PORT = config.PORT || 8080;
const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    if (req.url === '/' || req.url === '/index.html') {
      const file = path.join(process.cwd(), 'public', 'index.html');
      const html = await fs.readFile(file, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Serve static assets (style and app)
    if (req.url === '/style.css') {
      const file = path.join(process.cwd(), 'public', 'style.css');
      const css = await fs.readFile(file, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(css);
      return;
    }

    if (req.url === '/app.js') {
      const file = path.join(process.cwd(), 'public', 'app.js');
      const js = await fs.readFile(file, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
      return;
    }

    if (req.url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, now: Date.now() }));
      return;
    }

    if (req.url === '/api/trades') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getTrades()));
      return;
    }

    if (req.url === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getStats()));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/analyze') {
      // lightweight analysis endpoint
      const { handleAnalyze } = await import('./api-analyze');
      await handleAnalyze(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/explain') {
      const { handleExplain } = await import('./api-explain');
      await handleExplain(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/toggle/send') {
      // Toggle send mode at runtime
      (config as any).SEND_ENABLED = !(config as any).SEND_ENABLED;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: (config as any).SEND_ENABLED ? 'live' : 'paper' }));
      try { bus.emit('mode', { mode: (config as any).SEND_ENABLED ? 'live' : 'paper' }); } catch(e){}
      return;
    }

    if (req.method === 'POST' && req.url === '/api/toggle/auto') {
      (config as any).AUTO_SWITCH = !(config as any).AUTO_SWITCH;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, auto: (config as any).AUTO_SWITCH }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  ws.send(JSON.stringify({ type: 'trades', data: getTrades() }));
  try { ws.send(JSON.stringify({ type: 'stats', data: getStats() })); } catch(e){}
  try { ws.send(JSON.stringify({ type: 'mode', data: { mode: config.SEND_ENABLED ? 'live' : 'paper' } })); } catch(e){}
});

function broadcast(obj: any) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(msg);
  }
}

bus.on('signal', (t) => broadcast({ type: 'signal', data: t }));
bus.on('trade', (t) => broadcast({ type: 'trade', data: t }));
bus.on('stats', (s) => broadcast({ type: 'stats', data: s }));
bus.on('mode', (m) => broadcast({ type: 'mode', data: m }));
// validated signals from VolumeVelocity
bus.on('validated', (v) => broadcast({ type: 'validated', data: v }));

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
