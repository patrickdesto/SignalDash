/* ═══════════════════════════════════════════════════════
   SIGNALDASH — app.js  · RSI Multi-Timeframe Gauges
   ═══════════════════════════════════════════════════════ */

// ─── RELOJ ───────────────────────────────────────────────
(function clock() {
  const el = document.getElementById('clock');
  function tick() { if (el) el.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }); }
  tick();
  setInterval(tick, 1000);
})();

// ─── NAV ─────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ══════════════════════════════════════════════════════════
   GAUGE ENGINE
   ══════════════════════════════════════════════════════════ */

const CX = 100, CY = 108;   // arc center (bottom-center of viewBox 200×115)
const R_OUT = 88;            // outer radius
const R_IN  = 66;            // inner radius
const R_NDL = 80;            // needle tip radius
const R_NDL_BASE = 12;       // needle tail stub radius (opposite side)

// SVG namespace helper
const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}
function f(n) { return n.toFixed(2); }

// Polar → Cartesian (y-flipped for SVG, 0°=right, 90°=up, 180°=left)
function p2c(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

// RSI value → angle in degrees (RSI 0 → 180°/left, RSI 100 → 0°/right)
function rsiAngle(rsi) {
  return 180 - (Math.max(0, Math.min(100, rsi)) / 100) * 180;
}

// Draw a donut arc segment from angle a1 to a2 (both in degrees, a1 > a2 for CCW sweep)
function donutArc(ro, ri, a1, a2) {
  const diff = Math.abs(a1 - a2);
  if (diff < 0.1) return '';
  const large = diff > 180 ? 1 : 0;
  const o1 = p2c(CX, CY, ro, a1), o2 = p2c(CX, CY, ro, a2);
  const i1 = p2c(CX, CY, ri, a1), i2 = p2c(CX, CY, ri, a2);
  return [
    `M ${f(o1.x)} ${f(o1.y)}`,
    `A ${ro} ${ro} 0 ${large} 0 ${f(o2.x)} ${f(o2.y)}`,
    `L ${f(i2.x)} ${f(i2.y)}`,
    `A ${ri} ${ri} 0 ${large} 1 ${f(i1.x)} ${f(i1.y)}`,
    'Z'
  ].join(' ');
}

/* ─── Color gradient stops (RSI 0→100) ─── */
const COLOR_STOPS = [
  { rsi: 0,   hex: '#0369a1' },  // deep blue
  { rsi: 20,  hex: '#38bdf8' },  // blue
  { rsi: 26,  hex: '#38bdf8' },  // blue edge
  { rsi: 33,  hex: '#7a8fa8' },  // blue-slate
  { rsi: 40,  hex: '#475569' },  // slate
  { rsi: 47,  hex: '#3a8a5a' },  // slate-green
  { rsi: 50,  hex: '#22c55e' },  // green center
  { rsi: 53,  hex: '#3a8a5a' },  // green-slate
  { rsi: 60,  hex: '#475569' },  // slate
  { rsi: 67,  hex: '#a05050' },  // slate-red
  { rsi: 74,  hex: '#ef4444' },  // red edge
  { rsi: 87,  hex: '#ef4444' },  // red
  { rsi: 100, hex: '#991b1b' },  // deep red
];

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function getRSIColor(rsi) {
  const v = Math.max(0, Math.min(100, rsi));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const s0 = COLOR_STOPS[i], s1 = COLOR_STOPS[i + 1];
    if (v <= s1.rsi) {
      const t = (v - s0.rsi) / (s1.rsi - s0.rsi);
      return lerpColor(s0.hex, s1.hex, t);
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1].hex;
}

/* ─── Zone info (label, signal) ─── */
function getZone(rsi) {
  if (rsi < 26)           return { label: 'SOBREVENTA',  signal: '⬇ Buscar largo',   cls: 'a-blue',   bar: '#38bdf8' };
  if (rsi < 40)           return { label: 'TRANSICIÓN',  signal: '– Esperar señal',  cls: 'a-orange', bar: '#64748b' };
  if (rsi <= 60)          return { label: 'EJECUCIÓN',   signal: '✓ Zona de gatillo', cls: 'a-green',  bar: '#22c55e' };
  if (rsi < 74)           return { label: 'TRANSICIÓN',  signal: '– Esperar señal',  cls: 'a-orange', bar: '#64748b' };
  return                         { label: 'SOBRECOMPRA', signal: '⬆ Buscar corto',   cls: 'a-red',    bar: '#ef4444' };
}

/* ─── Static gauge background (zones + ticks + labels) ─── */
const ZONE_SEGS = [
  { rsi0: 0,  rsi1: 26,  color: '#38bdf8', opacity: 0.55 },
  { rsi0: 26, rsi1: 40,  color: '#475569', opacity: 0.20 },
  { rsi0: 40, rsi1: 60,  color: '#22c55e', opacity: 0.55 },
  { rsi0: 60, rsi1: 74,  color: '#475569', opacity: 0.20 },
  { rsi0: 74, rsi1: 100, color: '#ef4444', opacity: 0.55 },
];

const TICK_RSIS  = [0, 26, 40, 50, 60, 74, 100];
const LABEL_RSIS = [26, 40, 50, 60, 74];

function buildGauge(id) {
  const svg = document.getElementById(id);
  if (!svg) return;
  svg.innerHTML = '';

  // — Defs: glow filter —
  const defs = el('defs');
  defs.innerHTML = `
    <filter id="glow-${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-sm-${id}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // — Dark background track —
  const bg = el('path', {
    d: donutArc(R_OUT + 2, R_IN - 2, 180, 0),
    fill: '#0b0d14',
    stroke: '#1a1f30',
    'stroke-width': '1'
  });
  svg.appendChild(bg);

  // — Zone colored segments —
  ZONE_SEGS.forEach(z => {
    const a1 = rsiAngle(z.rsi0), a2 = rsiAngle(z.rsi1);
    const seg = el('path', {
      d: donutArc(R_OUT, R_IN, a1, a2),
      fill: z.color,
      opacity: z.opacity
    });
    svg.appendChild(seg);
  });

  // — Zone boundary tick marks —
  TICK_RSIS.forEach(rsi => {
    const ang = rsiAngle(rsi);
    const outer = p2c(CX, CY, R_OUT + 4, ang);
    const inner = p2c(CX, CY, R_IN - 4, ang);
    svg.appendChild(el('line', {
      x1: f(outer.x), y1: f(outer.y),
      x2: f(inner.x), y2: f(inner.y),
      stroke: rsi === 50 ? '#374151' : '#232840',
      'stroke-width': rsi === 50 ? '1.5' : '1'
    }));
  });

  // — Labels inside arc —
  LABEL_RSIS.forEach(rsi => {
    const ang = rsiAngle(rsi);
    const lp = p2c(CX, CY, R_IN - 13, ang);
    const colors = { 26: '#38bdf8', 40: '#64748b', 50: '#22c55e', 60: '#64748b', 74: '#ef4444' };
    const t = el('text', {
      x: f(lp.x), y: f(lp.y + 3.5),
      'text-anchor': 'middle',
      fill: colors[rsi] || '#4a5568',
      'font-size': '8',
      'font-family': 'monospace',
      opacity: '0.85'
    });
    t.textContent = rsi;
    svg.appendChild(t);
  });

  // — Needle glow (blurred, behind needle) —
  const ndlGlow = el('line', {
    class: 'g-needle-glow',
    x1: f(CX), y1: f(CY),
    x2: f(CX + R_NDL), y2: f(CY),
    stroke: '#ffffff',
    'stroke-width': '5',
    'stroke-linecap': 'round',
    opacity: '0.35',
    filter: `url(#glow-${id})`
  });
  svg.appendChild(ndlGlow);

  // — Needle —
  const ndl = el('line', {
    class: 'g-needle',
    x1: f(p2c(CX, CY, R_NDL_BASE, 0).x), y1: f(CY),   // tail stub (will update x1 too)
    x2: f(CX + R_NDL), y2: f(CY),
    stroke: '#ffffff',
    'stroke-width': '2.5',
    'stroke-linecap': 'round',
    filter: `url(#glow-sm-${id})`
  });
  svg.appendChild(ndl);

  // — Center dot (on top of needle base) —
  svg.appendChild(el('circle', {
    class: 'g-center',
    cx: CX, cy: CY, r: '6',
    fill: '#12151f',
    stroke: '#1a1f30',
    'stroke-width': '2'
  }));
  svg.appendChild(el('circle', {
    class: 'g-center-dot',
    cx: CX, cy: CY, r: '4',
    fill: '#475569'
  }));

  // — Active zone highlight arc (on top, updated dynamically) —
  const activeArc = el('path', {
    class: 'g-active-arc',
    d: '',
    fill: 'none',
    stroke: '#ffffff',
    'stroke-width': '0',
    opacity: '0'
  });
  svg.appendChild(activeArc);
}

