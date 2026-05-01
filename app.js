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

// ─── NAV / SECCIONES ─────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => {
    s.classList.toggle('sec-hidden', s.id !== id);
  });
  if (id === 'sec-comparaciones' && typeof compData !== 'undefined' && compData) {
    setTimeout(() => renderCompViews(), 60);
  }
}

document.querySelectorAll('.nav-item[data-section]').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    showSection(this.dataset.section);
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
  { rsi: 0,   hex: '#1a3f5c' },
  { rsi: 20,  hex: '#2d6e96' },
  { rsi: 26,  hex: '#2d6e96' },
  { rsi: 33,  hex: '#4a6278' },
  { rsi: 40,  hex: '#384858' },
  { rsi: 47,  hex: '#2a5e42' },
  { rsi: 50,  hex: '#3a8a5c' },
  { rsi: 53,  hex: '#2a5e42' },
  { rsi: 60,  hex: '#384858' },
  { rsi: 67,  hex: '#6a3838' },
  { rsi: 74,  hex: '#a04040' },
  { rsi: 87,  hex: '#a04040' },
  { rsi: 100, hex: '#6a2020' },
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
  if (rsi < 26)           return { label: 'SOBREVENTA',  signal: '⬇ Buscar largo',    cls: 'a-blue',   bar: '#2d6e96' };
  if (rsi < 40)           return { label: 'TRANSICIÓN',  signal: '– Esperar señal',   cls: 'a-orange', bar: '#4a5c6e' };
  if (rsi <= 60)          return { label: 'EJECUCIÓN',   signal: '✓ Zona de gatillo', cls: 'a-green',  bar: '#3a8a5c' };
  if (rsi < 74)           return { label: 'TRANSICIÓN',  signal: '– Esperar señal',   cls: 'a-orange', bar: '#4a5c6e' };
  return                         { label: 'SOBRECOMPRA', signal: '⬆ Buscar corto',    cls: 'a-red',    bar: '#a04040' };
}

