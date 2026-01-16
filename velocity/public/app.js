const tweetsEl = document.getElementById('tweets');
const tradesEl = document.getElementById('trades');
const statsEl = document.getElementById('stats');
const modeEl = document.getElementById('mode');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const btnToggleAuto = document.getElementById('btn-toggle-auto');

function formatTime(ts){ return new Date(ts).toLocaleTimeString(); }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e }

const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
ws.addEventListener('open', ()=>console.log('WS open'));
ws.addEventListener('message', (ev)=>{
  try{
    const msg = JSON.parse(ev.data);
    if(msg.type === 'signal') addSignal(msg.data);
    if(msg.type === 'validated') addValidated(msg.data);
    if(msg.type === 'trade') addTrade(msg.data);
    if(msg.type === 'trades') msg.data.reverse().slice(0,50).forEach(addTrade);
    if(msg.type === 'stats') renderStats(msg.data);
    if(msg.type === 'mode') renderMode(msg.data);
  }catch(e){console.error(e)}
});

async function fetchStats(){
  try{ const r = await fetch('/api/stats'); if(!r.ok) return; const s = await r.json(); renderStats(s);}catch(e){}
}

function addSignal(t){
  const node = el('div','tweet');
  node.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${t.source}</strong> <span class="small">${formatTime(t.createdAt)}</span></div><div class="badge">${t.symbol || 'signal'}</div></div><div style="margin-top:8px">${t.text}</div>`;
  tweetsEl.insertBefore(node, tweetsEl.firstChild);
}

function addTrade(t){
  const node = el('div','trade');
  node.innerHTML = `<div><strong>${t.symbol}</strong><div class="small">id: ${t.id}</div></div><div><div class="small">${formatTime(t.time)}</div><div class="small">${t.details?.paperTrade ? 'paper' : 'live'}</div></div>`;
  tradesEl.insertBefore(node, tradesEl.firstChild);
}

function addValidated(v){
  const node = el('div','tweet');
  node.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>VALIDATED</strong> <span class="small">${v.symbol}</span></div><div class="badge">${v.uniqueBuyers} buyers • $${v.totalVolume.toFixed(2)}</div></div><div style="margin-top:8px">Validated by Volume Velocity</div>`;
  tweetsEl.insertBefore(node, tweetsEl.firstChild);
}

function renderStats(s){
  if(!s) return;
  statsEl.innerHTML = `Trades: <strong>${s.totalTrades}</strong> <span class="small">• Realized: ${s.realizedCount}</span><br/>Win Rate: <strong>${(s.winRate*100).toFixed(1)}%</strong> <span class="small">• RealizedProfit: ${s.realizedProfit.toFixed(2)}</span>`;
}

function renderMode(m){ if(!m) return; modeEl.innerHTML = `Mode: <strong>${m.mode}</strong>`; }

btnToggleMode?.addEventListener('click', async ()=>{
  const res = await fetch('/api/toggle/send',{method:'POST'}); if(res.ok){ const j=await res.json(); renderMode({mode: j.mode}); }
});

btnToggleAuto?.addEventListener('click', async ()=>{
  const res = await fetch('/api/toggle/auto',{method:'POST'}); if(res.ok){ const j=await res.json(); btnToggleAuto.textContent = j.auto ? 'Auto: ON' : 'Auto: OFF'; }
});

fetchStats();
setInterval(fetchStats, 5000);