/* ─── Update needle + colors for a given RSI ─── */
function renderNeedle(id, rsi, color) {
  const svg = document.getElementById(id);
  if (!svg) return;

  const ang = rsiAngle(rsi);
  const tip  = p2c(CX, CY, R_NDL, ang);
  const tail = p2c(CX, CY, R_NDL_BASE, (ang + 180) % 360);

  const ndl = svg.querySelector('.g-needle');
  if (ndl) {
    ndl.setAttribute('x1', f(tail.x)); ndl.setAttribute('y1', f(tail.y));
    ndl.setAttribute('x2', f(tip.x));  ndl.setAttribute('y2', f(tip.y));
    ndl.setAttribute('stroke', color);
  }

  const glow = svg.querySelector('.g-needle-glow');
  if (glow) {
    glow.setAttribute('x1', f(CX)); glow.setAttribute('y1', f(CY));
    glow.setAttribute('x2', f(tip.x));  glow.setAttribute('y2', f(tip.y));
    glow.setAttribute('stroke', color);
  }

  const dot = svg.querySelector('.g-center-dot');
  if (dot) dot.setAttribute('fill', color);
}

/* ════════════════════════════════════════════════════════
   ANIMATION LOOP — smooth lerp per timeframe
   ════════════════════════════════════════════════════════ */