/* ─── Static gauge background (zones + ticks + labels) ─── */
const ZONE_SEGS = [
  { rsi0: 0,  rsi1: 26,  color: '#2d6e96', opacity: 0.42 },
  { rsi0: 26, rsi1: 40,  color: '#384858', opacity: 0.18 },
  { rsi0: 40, rsi1: 60,  color: '#3a8a5c', opacity: 0.42 },
  { rsi0: 60, rsi1: 74,  color: '#384858', opacity: 0.18 },
  { rsi0: 74, rsi1: 100, color: '#a04040', opacity: 0.42 },
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

// ─── Klines crudos (250 velas) — suficiente para EMA 200 + RSI 14 ───
async function fetchKlines(tf) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${TF_INTERVAL[tf]}&limit=250`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return data.map(k => parseFloat(k[4]));
}

// ─── EMA estándar con inicio SMA ───
function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const mult = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * mult + ema * (1 - mult);
  }
  return ema;
}

// ─── Estado de alertas EMA 100/200 por timeframe ───
const emaAlertState = {
  '15m': { e100AboveE200: null, inProximity: false },
  '1h':  { e100AboveE200: null, inProximity: false },
  '4h':  { e100AboveE200: null, inProximity: false },
  '1d':  { e100AboveE200: null, inProximity: false },
};

// ─── Actualiza UI del panel EMA ───
function updateEMAUI(tf, price, e20, e50, e100, e200) {
  [[20, e20], [50, e50], [100, e100], [200, e200]].forEach(([p, val]) => {
    if (val === null) return;
    const valEl = document.getElementById(`ema-val-${tf}-${p}`);
    const posEl = document.getElementById(`ema-pos-${tf}-${p}`);
    if (valEl) valEl.textContent = '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (posEl) {
      const above = price >= val;
      posEl.textContent = above ? '↑ encima' : '↓ debajo';
      posEl.className   = `ema-row__pos ${above ? 'above' : 'below'}`;
    }
  });

  const badgeEl = document.getElementById(`ema-badge-${tf}`);
  if (!badgeEl || e100 === null || e200 === null) return;

  const st         = emaAlertState[tf];
  const pctDiff    = Math.abs(e100 - e200) / price;
  const e100Above  = e100 > e200;
  const crossed    = st.e100AboveE200 !== null && st.e100AboveE200 !== e100Above;
  const inProx     = pctDiff < 0.005;

  if (crossed) {
    const dir = e100Above ? 'ALCISTA' : 'BAJISTA';
    badgeEl.className   = 'ema-card__badge cross';
    badgeEl.textContent = `⚡ CRUCE ${dir} — EMA 100 × EMA 200`;
    pushEMAAlert(tf, 'cross', e100Above, e100, e200, price);
  } else if (inProx) {
    badgeEl.className   = 'ema-card__badge proximity';
    badgeEl.textContent = `⚠ EMA 100 y 200 próximas · ${(pctDiff * 100).toFixed(2)}%`;
    if (!st.inProximity) pushEMAAlert(tf, 'proximity', e100Above, e100, e200, price);
  } else {
    badgeEl.className   = 'ema-card__badge';
    badgeEl.textContent = '';
  }

  st.e100AboveE200 = e100Above;
  st.inProximity   = inProx;
}

// ─── Alerta EMA en el panel de alertas ───
function pushEMAAlert(tf, type, e100Above, e100, e200, price) {
  const body = document.getElementById('alertsBody');
  if (!body) return;

  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  document.getElementById('alertCount').textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;

  const tfLabel  = tf.toUpperCase();
  const timeStr  = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const priceStr = price.toLocaleString('en-US', { maximumFractionDigits: 0 });

  let msg, tagText, accentCls, tagCls, pairColor;
  if (type === 'cross') {
    const dir  = e100Above ? 'ALCISTA' : 'BAJISTA';
    msg        = `Cruce ${dir} de EMA 100 × EMA 200 en ${tfLabel} — precio: $${priceStr}`;
    tagText    = `⚡ CRUCE ${dir}`;
    accentCls  = e100Above ? 'a-green' : 'a-red';
    tagCls     = e100Above ? 'green'   : 'red';
    pairColor  = e100Above ? '#22c55e' : '#ef4444';
  } else {
    const pct  = (Math.abs(e100 - e200) / price * 100).toFixed(2);
    msg        = `EMA 100 y EMA 200 a ${pct}% de diferencia en ${tfLabel} — posible cruce inminente`;
    tagText    = '⚠ PROXIMIDAD';
    accentCls  = 'a-orange';
    tagCls     = 'orange';
    pairColor  = '#f97316';
  }

  const card = document.createElement('div');
  card.className = `alert-card ${accentCls}`;
  card.innerHTML = `
    <div class="alert-card__type">EMA · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${pairColor}">BTC/USDT · ${tfLabel}</span>
      <span class="alert-card__msg">${msg}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagCls}">${tagText}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;

  body.insertBefore(card, body.firstChild);
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 12) cards[cards.length - 1].remove();
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

// ─── Actualiza RSI + EMAs para los 4 timeframes en paralelo ───
async function updateAllData() {
  const tfs     = ['15m', '1h', '4h', '1d'];
  const results = await Promise.allSettled(tfs.map(async tf => {
    const closes = await fetchKlines(tf);
    return {
      tf,
      rsi:   calcRSI(closes, RSI_PERIOD),
      e20:   calcEMA(closes, 20),
      e50:   calcEMA(closes, 50),
      e100:  calcEMA(closes, 100),
      e200:  calcEMA(closes, 200),
      price: closes[closes.length - 1],
    };
  }));

  let anyOk = false;
  results.forEach(res => {
    if (res.status !== 'fulfilled') return;
    const { tf, rsi, e20, e50, e100, e200, price } = res.value;
    if (rsi !== null) {
      prevRsi[tf] = targets[tf];
      targets[tf] = Math.max(3, Math.min(97, rsi));
      anyOk = true;
    }
    updateEMAUI(tf, price, e20, e50, e100, e200);
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
updateAllData();
updatePrice();
setInterval(updateAllData, 30_000);
setInterval(updatePrice,   30_000);

/* ════════════════════════════════════════════════════════
   COMPARACIONES — Rendimiento Relativo Multi-Activo
   ════════════════════════════════════════════════════════ */

const COMP_ASSETS = [
  'BTCUSDT','ETHUSDT','XRPUSDT','BNBUSDT','SOLUSDT','ADAUSDT',
  'BCHUSDT','LINKUSDT','XLMUSDT','TONUSDT','AVAXUSDT','SUIUSDT',
  'TAOUSDT','DOTUSDT','UNIUSDT','NEARUSDT','AAVEUSDT','ALGOUSDT',
  'ENAUSDT','INJUSDT','RNDRUSDT','FETUSDT'
];
const AI_ASSETS = ['TAOUSDT','FETUSDT','RNDRUSDT','NEARUSDT','INJUSDT'];

const COMP_COLORS = {
  BTCUSDT:  '#b87c28', ETHUSDT:  '#6370a0', XRPUSDT:  '#2878a8',
  BNBUSDT:  '#a88828', SOLUSDT:  '#6e38b8', ADAUSDT:  '#2060a8',
  BCHUSDT:  '#5a8030', LINKUSDT: '#284898', XLMUSDT:  '#1878a0',
  TONUSDT:  '#1870b0', AVAXUSDT: '#9c3030', SUIUSDT:  '#3a70a8',
  TAOUSDT:  '#2e7878', DOTUSDT:  '#903468', UNIUSDT:  '#903458',
  NEARUSDT: '#1a7858', AAVEUSDT: '#683870', ALGOUSDT: '#1878a0',
  ENAUSDT:  '#6a8828', INJUSDT:  '#1880a8', RNDRUSDT: '#b86828',
  FETUSDT:  '#1888a8'
};

let compData      = null;
let compPeriod    = '1w';
let compBusy      = false;
let compTab       = 'global';
let disabledGlobal = new Set();

const PERIOD_SLICES = { '1w': 8, '1m': 31, '1y': 366 };

// ── Data fetch (366 días para soportar % Año) ─────────────
async function fetchCompData() {
  const out = {};
  await Promise.allSettled(COMP_ASSETS.map(async sym => {
    try {
      const [kr, tr] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=366`),
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`)
      ]);
      if (kr.ok && tr.ok) out[sym] = { klines: await kr.json(), ticker: await tr.json() };
    } catch {}
  }));
  return out;
}

// ── Nice Y ticks ──────────────────────────────────────────
function compNiceTicks(min, max, n) {
  const rng = max - min || 1;
  const raw = rng / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const s   = mag * (raw / mag < 1.5 ? 1 : raw / mag < 3 ? 2 : raw / mag < 7 ? 5 : 10);
  const ticks = [];
  for (let v = Math.ceil(min / s) * s; v <= max + s * 0.001; v += s)
    ticks.push(parseFloat(v.toFixed(8)));
  return ticks;
}

// ── Build normalized series ───────────────────────────────
function buildCompSeries(data, assetList, period) {
  const sliceN = PERIOD_SLICES[period] || 31;
  const out = [];
  for (const sym of assetList) {
    const klines = data[sym]?.klines;
    if (!klines || klines.length < 2) continue;
    const closes = klines.map(k => parseFloat(k[4]));
    const ts     = klines.map(k => k[0]);
    const sc     = closes.slice(-sliceN);
    const st     = ts.slice(-sliceN);
    if (sc.length < 2) continue;
    const base = sc[0];
    const vals = sc.map(c => ((c / base) - 1) * 100);
    out.push({ sym, color: COMP_COLORS[sym] || '#888', name: sym.replace('USDT',''), vals, ts: st, cur: vals[vals.length - 1] });
  }
  return out;
}