// current (animated) vs target RSI per timeframe
const animated = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };
const targets   = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };
const prevZones = { '15m': null, '1h': null, '4h': null, '1d': null };
const prevRsi   = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };

function rafLoop() {
  requestAnimationFrame(rafLoop);
  const TFS = ['15m', '1h', '4h', '1d'];
  TFS.forEach(tf => {
    const cur = animated[tf];
    const tgt = targets[tf];
    const diff = tgt - cur;
    if (Math.abs(diff) < 0.015) { animated[tf] = tgt; return; }
    // springy lerp: faster when far, slower near target
    const speed = Math.min(0.055, Math.abs(diff) * 0.008 + 0.018);
    animated[tf] = cur + diff * speed;
    applyGaugeUI(tf, animated[tf]);
  });
}

function applyGaugeUI(tf, rsi) {
  const color = getRSIColor(rsi);
  const zone  = getZone(rsi);

  renderNeedle(`gauge-${tf}`, rsi, color);

  // Value text
  const valEl = document.getElementById(`val-${tf}`);
  if (valEl) { valEl.textContent = rsi.toFixed(1); valEl.style.color = color; }

  // Zone label
  const lblEl = document.getElementById(`lbl-${tf}`);
  if (lblEl) { lblEl.textContent = zone.label; lblEl.style.color = color; }

  // Delta vs previous settled RSI
  const deltaEl = document.getElementById(`delta-${tf}`);
  if (deltaEl) {
    const d = rsi - prevRsi[tf];
    if (Math.abs(d) > 0.1) {
      deltaEl.textContent = (d >= 0 ? '▲ +' : '▼ ') + d.toFixed(1);
      deltaEl.style.color = d >= 0 ? '#22c55e' : '#ef4444';
    }
  }

  // Card border + glow tint
  const card = document.getElementById(`card-${tf}`);
  if (card) {
    card.style.borderColor = color + '55';
    card.style.setProperty('--card-glow', color + '1a');
    card.style.boxShadow = `0 0 28px ${color}18, 0 2px 16px rgba(0,0,0,0.4)`;
  }

  // Summary row
  const srsiEl  = document.getElementById(`srsi-${tf}`);
  const szoneEl = document.getElementById(`szone-${tf}`);
  const ssigEl  = document.getElementById(`ssig-${tf}`);
  const sbarEl  = document.getElementById(`sbar-${tf}`);

  if (srsiEl) { srsiEl.textContent = rsi.toFixed(1); srsiEl.style.color = color; }
  if (szoneEl){ szoneEl.textContent = zone.label; szoneEl.style.color = color; }
  if (ssigEl) { ssigEl.textContent = zone.signal; ssigEl.style.color = color; }
  if (sbarEl) { sbarEl.style.width = rsi + '%'; sbarEl.style.background = color; }

  // Alert on zone entry (debounced to zone change)
  if (prevZones[tf] !== null && prevZones[tf] !== zone.label) {
    pushAlert(tf, rsi, zone, color);
  }
  prevZones[tf] = zone.label;
}

/* ════════════════════════════════════════════════════════
   ALERTS
   ════════════════════════════════════════════════════════ */