// ── Draw chart ────────────────────────────────────────────
function drawCompChart(series, canvasId, loadingId) {
  const canvas = document.getElementById(canvasId);
  const loadEl = document.getElementById(loadingId);
  if (!canvas) return;
  if (loadEl) loadEl.style.display = 'none';
  if (!series.length) return;

  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W    = Math.max(Math.floor(rect.width), 300);
  const H    = Math.max(Math.floor(rect.height), 300);
  canvas.width  = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { t: 20, b: 34, l: 58, r: 14 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;

  let minV = Infinity, maxV = -Infinity;
  for (const s of series) for (const v of s.vals) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
  const rng = maxV - minV || 1;
  minV -= rng * 0.06; maxV += rng * 0.06;

  const xOf = (i, tot) => pad.l + (i / (tot - 1)) * cW;
  const yOf = v => pad.t + cH - ((v - minV) / (maxV - minV)) * cH;

  ctx.fillStyle = '#0b0e17'; ctx.fillRect(0, 0, W, H);

  const ticks = compNiceTicks(minV, maxV, 6);
  ctx.font = '10px "JetBrains Mono",Consolas,monospace'; ctx.textAlign = 'right';
  ctx.setLineDash([3, 6]); ctx.lineWidth = 1;
  for (const t of ticks) {
    const y = yOf(t);
    if (y < pad.t - 4 || y > pad.t + cH + 4) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText((t >= 0 ? '+' : '') + t.toFixed(0) + '%', pad.l - 5, y + 3.5);
  }
  ctx.setLineDash([]);

  const y0 = yOf(0);
  if (y0 >= pad.t && y0 <= pad.t + cH) {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
  }

  const refTs = series[0].ts; const totPt = refTs.length;
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.textAlign = 'center';
  ctx.font = '10px "JetBrains Mono",Consolas,monospace';
  const lblN = Math.min(6, totPt - 1);
  for (let li = 0; li <= lblN; li++) {
    const di = Math.round((li / lblN) * (totPt - 1));
    const d  = new Date(refTs[di]);
    ctx.fillText(d.toLocaleDateString('es', { month: 'short', day: 'numeric' }), xOf(di, totPt), H - 7);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + cH); ctx.lineTo(W - pad.r, pad.t + cH); ctx.stroke();

  const drawOrder = [...series].sort((a, b) => a.cur - b.cur);
  for (const s of drawOrder) {
    const tot = s.vals.length;
    ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.82;
    for (let i = 0; i < tot; i++) { const x = xOf(i, tot), y = yOf(s.vals[i]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(xOf(tot - 1, tot), yOf(s.vals[tot - 1]), 2.5, 0, Math.PI * 2);
    ctx.fillStyle = s.color; ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Draw legend (with optional toggle) ───────────────────
function drawCompLegend(allSeries, disabledSet, legendId, onToggle) {
  const el = document.getElementById(legendId);
  if (!el) return;

  const sorted = [...allSeries].sort((a, b) => {
    const ad = disabledSet && disabledSet.has(a.sym);
    const bd = disabledSet && disabledSet.has(b.sym);
    if (ad !== bd) return ad ? 1 : -1;
    return b.cur - a.cur;
  });

  el.innerHTML = sorted.map(s => {
    const dis = disabledSet && disabledSet.has(s.sym);
    return `<div class="comp-leg-item${dis ? ' is-off' : ''}" data-sym="${s.sym}">
      <span class="comp-leg-sw" style="background:${dis ? '#2a2d3a' : s.color}"></span>
      <span class="comp-leg-nm">${s.name}</span>
      <span class="comp-leg-pc ${s.cur >= 0 ? 'pos' : 'neg'}">${s.cur >= 0 ? '+' : ''}${s.cur.toFixed(2)}%</span>
    </div>`;
  }).join('');

  if (onToggle) {
    el.querySelectorAll('.comp-leg-item[data-sym]').forEach(item => {
      item.addEventListener('click', () => onToggle(item.dataset.sym));
    });
  }
}

// ── Draw table ────────────────────────────────────────────
function drawCompTable(data, period, activeAssets, tbodyId, thIds) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const rows = [];
  for (const sym of activeAssets) {
    const { klines, ticker } = data[sym] || {};
    if (!klines || klines.length < 2) continue;
    const closes = klines.map(k => parseFloat(k[4]));
    const last   = closes[closes.length - 1];
    const price  = parseFloat(ticker.lastPrice);
    const pDay   = parseFloat(ticker.priceChangePercent);
    const pWeek  = closes.length >= 8   ? ((last / closes[closes.length - 8])   - 1) * 100 : null;
    const pMonth = closes.length >= 31  ? ((last / closes[closes.length - 31])  - 1) * 100 : null;
    const pYear  = closes.length >= 2   ? ((last / closes[0])                   - 1) * 100 : null;
    rows.push({ sym, name: sym.replace('USDT',''), price, pDay, pWeek, pMonth, pYear, color: COMP_COLORS[sym]||'#888' });
  }

  const sortMap = { '1w': 'pWeek', '1m': 'pMonth', '1y': 'pYear' };
  const sk = sortMap[period] || 'pMonth';
  rows.sort((a, b) => (b[sk] ?? -Infinity) - (a[sk] ?? -Infinity));

  const fp = p => p == null ? '<td class="comp-na">—</td>'
    : `<td class="comp-pc ${p >= 0 ? 'pos' : 'neg'}">${p >= 0 ? '+' : ''}${p.toFixed(2)}%</td>`;

  const fv = p => p >= 10000 ? p.toLocaleString('en',{maximumFractionDigits:0}) : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p.toPrecision(4);

  tbody.innerHTML = rows.map((r, i) => `<tr class="${i % 2 ? 'alt' : ''}">
    <td><div class="comp-asset-cell"><span class="comp-sw" style="background:${r.color}"></span><span class="comp-nm">${r.name}</span></div></td>
    <td class="comp-price font-mono">$${fv(r.price)}</td>
    ${fp(r.pDay)}${fp(r.pWeek)}${fp(r.pMonth)}${fp(r.pYear)}
  </tr>`).join('');

  if (thIds) {
    [thIds.thDay,thIds.thWeek,thIds.thMonth,thIds.thYear].forEach(id => document.getElementById(id)?.classList.remove('sorted'));
    const activeThId = sortMap[period] === 'pWeek' ? thIds.thWeek : sortMap[period] === 'pMonth' ? thIds.thMonth : thIds.thYear;
    document.getElementById(activeThId)?.classList.add('sorted');
  }
}

// ── Disabled bar (Global) ─────────────────────────────────
function updateDisabledBar() {
  const bar = document.getElementById('disabledBar');
  if (!bar) return;
  if (disabledGlobal.size === 0) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = `<span class="comp-dis-lbl">Ocultos:</span>` +
    [...disabledGlobal].map(sym => {
      const col = COMP_COLORS[sym] || '#888';
      return `<span class="comp-dis-chip" data-sym="${sym}">
        <span style="background:${col};width:6px;height:6px;border-radius:2px;display:inline-block;flex-shrink:0"></span>
        ${sym.replace('USDT','')} <span class="comp-dis-x">×</span>
      </span>`;
    }).join('');
  bar.querySelectorAll('.comp-dis-chip[data-sym]').forEach(chip => {
    chip.addEventListener('click', () => { disabledGlobal.delete(chip.dataset.sym); renderGlobalView(); });
  });
}

// ── Render Global view ────────────────────────────────────
function renderGlobalView() {
  if (!compData) return;
  const all    = buildCompSeries(compData, COMP_ASSETS, compPeriod);
  const active = all.filter(s => !disabledGlobal.has(s.sym));
  drawCompChart(active, 'perfChart', 'compLoading');
  drawCompLegend(all, disabledGlobal, 'compLegend', sym => {
    disabledGlobal.has(sym) ? disabledGlobal.delete(sym) : disabledGlobal.add(sym);
    renderGlobalView();
  });
  drawCompTable(compData, compPeriod, COMP_ASSETS.filter(s => !disabledGlobal.has(s)), 'compTbody',
    { thDay:'thDay', thWeek:'thWeek', thMonth:'thMonth', thYear:'thYear' });
  updateDisabledBar();
}

// ── Render AI view ────────────────────────────────────────
function renderAIView() {
  if (!compData) return;
  const series = buildCompSeries(compData, AI_ASSETS, compPeriod);
  drawCompChart(series, 'perfChartAI', 'compLoadingAI');
  drawCompLegend(series, null, 'compLegendAI', null);
  drawCompTable(compData, compPeriod, AI_ASSETS, 'compTbodyAI',
    { thDay:'thDayAI', thWeek:'thWeekAI', thMonth:'thMonthAI', thYear:'thYearAI' });
}

// ── Active render dispatcher ──────────────────────────────
function renderCompViews() {
  if (compTab === 'global') renderGlobalView();
  else renderAIView();
}

// ── Main update ───────────────────────────────────────────
async function updateComparisons() {
  if (compBusy) return;
  compBusy = true;
  ['compLoading','compLoadingAI'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'flex'; });
  try {
    if (!compData) compData = await fetchCompData();
    renderGlobalView();
    renderAIView();
  } finally { compBusy = false; }
}

// ── Tab buttons ───────────────────────────────────────────
document.querySelectorAll('.comp-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.comp-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    compTab = this.dataset.tab;
    document.getElementById('view-global').style.display = compTab === 'global' ? '' : 'none';
    document.getElementById('view-ai').style.display     = compTab === 'ai'     ? '' : 'none';
    if (compData) setTimeout(() => renderCompViews(), 50);
  });
});

// ── Period buttons ────────────────────────────────────────
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    compPeriod = this.dataset.period;
    if (compData) renderCompViews();
  });
});

// ── Resize ────────────────────────────────────────────────
let _compResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_compResizeTimer);
  _compResizeTimer = setTimeout(() => { if (compData) renderCompViews(); }, 160);
});

// ── Boot ──────────────────────────────────────────────────
updateComparisons();
setInterval(async () => { compData = null; await updateComparisons(); }, 300_000);

/* ════════════════════════════════════════════════════════
   NOTICIAS — RSS Multi-Feed (CoinDesk · Cointelegraph · Decrypt)
   ════════════════════════════════════════════════════════ */

const NEWS_FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk',      color: '#F7931A' },
  { url: 'https://cointelegraph.com/rss',                   name: 'Cointelegraph', color: '#3AB0FF' },
  { url: 'https://decrypt.co/feed',                         name: 'Decrypt',       color: '#5CC8D6' }
];
const NEWS_PROXY = 'https://api.allorigins.win/raw?url=';
let newsLoaded   = false;

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function fetchFeed(feed) {
  try {
    const res = await fetchWithTimeout(NEWS_PROXY + encodeURIComponent(feed.url), 9000);
    if (!res.ok) return [];
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    return Array.from(xml.querySelectorAll('item')).slice(0, 12).map(it => {
      const linkEl = it.querySelector('link');
      const link   = linkEl?.textContent?.trim()
                  || linkEl?.getAttribute('href')
                  || it.querySelector('guid')?.textContent?.trim() || '';
      return {
        title:  it.querySelector('title')?.textContent?.trim() || '',
        link,
        date:   new Date(it.querySelector('pubDate')?.textContent?.trim() || ''),
        source: feed.name,
        color:  feed.color
      };
    }).filter(n => n.title && n.link && !isNaN(n.date.getTime()));
  } catch { return []; }
}