let alertCount = 0;

function pushAlert(tf, rsi, zone, color) {
  const body = document.getElementById('alertsBody');
  if (!body) return;

  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  document.getElementById('alertCount').textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;

  const tfLabel = tf.toUpperCase();
  const msgs = {
    'SOBREVENTA':  `RSI entró en zona de sobreventa extrema (${rsi.toFixed(1)}) — buscar formación de patrón`,
    'SOBRECOMPRA': `RSI entró en sobrecompra (${rsi.toFixed(1)}) — alerta de reversión`,
    'EJECUCIÓN':   `RSI en zona de gatillo (${rsi.toFixed(1)}) — condición de entrada activa`,
    'TRANSICIÓN':  `RSI salió de zona extrema (${rsi.toFixed(1)}) — monitorear continuación`,
  };

  const tagClass = { 'SOBREVENTA': 'blue', 'SOBRECOMPRA': 'red', 'EJECUCIÓN': 'green', 'TRANSICIÓN': 'orange' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

  const card = document.createElement('div');
  card.className = `alert-card ${zone.cls}`;
  card.innerHTML = `
    <div class="alert-card__type">RSI · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${color}">BTC/USDT · ${tfLabel}</span>
      <span class="alert-card__msg">${msgs[zone.label] || zone.label}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagClass[zone.label] || 'orange'}">◈ ${zone.label}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;

  body.insertBefore(card, body.firstChild);

  // Keep max 12 alerts
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 12) cards[cards.length - 1].remove();
}

/* ════════════════════════════════════════════════════════
   BINANCE — datos reales  (API pública, sin API key)
   ════════════════════════════════════════════════════════ */

const SYMBOL      = 'BTCUSDT';
const RSI_PERIOD  = 14;
const TF_INTERVAL = { '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };

// ─── RSI de Wilder (smoothing exponencial) ───
function calcRSI(closes, period) {
  if (closes.length < period + 1) return null;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0))  / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }

  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

// ─── Klines → RSI para un timeframe ───
async function fetchRSI(tf) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${TF_INTERVAL[tf]}&limit=100`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const closes = data.map(k => parseFloat(k[4]));
  return calcRSI(closes, RSI_PERIOD);
}

// ─── Ticker 24h → precio + cambio % ───
async function fetchTicker() {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${SYMBOL}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── Indicador de estado en el header ───
function setStatus(ok) {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  if (dot)  dot.style.background = ok ? '' : '#ef4444';
  if (text) text.textContent = ok ? 'En vivo · Binance' : 'Error conexión';
}

// ─── Actualiza los 4 timeframes en paralelo ───
async function updateAllRSI() {
  const tfs = ['15m', '1h', '4h', '1d'];
  const results = await Promise.allSettled(tfs.map(fetchRSI));
  let anyOk = false;
  results.forEach((res, i) => {
    if (res.status === 'fulfilled' && res.value !== null) {
      const tf = tfs[i];
      prevRsi[tf] = targets[tf];
      targets[tf] = Math.max(3, Math.min(97, res.value));
      anyOk = true;
    }
  });
  setStatus(anyOk);
}

// ─── Actualiza precio en pair-bar ───
async function updatePrice() {
  try {
    const t    = await fetchTicker();
    const price = parseFloat(t.lastPrice);
    const pct   = parseFloat(t.priceChangePercent);
    const priceEl  = document.getElementById('pairPrice');
    const changeEl = document.getElementById('pairChange');
    if (priceEl) priceEl.textContent = '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (changeEl) {
      const up = pct >= 0;
      changeEl.textContent = (up ? '+' : '') + pct.toFixed(2) + '%';
      changeEl.className   = `pair-change ${up ? 'up' : 'down'}`;
    }
  } catch (e) {
    console.warn('Price fetch error:', e.message);
  }
}

/* ════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════ */
['15m', '1h', '4h', '1d'].forEach(tf => buildGauge(`gauge-${tf}`));

// Animación RAF
rafLoop();

// Render inicial en RSI 50 mientras llega el primer fetch
['15m', '1h', '4h', '1d'].forEach(tf => {
  animated[tf]  = 50;
  targets[tf]   = 50;
  prevZones[tf] = getZone(50).label;
  applyGaugeUI(tf, 50);
});

// Primera carga inmediata, luego cada 30 segundos
updateAllRSI();
updatePrice();
setInterval(updateAllRSI, 30_000);
setInterval(updatePrice,  30_000);