function newsTimeAgo(date) {
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1)    return 'ahora';
  if (m < 60)   return `hace ${m}m`;
  if (m < 1440) return `hace ${Math.floor(m / 60)}h`;
  return `hace ${Math.floor(m / 1440)}d`;
}

function renderNewsGrid(items) {
  const grid  = document.getElementById('newsGrid');
  const updEl = document.getElementById('newsUpdated');
  if (!grid) return;

  grid.innerHTML = items.map(n => `
    <a class="news-card" href="${n.link}" target="_blank" rel="noopener noreferrer" style="border-top-color:${n.color}">
      <span class="news-card__src" style="color:${n.color}">${n.source}</span>
      <p class="news-card__title">${n.title}</p>
      <div class="news-card__foot">
        <span class="news-card__time">${newsTimeAgo(n.date)}</span>
        <span class="news-card__arr">↗</span>
      </div>
    </a>`).join('');

  if (updEl) updEl.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

async function updateNews() {
  const grid = document.getElementById('newsGrid');

  const settled = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
  const all     = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  if (all.length === 0) {
    if (!newsLoaded && grid)
      grid.innerHTML = '<div class="news-placeholder">No se pudieron cargar las noticias. Reintentando en 8 min…</div>';
    return;
  }

  newsLoaded = true;
  renderNewsGrid(all.sort((a, b) => b.date - a.date).slice(0, 6));
}

updateNews();
setInterval(updateNews, 8 * 60 * 1000);
