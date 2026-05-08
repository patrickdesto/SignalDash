/* ═══════════════════════════════════════════════════════
   SIGNALDASH — app.js  · Multi-Asset RSI/EMA Dashboard
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
   ASSET METADATA
   ══════════════════════════════════════════════════════════ */

const ASSET_NAMES = {
  BTCUSDT:  'Bitcoin',      ETHUSDT:  'Ethereum',    XRPUSDT:  'XRP',
  BNBUSDT:  'BNB',          SOLUSDT:  'Solana',      ADAUSDT:  'Cardano',
  BCHUSDT:  'Bitcoin Cash', LINKUSDT: 'Chainlink',   XLMUSDT:  'Stellar',
  TONUSDT:  'Toncoin',      AVAXUSDT: 'Avalanche',   SUIUSDT:  'Sui',
  TAOUSDT:  'Bittensor',    DOTUSDT:  'Polkadot',    UNIUSDT:  'Uniswap',
  NEARUSDT: 'NEAR Protocol',AAVEUSDT: 'Aave',        ALGOUSDT: 'Algorand',
  ENAUSDT:  'Ethena',       INJUSDT:  'Injective',   RENDERUSDT: 'Render',
  FETUSDT:  'Fetch.ai',     DOGEUSDT: 'Dogecoin',    TRXUSDT:  'TRON'
};

const CMC_RANKS = {
  BTCUSDT:  1,  ETHUSDT:  2,  XRPUSDT:  3,  BNBUSDT:  4,
  SOLUSDT:  5,  XLMUSDT:  6,  TONUSDT:  7,  ADAUSDT:  8,
  DOGEUSDT: 9,  TRXUSDT:  10,
  AVAXUSDT: 11, SUIUSDT:  13, DOTUSDT:  16, LINKUSDT: 15,
  NEARUSDT: 18, AAVEUSDT: 22, UNIUSDT:  20, INJUSDT:  25,
  ALGOUSDT: 44, BCHUSDT:  17, TAOUSDT:  19, FETUSDT:  30,
  ENAUSDT:  33, RENDERUSDT: 38
};

const ASSET_CATS = {
  BTCUSDT:  { cat: 'PoW',      cls: 'cat-pow'   },
  ETHUSDT:  { cat: 'L1',       cls: 'cat-l1'    },
  XRPUSDT:  { cat: 'Pagos',    cls: 'cat-pay'   },
  BNBUSDT:  { cat: 'Exchange', cls: 'cat-exc'   },
  SOLUSDT:  { cat: 'L1',       cls: 'cat-l1'    },
  ADAUSDT:  { cat: 'L1',       cls: 'cat-l1'    },
  BCHUSDT:  { cat: 'PoW',      cls: 'cat-pow'   },
  LINKUSDT: { cat: 'Oracle',   cls: 'cat-oracle' },
  XLMUSDT:  { cat: 'Pagos',    cls: 'cat-pay'   },
  TONUSDT:  { cat: 'L1',       cls: 'cat-l1'    },
  AVAXUSDT: { cat: 'L1',       cls: 'cat-l1'    },
  SUIUSDT:  { cat: 'L1',       cls: 'cat-l1'    },
  TAOUSDT:  { cat: 'AI',       cls: 'cat-ai'    },
  DOTUSDT:  { cat: 'L0',       cls: 'cat-l0'    },
  UNIUSDT:  { cat: 'DeFi',     cls: 'cat-defi'  },
  NEARUSDT: { cat: 'AI / L1',  cls: 'cat-ai'    },
  AAVEUSDT: { cat: 'DeFi',     cls: 'cat-defi'  },
  ALGOUSDT: { cat: 'L1',       cls: 'cat-l1'    },
  ENAUSDT:  { cat: 'DeFi',     cls: 'cat-defi'  },
  INJUSDT:  { cat: 'DeFi / L1',cls: 'cat-defi'  },
  RENDERUSDT: { cat: 'AI',       cls: 'cat-ai'    },
  FETUSDT:    { cat: 'AI',       cls: 'cat-ai'    },
  DOGEUSDT:   { cat: 'PoW',      cls: 'cat-pow'   },
  TRXUSDT:    { cat: 'L1',       cls: 'cat-l1'    },
};

const COMP_ASSETS = [
  'BTCUSDT','ETHUSDT','XRPUSDT','BNBUSDT','SOLUSDT','ADAUSDT',
  'BCHUSDT','LINKUSDT','XLMUSDT','TONUSDT','AVAXUSDT','SUIUSDT',
  'TAOUSDT','DOTUSDT','UNIUSDT','NEARUSDT','AAVEUSDT','ALGOUSDT',
  'ENAUSDT','INJUSDT','RENDERUSDT','FETUSDT'
];
const AI_ASSETS       = ['TAOUSDT','FETUSDT','RENDERUSDT','NEARUSDT','INJUSDT'];
const CAP_EXTRA_ASSETS = ['DOGEUSDT','TRXUSDT'];

const CAP_TIER_DEFS = {
  t5:    { label: 'Top 5',   min: 1,  max: 5   },
  t10:   { label: '6 – 10',  min: 6,  max: 10  },
  t20:   { label: '11 – 20', min: 11, max: 20  },
  t30:   { label: '21 – 30', min: 21, max: 30  },
  resto: { label: 'Menores', min: 31, max: 999 },
};
function getCapTierAssets(tier) {
  const { min, max } = CAP_TIER_DEFS[tier] || CAP_TIER_DEFS.t5;
  const all = [...new Set([...COMP_ASSETS, ...CAP_EXTRA_ASSETS])];
  return all.filter(s => { const r = CMC_RANKS[s] || 999; return r >= min && r <= max; })
            .sort((a, b) => (CMC_RANKS[a]||999) - (CMC_RANKS[b]||999));
}

const COMP_COLORS = {
  BTCUSDT:  '#d4954a', ETHUSDT:  '#7a85c0', XRPUSDT:  '#3a9acd',
  BNBUSDT:  '#c8a030', SOLUSDT:  '#8a50d8', ADAUSDT:  '#3878c8',
  BCHUSDT:  '#70a040', LINKUSDT: '#3060b8', XLMUSDT:  '#2090c0',
  TONUSDT:  '#2088d8', AVAXUSDT: '#c04040', SUIUSDT:  '#4a90c8',
  TAOUSDT:  '#30a090', DOTUSDT:  '#b04880', UNIUSDT:  '#b04870',
  NEARUSDT: '#24906a', AAVEUSDT: '#7850a0', ALGOUSDT: '#2898c8',
  ENAUSDT:  '#90a838', INJUSDT:  '#2098c8', RENDERUSDT: '#d07830',
  FETUSDT:  '#22a8c8', DOGEUSDT: '#c8a030', TRXUSDT:    '#cc2233'
};

/* ══════════════════════════════════════════════════════════
   GAUGE ENGINE
   ══════════════════════════════════════════════════════════ */

const CX = 100, CY = 100;
const R_OUT = 84, R_IN = 58; // kept for legacy donutArc references
const R_ARC = 78, R_NDL = 65, R_NDL_BASE = 8;

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}
function f(n) { return n.toFixed(2); }

function p2c(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function rsiAngle(rsi) { return 210 - (Math.max(0, Math.min(100, rsi)) / 100) * 240; }

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

const COLOR_STOPS = [
  { rsi: 0,   hex: '#0a2a4a' },
  { rsi: 20,  hex: '#1d6090' },
  { rsi: 26,  hex: '#1d9bf0' },
  { rsi: 33,  hex: '#3a6070' },
  { rsi: 40,  hex: '#2a3d52' },
  { rsi: 47,  hex: '#0d5c3a' },
  { rsi: 50,  hex: '#16c784' },
  { rsi: 53,  hex: '#0d5c3a' },
  { rsi: 60,  hex: '#2a3d52' },
  { rsi: 67,  hex: '#5a1a1a' },
  { rsi: 74,  hex: '#ea3943' },
  { rsi: 87,  hex: '#c02030' },
  { rsi: 100, hex: '#7a1020' },
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

function getZone(rsi) {
  if (rsi < 26)  return { label: 'SOBREVENTA',  signal: '⬇ Buscar largo',    cls: 'a-blue',   bar: '#1d9bf0' };
  if (rsi < 40)  return { label: 'TRANSICIÓN',  signal: '– Esperar señal',   cls: 'a-orange', bar: '#4a5c6e' };
  if (rsi <= 60) return { label: 'EJECUCIÓN',   signal: '✓ Zona de gatillo', cls: 'a-green',  bar: '#16c784' };
  if (rsi < 74)  return { label: 'TRANSICIÓN',  signal: '– Esperar señal',   cls: 'a-orange', bar: '#4a5c6e' };
  return                 { label: 'SOBRECOMPRA', signal: '⬆ Buscar corto',   cls: 'a-red',    bar: '#ea3943' };
}

const ZONE_SEGS = [
  { rsi0: 0,  rsi1: 26,  color: '#1d9bf0', opacity: 0.35 },
  { rsi0: 26, rsi1: 40,  color: '#2a3d52', opacity: 0.18 },
  { rsi0: 40, rsi1: 60,  color: '#16c784', opacity: 0.35 },
  { rsi0: 60, rsi1: 74,  color: '#2a3d52', opacity: 0.18 },
  { rsi0: 74, rsi1: 100, color: '#ea3943', opacity: 0.35 },
];

const TICK_RSIS  = [0, 26, 40, 50, 60, 74, 100];
const LABEL_RSIS = [26, 40, 50, 60, 74];

function buildGauge(id) {
  const svg = document.getElementById(id);
  if (!svg) return;
  svg.innerHTML = '';

  // ── Defs ─────────────────────────────────────────────────
  const defs = el('defs');
  defs.innerHTML = `
    <radialGradient id="gbg-${id}" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="#0c2035"/>
      <stop offset="100%" stop-color="#050c18"/>
    </radialGradient>
    <radialGradient id="ggl-${id}" cx="50%" cy="25%" r="65%">
      <stop offset="0%"   stop-color="#0a3060" stop-opacity="0.65"/>
      <stop offset="60%"  stop-color="#030c20" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#020810" stop-opacity="0"/>
    </radialGradient>
    <filter id="nf-${id}" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // ── Background circle ─────────────────────────────────────
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: '93', fill: `url(#gbg-${id})` }));

  // Inner glow (pie-wedge covering the 240° gauge area)
  const gA1 = p2c(CX, CY, R_ARC, 210), gA2 = p2c(CX, CY, R_ARC, -30);
  svg.appendChild(el('path', {
    d: `M ${f(CX)} ${f(CY)} L ${f(gA1.x)} ${f(gA1.y)} A ${R_ARC} ${R_ARC} 0 1 0 ${f(gA2.x)} ${f(gA2.y)} Z`,
    fill: `url(#ggl-${id})`
  }));

  // ── Zone arc segments ─────────────────────────────────────
  function zoneArc(rsi0, rsi1, color, op) {
    const a1 = rsiAngle(rsi0), a2 = rsiAngle(rsi1);
    const p1 = p2c(CX, CY, R_ARC, a1), p2_ = p2c(CX, CY, R_ARC, a2);
    return el('path', {
      d: `M ${f(p1.x)} ${f(p1.y)} A ${R_ARC} ${R_ARC} 0 ${rsi1 - rsi0 > 75 ? 1 : 0} 0 ${f(p2_.x)} ${f(p2_.y)}`,
      fill: 'none', stroke: color, 'stroke-width': '5',
      'stroke-linecap': 'butt', opacity: String(op)
    });
  }

  // Main arc overlay (thin white ring)
  svg.appendChild(el('path', {
    d: `M ${f(gA1.x)} ${f(gA1.y)} A ${R_ARC} ${R_ARC} 0 1 0 ${f(gA2.x)} ${f(gA2.y)}`,
    fill: 'none', stroke: 'rgba(175,210,240,0.30)', 'stroke-width': '1.2'
  }));


  // ── Tick marks & numbers ──────────────────────────────────
  for (let rsi = 0; rsi <= 100; rsi += 5) {
    const isMajor = rsi % 10 === 0;
    const ang   = rsiAngle(rsi);
    const outer = p2c(CX, CY, R_ARC + 1, ang);
    const inner = p2c(CX, CY, R_ARC - (isMajor ? 9 : 4), ang);
    svg.appendChild(el('line', {
      x1: f(outer.x), y1: f(outer.y), x2: f(inner.x), y2: f(inner.y),
      stroke: isMajor ? 'rgba(185,215,240,0.80)' : 'rgba(120,170,210,0.38)',
      'stroke-width': isMajor ? '1.5' : '0.8', 'stroke-linecap': 'round'
    }));
    if (rsi % 25 === 0) {
      const np = p2c(CX, CY, R_ARC + 15, ang);
      const t  = el('text', {
        x: f(np.x), y: f(np.y),
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: 'rgba(85,150,205,0.82)',
        'font-size': '7.5',
        'font-family': '"JetBrains Mono",Consolas,monospace',
        'font-weight': '600'
      });
      t.textContent = rsi;
      svg.appendChild(t);
    }
  }

  // ── Needle glow ───────────────────────────────────────────
  const ndlInit  = p2c(CX, CY, R_NDL, 210);
  const tailInit = p2c(CX, CY, R_NDL_BASE, (210 + 180) % 360);
  svg.appendChild(el('line', {
    class: 'g-needle-glow',
    x1: f(CX), y1: f(CY), x2: f(ndlInit.x), y2: f(ndlInit.y),
    stroke: '#1d9bf0', 'stroke-width': '5', 'stroke-linecap': 'round',
    opacity: '0.22', filter: `url(#nf-${id})`
  }));

  // ── Needle ────────────────────────────────────────────────
  svg.appendChild(el('line', {
    class: 'g-needle',
    x1: f(tailInit.x), y1: f(tailInit.y), x2: f(ndlInit.x), y2: f(ndlInit.y),
    stroke: '#b8d4ee', 'stroke-width': '1.3', 'stroke-linecap': 'round',
    filter: `url(#nf-${id})`
  }));

  svg.appendChild(el('circle', {
    class: 'g-needle-tip',
    cx: f(ndlInit.x), cy: f(ndlInit.y), r: '2', fill: '#1d9bf0'
  }));

  // ── Hub circles ───────────────────────────────────────────
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: '11', fill: '#071220', stroke: 'rgba(25,75,130,0.55)', 'stroke-width': '1.5' }));
  svg.appendChild(el('circle', { cx: CX, cy: CY, r: '6',  fill: '#0b1e33', stroke: 'rgba(18,75,160,0.65)', 'stroke-width': '1' }));
  svg.appendChild(el('circle', { class: 'g-center-dot', cx: CX, cy: CY, r: '3', fill: '#1d9bf0' }));

  // ── RSI value text (inside arc) ───────────────────────────
  const vt = el('text', {
    class: 'g-val-text',
    x: CX, y: CY + 26,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: '#4a6070', 'font-size': '18',
    'font-family': '"JetBrains Mono",Consolas,monospace',
    'font-weight': '700', 'letter-spacing': '-0.5'
  });
  vt.textContent = '—';
  svg.appendChild(vt);
}

function renderNeedle(id, rsi, color) {
  const svg = document.getElementById(id);
  if (!svg) return;
  const ang  = rsiAngle(rsi);
  const tip  = p2c(CX, CY, R_NDL, ang);
  const tail = p2c(CX, CY, R_NDL_BASE, (ang + 180) % 360);

  const ndl = svg.querySelector('.g-needle');
  if (ndl) {
    ndl.setAttribute('x1', f(tail.x)); ndl.setAttribute('y1', f(tail.y));
    ndl.setAttribute('x2', f(tip.x));  ndl.setAttribute('y2', f(tip.y));
  }
  const glow = svg.querySelector('.g-needle-glow');
  if (glow) {
    glow.setAttribute('x1', f(CX));    glow.setAttribute('y1', f(CY));
    glow.setAttribute('x2', f(tip.x)); glow.setAttribute('y2', f(tip.y));
    glow.setAttribute('stroke', color);
  }
  const dot = svg.querySelector('.g-center-dot');
  if (dot) dot.setAttribute('fill', color);

  const tipDot = svg.querySelector('.g-needle-tip');
  if (tipDot) {
    tipDot.setAttribute('cx', f(tip.x));
    tipDot.setAttribute('cy', f(tip.y));
    tipDot.setAttribute('fill', color);
  }
}

/* ════════════════════════════════════════════════════════
   ANIMATION LOOP
   ════════════════════════════════════════════════════════ */

const animated  = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };
const targets   = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };
const prevZones = { '15m': null, '1h': null, '4h': null, '1d': null };
const prevRsi   = { '15m': 50, '1h': 50, '4h': 50, '1d': 50 };
let switchingAsset = false;

function rafLoop() {
  requestAnimationFrame(rafLoop);
  ['15m', '1h', '4h', '1d'].forEach(tf => {
    const cur = animated[tf], tgt = targets[tf], diff = tgt - cur;
    if (Math.abs(diff) < 0.015) { animated[tf] = tgt; return; }
    const speed = Math.min(0.055, Math.abs(diff) * 0.008 + 0.018);
    animated[tf] = cur + diff * speed;
    applyGaugeUI(tf, animated[tf]);
  });
}

function applyGaugeUI(tf, rsi) {
  const color = getRSIColor(rsi);
  const zone  = getZone(rsi);

  renderNeedle(`gauge-${tf}`, rsi, color);

  const valEl = document.getElementById(`val-${tf}`);
  if (valEl) { valEl.textContent = rsi.toFixed(1); valEl.style.color = color; }

  const lblEl = document.getElementById(`lbl-${tf}`);
  if (lblEl) { lblEl.textContent = zone.label; lblEl.style.color = color; }

  const deltaEl = document.getElementById(`delta-${tf}`);
  if (deltaEl) {
    const d = rsi - prevRsi[tf];
    if (Math.abs(d) > 0.1) {
      deltaEl.textContent = (d >= 0 ? '▲ +' : '▼ ') + d.toFixed(1);
      deltaEl.style.color = d >= 0 ? '#16c784' : '#ea3943';
    }
  }

  const card = document.getElementById(`card-${tf}`);
  if (card) {
    card.style.borderColor = color + '55';
    card.style.setProperty('--card-glow', color + '1a');
    card.style.boxShadow = `0 0 28px ${color}18, 0 2px 16px rgba(0,0,0,0.4)`;
  }

  const srsiEl  = document.getElementById(`srsi-${tf}`);
  const szoneEl = document.getElementById(`szone-${tf}`);
  const ssigEl  = document.getElementById(`ssig-${tf}`);
  const sbarEl  = document.getElementById(`sbar-${tf}`);
  if (srsiEl)  { srsiEl.textContent  = rsi.toFixed(1); srsiEl.style.color = color; }
  if (szoneEl) { szoneEl.textContent = zone.label;     szoneEl.style.color = color; }
  if (ssigEl)  { ssigEl.textContent  = zone.signal;    ssigEl.style.color = color; }
  if (sbarEl)  { sbarEl.style.width  = rsi + '%';      sbarEl.style.background = color; }

  // Update SVG internals: progress arc + value text
  const svgEl = document.getElementById(`gauge-${tf}`);
  if (svgEl) {
    const arcStroke = svgEl.querySelector('.g-active-stroke');
    const valText   = svgEl.querySelector('.g-val-text');

    if (valText) {
      valText.textContent = rsi.toFixed(1);
      valText.setAttribute('fill', color);
    }
  }

  if (!switchingAsset && prevZones[tf] !== null && prevZones[tf] !== zone.label) {
    pushAlert(tf, rsi, zone, color);
  }
  prevZones[tf] = zone.label;
}

/* ════════════════════════════════════════════════════════
   ALERTS
   ════════════════════════════════════════════════════════ */
let alertCount = 0;

function getPairName(sym) {
  sym = sym || SYMBOL;
  return sym.replace('USDT', '') + '/USDT';
}

function updateMbarAlerts() {
  const el = document.getElementById('mbarAlerts');
  if (el) el.textContent = alertCount;
}

function pushAlert(tf, rsi, zone, color) {
  const body = document.getElementById('alertsBody');
  if (!body) return;
  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  const countEl = document.getElementById('alertCount');
  if (countEl) countEl.textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;
  updateMbarAlerts();

  const tfLabel = tf.toUpperCase();
  const msgs = {
    'SOBREVENTA':  `RSI entró en zona de sobreventa extrema (${rsi.toFixed(1)}) — buscar formación de patrón`,
    'SOBRECOMPRA': `RSI entró en sobrecompra (${rsi.toFixed(1)}) — alerta de reversión`,
    'EJECUCIÓN':   `RSI en zona de gatillo (${rsi.toFixed(1)}) — condición de entrada activa`,
    'TRANSICIÓN':  `RSI salió de zona extrema (${rsi.toFixed(1)}) — monitorear continuación`,
  };
  const tagClass = { 'SOBREVENTA': 'blue', 'SOBRECOMPRA': 'red', 'EJECUCIÓN': 'green', 'TRANSICIÓN': 'orange' };
  const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

  const card = document.createElement('div');
  card.className = `alert-card ${zone.cls}`;
  card.innerHTML = `
    <div class="alert-card__type">RSI · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${color}">${getPairName()} · ${tfLabel}</span>
      <span class="alert-card__msg">${msgs[zone.label] || zone.label}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagClass[zone.label] || 'orange'}">◈ ${zone.label}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;
  body.insertBefore(card, body.firstChild);
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 20) cards[cards.length - 1].remove();
}

/* ════════════════════════════════════════════════════════
   BINANCE — datos reales (API pública, sin API key)
   ════════════════════════════════════════════════════════ */

let SYMBOL = 'BTCUSDT';
const RSI_PERIOD  = 14;
const TF_INTERVAL = { '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d' };

function formatPrice(p) {
  if (!p && p !== 0) return '—';
  if (p >= 10000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1000)  return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (p >= 100)   return '$' + p.toFixed(2);
  if (p >= 1)     return '$' + p.toFixed(3);
  if (p >= 0.01)  return '$' + p.toFixed(4);
  return '$' + p.toPrecision(4);
}

function calcRSI(closes, period) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0))  / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

async function fetchKlines(tf) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${TF_INTERVAL[tf]}&limit=250`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).map(k => parseFloat(k[4]));
}

function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const mult = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i] * mult + ema * (1 - mult);
  return ema;
}

const emaAlertState = {
  '15m': { e100AboveE200: null, inProximity: false },
  '1h':  { e100AboveE200: null, inProximity: false },
  '4h':  { e100AboveE200: null, inProximity: false },
  '1d':  { e100AboveE200: null, inProximity: false },
};

function updateEMAUI(tf, price, e20, e50, e100, e200) {
  const emaColors = { 20: '#16c784', 50: '#0ea5e9', 100: '#f59e0b', 200: '#ea3943' };
  const emas = [[20, e20], [50, e50], [100, e100], [200, e200]];
  let aboveCount = 0, validCount = 0;

  emas.forEach(([p, val]) => {
    if (val === null) return;
    validCount++;
    const above = price >= val;
    if (above) aboveCount++;
    const diff = ((price - val) / val) * 100;
    const valEl  = document.getElementById(`ema-val-${tf}-${p}`);
    const posEl  = document.getElementById(`ema-pos-${tf}-${p}`);
    const fillEl = document.getElementById(`ema-fill-${tf}-${p}`);
    if (valEl) valEl.textContent = formatPrice(val);
    if (posEl) {
      posEl.textContent = (above ? '↑ +' : '↓ −') + Math.abs(diff).toFixed(2) + '%';
      posEl.className   = `ema-row__pos ${above ? 'above' : 'below'}`;
    }
    if (fillEl) {
      const fillPct = Math.min(100, (Math.abs(diff) / 12) * 100);
      fillEl.style.width      = fillPct + '%';
      fillEl.style.background = emaColors[p] || '#0ea5e9';
      fillEl.style.opacity    = above ? '1' : '0.45';
    }
  });

  const trendEl = document.getElementById(`ema-trend-${tf}`);
  if (trendEl && validCount > 0) {
    const ratio = aboveCount / validCount;
    let label, cls;
    if (ratio >= 0.75)      { label = `${aboveCount}/${validCount} ↑ ALCISTA`; cls = 'bull'; }
    else if (ratio <= 0.25) { label = `${aboveCount}/${validCount} ↓ BAJISTA`; cls = 'bear'; }
    else                    { label = `${aboveCount}/${validCount} ~ MIXTO`;   cls = 'mixed'; }
    trendEl.textContent = label;
    trendEl.className   = `ema-card__trend ${cls}`;
  }

  const badgeEl = document.getElementById(`ema-badge-${tf}`);
  if (!badgeEl || e100 === null || e200 === null) return;

  const st        = emaAlertState[tf];
  const proximity = Math.abs(e100 - e200) / price;
  const e100Above = e100 > e200;
  const crossed   = st.e100AboveE200 !== null && st.e100AboveE200 !== e100Above;
  const inProx    = proximity < 0.005;

  if (crossed) {
    const dir = e100Above ? 'ALCISTA' : 'BAJISTA';
    badgeEl.className   = 'ema-card__badge cross';
    badgeEl.textContent = `⚡ CRUCE ${dir} — EMA 100 × EMA 200`;
    pushEMAAlert(tf, 'cross', e100Above, e100, e200, price);
  } else if (inProx) {
    badgeEl.className   = 'ema-card__badge proximity';
    badgeEl.textContent = `⚠ EMA 100 y 200 próximas · ${(proximity * 100).toFixed(2)}%`;
    if (!st.inProximity) pushEMAAlert(tf, 'proximity', e100Above, e100, e200, price);
  } else {
    badgeEl.className   = 'ema-card__badge';
    badgeEl.textContent = '';
  }
  st.e100AboveE200 = e100Above;
  st.inProximity   = inProx;
}

function pushEMAAlert(tf, type, e100Above, e100, e200, price) {
  const body = document.getElementById('alertsBody');
  if (!body) return;
  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  const countEl = document.getElementById('alertCount');
  if (countEl) countEl.textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;
  updateMbarAlerts();

  const tfLabel  = tf.toUpperCase();
  const timeStr  = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const priceStr = formatPrice(price);

  let msg, tagText, accentCls, tagCls, pairColor;
  if (type === 'cross') {
    const dir  = e100Above ? 'ALCISTA' : 'BAJISTA';
    msg        = `Cruce ${dir} de EMA 100 × EMA 200 en ${tfLabel} — precio: ${priceStr}`;
    tagText    = `⚡ CRUCE ${dir}`;
    accentCls  = e100Above ? 'a-green' : 'a-red';
    tagCls     = e100Above ? 'green'   : 'red';
    pairColor  = e100Above ? '#16c784' : '#ea3943';
  } else {
    const pct  = (Math.abs(e100 - e200) / price * 100).toFixed(2);
    msg        = `EMA 100 y EMA 200 a ${pct}% de diferencia en ${tfLabel} — posible cruce inminente`;
    tagText    = '⚠ PROXIMIDAD';
    accentCls  = 'a-orange';
    tagCls     = 'orange';
    pairColor  = '#f59e0b';
  }

  const card = document.createElement('div');
  card.className = `alert-card ${accentCls}`;
  card.innerHTML = `
    <div class="alert-card__type">EMA · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${pairColor}">${getPairName()} · ${tfLabel}</span>
      <span class="alert-card__msg">${msg}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagCls}">${tagText}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;
  body.insertBefore(card, body.firstChild);
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 20) cards[cards.length - 1].remove();
}

/* ════════════════════════════════════════════════════════
   PATRÓN DE SOBREEXTENSIÓN — 1H / 4H
   ════════════════════════════════════════════════════════ */

const patternActive = {};

function checkExtensionPattern(tf, rsi, price, e20, e50, e100, e200) {
  if (!['1h', '4h'].includes(tf)) return;
  if ([rsi, e20, e50, e100, e200].some(v => v === null)) return;

  const inRange = rsi >= 40 && rsi <= 60;
  const isBull  = inRange && price > e20 && price < e50 && price < e100 && price < e200;
  const isBear  = inRange && price < e20 && price > e50 && price > e100 && price > e200;

  const today = new Date().toISOString().slice(0, 10);
  const seen  = JSON.parse(localStorage.getItem('sd_signals') || '{}');

  const trigger = (dir, active) => {
    const key = `${SYMBOL}_${tf}_${dir}`;
    const was = patternActive[key];
    patternActive[key] = active;
    if (active && !was) {
      const dayKey = `${key}_${today}`;
      if (!seen[dayKey]) {
        seen[dayKey] = true;
        localStorage.setItem('sd_signals', JSON.stringify(seen));
        showSignalModal(tf, dir, price, rsi);
        pushPatternAlert(tf, dir, price, rsi);
      }
    }
  };

  trigger('alcista', isBull);
  trigger('bajista', isBear);
}

function showSignalModal(tf, dir, price, rsi) {
  const overlay = document.getElementById('signalModal');
  const inner   = document.getElementById('signalModalInner');
  if (!overlay || !inner) return;
  const isAlc = dir === 'alcista';
  inner.className = `sig-modal ${dir}`;
  document.getElementById('signalModalBadge').textContent  = isAlc ? '▲ ALCISTA' : '▼ BAJISTA';
  document.getElementById('signalModalTitle').textContent  = isAlc ? 'Señal Revisión Alcista' : 'Señal de Revisión Bajista';
  document.getElementById('signalModalAsset').textContent  = getPairName();
  document.getElementById('signalModalTF').textContent     = tf.toUpperCase();
  document.getElementById('signalModalPrice').textContent  = formatPrice(price);
  document.getElementById('signalModalRSI').textContent    = rsi.toFixed(1);
  overlay.style.display = 'flex';
}

function pushPatternAlert(tf, dir, price, rsi) {
  const body = document.getElementById('alertsBody');
  if (!body) return;
  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  const countEl = document.getElementById('alertCount');
  if (countEl) countEl.textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;
  updateMbarAlerts();

  const isAlc     = dir === 'alcista';
  const tfLabel   = tf.toUpperCase();
  const timeStr   = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const title     = isAlc ? 'Señal Revisión Alcista' : 'Señal de Revisión Bajista';
  const accentCls = isAlc ? 'a-green' : 'a-red';
  const tagCls    = isAlc ? 'green'   : 'red';
  const tagText   = isAlc ? '▲ ALCISTA' : '▼ BAJISTA';
  const clr       = isAlc ? '#16c784'  : '#ea3943';

  const card = document.createElement('div');
  card.className = `alert-card ${accentCls}`;
  card.innerHTML = `
    <div class="alert-card__type">PATRÓN · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${clr}">${getPairName()} · ${tfLabel}</span>
      <span class="alert-card__msg">${title} — precio: ${formatPrice(price)} · RSI: ${rsi.toFixed(1)}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagCls}">${tagText}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;
  body.insertBefore(card, body.firstChild);
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 20) cards[cards.length - 1].remove();
}

async function fetchTicker() {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${SYMBOL}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function setStatus(ok) {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  if (dot)  dot.style.background = ok ? '' : '#ea3943';
  if (text) text.textContent = ok ? 'En vivo · Binance' : 'Error conexión';
}

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
    checkExtensionPattern(tf, rsi, price, e20, e50, e100, e200);
  });
  setStatus(anyOk);
  if (anyOk) updateMbar();
}

async function updatePrice() {
  try {
    const t      = await fetchTicker();
    const price  = parseFloat(t.lastPrice);
    const pct    = parseFloat(t.priceChangePercent);
    const priceEl  = document.getElementById('pairPrice');
    const changeEl = document.getElementById('pairChange');
    if (priceEl) priceEl.textContent = formatPrice(price);
    if (changeEl) {
      const up = pct >= 0;
      changeEl.textContent = (up ? '+' : '') + pct.toFixed(2) + '%';
      changeEl.className   = `pair-change ${up ? 'up' : 'down'}`;
    }
  } catch (e) {
    console.warn('Price fetch error:', e.message);
  }
}

function updateMbar() {
  const rsi4h = targets['4h'], rsi1d = targets['1d'];
  const avg   = (rsi4h + rsi1d) / 2;

  const rsiEl  = document.getElementById('mbarAvgRSI');
  const sentEl = document.getElementById('mbarSentiment');
  if (rsiEl) rsiEl.textContent = avg.toFixed(1);
  if (sentEl) {
    let txt, col;
    if (avg < 30)      { txt = 'Sobreventa';  col = '#1d9bf0'; }
    else if (avg < 45) { txt = 'Bajista';     col = '#ea3943'; }
    else if (avg < 55) { txt = 'Neutral';     col = '#8898a8'; }
    else if (avg < 68) { txt = 'Alcista';     col = '#16c784'; }
    else               { txt = 'Sobrecompra'; col = '#ea3943'; }
    sentEl.textContent = txt;
    sentEl.style.color = col;
  }
}

/* ════════════════════════════════════════════════════════
   ASSET STRIP — selector de activo para el dashboard
   ════════════════════════════════════════════════════════ */

async function fetchAllTickers() {
  const symsJson = JSON.stringify(COMP_ASSETS);
  const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symsJson)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const arr = await r.json();
  const out = {};
  arr.forEach(t => { out[t.symbol] = t; });
  return out;
}

function initAssetStrip() {
  const strip = document.getElementById('assetStrip');
  if (!strip) return;
  strip.innerHTML = COMP_ASSETS.map(sym => {
    const name = sym.replace('USDT', '');
    const rank = CMC_RANKS[sym] || '—';
    return `<div class="asset-chip" data-sym="${sym}">
      <div class="asset-chip__top">
        <span class="asset-chip__rank">#${rank}</span>
        <span class="asset-chip__name">${name}</span>
      </div>
      <span class="asset-chip__price font-mono" id="achip-price-${sym}">—</span>
      <span class="asset-chip__chg" id="achip-chg-${sym}">—%</span>
    </div>`;
  }).join('');

  strip.querySelectorAll('.asset-chip').forEach(chip => {
    chip.addEventListener('click', () => selectAsset(chip.dataset.sym));
  });
  setActiveChip(SYMBOL);
}

function setActiveChip(sym) {
  document.querySelectorAll('.asset-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.sym === sym);
  });
}

function updateAssetStripPrices(tickers) {
  COMP_ASSETS.forEach(sym => {
    const t = tickers[sym];
    if (!t) return;
    const price = parseFloat(t.lastPrice);
    const pct   = parseFloat(t.priceChangePercent);
    const prEl  = document.getElementById(`achip-price-${sym}`);
    const chgEl = document.getElementById(`achip-chg-${sym}`);
    if (prEl)  prEl.textContent = formatPrice(price);
    if (chgEl) {
      const up = pct >= 0;
      chgEl.textContent = (up ? '+' : '') + pct.toFixed(2) + '%';
      chgEl.className   = `asset-chip__chg ${up ? 'up' : 'down'}`;
    }
  });
}

async function selectAsset(sym) {
  if (sym === SYMBOL) return;
  switchingAsset = true;
  SYMBOL = sym;

  const name   = ASSET_NAMES[sym] || sym.replace('USDT', '');
  const ticker = getPairName(sym);

  const fullEl   = document.getElementById('pairAssetFull');
  const badgeEl  = document.getElementById('pairBadge');
  const titleEl  = document.getElementById('emaSectionTitle');
  if (fullEl)  fullEl.textContent  = name;
  if (badgeEl) badgeEl.textContent = ticker;
  if (titleEl) titleEl.textContent = `◈ EMAs · ${ticker} · Medias Exponenciales`;

  const modalAsset = document.getElementById('signalModalAsset');
  if (modalAsset) modalAsset.textContent = ticker;

  ['15m', '1h', '4h', '1d'].forEach(tf => {
    animated[tf]  = 50;
    targets[tf]   = 50;
    prevZones[tf] = null;
    prevRsi[tf]   = 50;
    emaAlertState[tf].e100AboveE200 = null;
    emaAlertState[tf].inProximity   = false;
    const badge = document.getElementById(`ema-badge-${tf}`);
    if (badge) { badge.className = 'ema-card__badge'; badge.textContent = ''; }
    [20, 50, 100, 200].forEach(p => {
      const v   = document.getElementById(`ema-val-${tf}-${p}`);
      const pos = document.getElementById(`ema-pos-${tf}-${p}`);
      if (v)   v.textContent   = '—';
      if (pos) { pos.textContent = ''; pos.className = 'ema-row__pos'; }
    });
  });

  Object.keys(patternActive).forEach(k => { if (k.startsWith(sym)) delete patternActive[k]; });

  const priceEl  = document.getElementById('pairPrice');
  const changeEl = document.getElementById('pairChange');
  if (priceEl)  priceEl.textContent  = '—';
  if (changeEl) { changeEl.textContent = '—%'; changeEl.className = 'pair-change neutral'; }

  setActiveChip(sym);
  setActiveGaugeTab(sym);

  try {
    await Promise.all([updateAllData(), updatePrice(), updateMultiTFCharts()]);
  } finally {
    switchingAsset = false;
  }
}

/* ════════════════════════════════════════════════════════
   BACKGROUND MONITOR — RSI alerts para todos los activos
   ════════════════════════════════════════════════════════ */

const bgZones = {};

async function bgMonitorAssets() {
  const assets = COMP_ASSETS.filter(s => s !== SYMBOL);
  await Promise.allSettled(assets.map(async sym => {
    try {
      const [r4h, r1d] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=4h&limit=50`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=50`)
      ]);
      const [k4h, k1d] = await Promise.all([r4h.json(), r1d.json()]);
      if (!bgZones[sym]) bgZones[sym] = {};

      for (const [tf, klines] of [['4h', k4h], ['1d', k1d]]) {
        const closes = klines.map(k => parseFloat(k[4]));
        const rsi    = calcRSI(closes, RSI_PERIOD);
        if (rsi === null) continue;
        const zone = getZone(rsi);
        const prev = bgZones[sym][tf];
        if (prev !== undefined && prev !== zone.label) {
          pushAlertForAsset(sym, tf, rsi, zone);
        }
        bgZones[sym][tf] = zone.label;
      }
    } catch {}
  }));
}

function pushAlertForAsset(sym, tf, rsi, zone) {
  const body = document.getElementById('alertsBody');
  if (!body) return;
  const empty = body.querySelector('.alert-empty');
  if (empty) empty.remove();

  alertCount++;
  const countEl = document.getElementById('alertCount');
  if (countEl) countEl.textContent = `${alertCount} ${alertCount === 1 ? 'alerta' : 'alertas'}`;
  updateMbarAlerts();

  const name    = sym.replace('USDT', '');
  const tfLabel = tf.toUpperCase();
  const color   = getRSIColor(rsi);
  const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const msgs = {
    'SOBREVENTA':  `RSI en zona de sobreventa extrema (${rsi.toFixed(1)}) — buscar formación de patrón`,
    'SOBRECOMPRA': `RSI en sobrecompra (${rsi.toFixed(1)}) — alerta de reversión`,
    'EJECUCIÓN':   `RSI en zona de gatillo (${rsi.toFixed(1)}) — condición de entrada activa`,
    'TRANSICIÓN':  `RSI salió de zona extrema (${rsi.toFixed(1)}) — monitorear continuación`,
  };
  const tagClass = { 'SOBREVENTA': 'blue', 'SOBRECOMPRA': 'red', 'EJECUCIÓN': 'green', 'TRANSICIÓN': 'orange' };

  const card = document.createElement('div');
  card.className = `alert-card ${zone.cls}`;
  card.innerHTML = `
    <div class="alert-card__type">RSI · ${tfLabel}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="alert-card__pair" style="color:${color}">${name}/USDT · ${tfLabel}</span>
      <span class="alert-card__msg">${msgs[zone.label] || zone.label}</span>
    </div>
    <div class="alert-card__meta">
      <span class="alert-tag ${tagClass[zone.label] || 'orange'}">◈ ${zone.label}</span>
      <span class="alert-time">${timeStr}</span>
    </div>
  `;
  body.insertBefore(card, body.firstChild);
  const cards = body.querySelectorAll('.alert-card');
  if (cards.length > 20) cards[cards.length - 1].remove();
}

/* ════════════════════════════════════════════════════════
   BOOT — dashboard
   ════════════════════════════════════════════════════════ */
['15m', '1h', '4h', '1d'].forEach(tf => buildGauge(`gauge-${tf}`));
rafLoop();
['15m', '1h', '4h', '1d'].forEach(tf => {
  animated[tf]  = 50;
  targets[tf]   = 50;
  prevZones[tf] = getZone(50).label;
  applyGaugeUI(tf, 50);
});

(function () {
  const overlay = document.getElementById('signalModal');
  const btn     = document.getElementById('signalModalClose');
  if (!overlay) return;
  btn?.addEventListener('click', () => { overlay.style.display = 'none'; });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
})();

updateAllData();
updatePrice();
setInterval(updateAllData, 30_000);
setInterval(updatePrice,   30_000);

initAssetStrip();
initGaugeTabs();

async function refreshLiveTickers() {
  try {
    const t = await fetchAllTickers();
    liveCompTickers = t;
    updateAssetStripPrices(t);
    if (compData) patchCompTablePrices(t);
  } catch {}
}
refreshLiveTickers();
setInterval(refreshLiveTickers, 10_000);

setTimeout(async () => {
  await bgMonitorAssets();
  setInterval(bgMonitorAssets, 5 * 60_000);
}, 45_000);

setTimeout(async () => {
  await updateRSIIndex();
  setInterval(updateRSIIndex, 5 * 60_000);
}, 15_000);

/* ════════════════════════════════════════════════════════
   GAUGE TABS — selector de activo para osciladores
   ════════════════════════════════════════════════════════ */

function initGaugeTabs() {
  document.querySelectorAll('.gauge-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.gauge-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectAsset(this.dataset.sym);
    });
  });
}

function setActiveGaugeTab(sym) {
  document.querySelectorAll('.gauge-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.sym === sym);
  });
}

/* ════════════════════════════════════════════════════════
   ÍNDICE RSI — Promedio Multi-Asset (30 días)
   ════════════════════════════════════════════════════════ */

const RSI_INDEX_ASSETS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT'];

function calcRSISeries(closes, period) {
  if (closes.length < period + 1) return [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  const out = [];
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0))  / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}

async function fetchRSIIndexData() {
  const results = await Promise.allSettled(RSI_INDEX_ASSETS.map(async sym => {
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&limit=60`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const klines = await r.json();
    return { sym, closes: klines.map(k => parseFloat(k[4])), dates: klines.map(k => k[0]) };
  }));
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

function drawRSIIndexChart(avgSeries, dates) {
  const canvas  = document.getElementById('rsiIndexChart');
  const loading = document.getElementById('rsiIndexLoading');
  if (!canvas) return;
  if (loading) loading.style.display = 'none';

  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W    = Math.max(Math.floor(rect.width), 200);
  const H    = Math.max(Math.floor(rect.height || 240), 200);
  canvas.width  = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { t: 14, b: 28, l: 34, r: 12 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;

  ctx.fillStyle = '#0d1421';
  ctx.fillRect(0, 0, W, H);

  const yOf = v => pad.t + cH - ((Math.max(0, Math.min(100, v))) / 100) * cH;
  const xOf = (i, tot) => pad.l + (i / Math.max(tot - 1, 1)) * cW;

  [
    { y0: 0,  y1: 26,  color: 'rgba(29,155,240,0.10)' },
    { y0: 40, y1: 60,  color: 'rgba(22,199,132,0.10)' },
    { y0: 74, y1: 100, color: 'rgba(234,57,67,0.10)'  },
  ].forEach(z => {
    ctx.fillStyle = z.color;
    ctx.fillRect(pad.l, yOf(z.y1), cW, yOf(z.y0) - yOf(z.y1));
  });

  ctx.font      = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign = 'right';
  [26, 40, 50, 60, 74].forEach(level => {
    const y = yOf(level);
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = level === 50 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillText(level, pad.l - 3, y + 3.5);
  });

  if (avgSeries.length < 2) return;
  const tot = avgSeries.length;

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
  grad.addColorStop(0, 'rgba(14,165,233,0.28)');
  grad.addColorStop(1, 'rgba(14,165,233,0.00)');
  ctx.beginPath();
  ctx.moveTo(xOf(0, tot), yOf(avgSeries[0]));
  for (let i = 1; i < tot; i++) ctx.lineTo(xOf(i, tot), yOf(avgSeries[i]));
  ctx.lineTo(xOf(tot - 1, tot), pad.t + cH);
  ctx.lineTo(xOf(0, tot), pad.t + cH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  for (let i = 0; i < tot; i++) {
    const x = xOf(i, tot), y = yOf(avgSeries[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle  = 'rgba(255,255,255,0.28)';
  ctx.textAlign  = 'center';
  ctx.font       = '9px "JetBrains Mono",Consolas,monospace';
  const lblN = Math.min(3, tot - 1);
  for (let li = 0; li <= lblN; li++) {
    const di = Math.round((li / lblN) * (tot - 1));
    const d  = new Date(dates[di]);
    ctx.fillText(d.toLocaleDateString('es', { month: 'short', day: 'numeric' }), xOf(di, tot), H - 7);
  }

  ctx.beginPath();
  ctx.arc(xOf(tot - 1, tot), yOf(avgSeries[tot - 1]), 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0ea5e9';
  ctx.fill();
}

function updateRSIIndexCards(rsiMap) {
  RSI_INDEX_ASSETS.forEach(sym => {
    const val  = rsiMap[sym];
    const card = document.getElementById(`rsi-idx-${sym}`);
    if (!card || val == null) return;
    const color  = getRSIColor(val);
    const zone   = getZone(val);
    const valEl  = card.querySelector('.rsi-idx-val');
    const zoneEl = card.querySelector('.rsi-idx-zone');
    if (valEl)  { valEl.textContent = val.toFixed(1); valEl.style.color = color; }
    if (zoneEl) { zoneEl.textContent = zone.label;    zoneEl.style.color = color; }
    card.style.borderColor = color + '44';
  });
}

async function updateRSIIndex() {
  const loading = document.getElementById('rsiIndexLoading');
  if (loading) loading.style.display = 'flex';
  try {
    const assetData = await fetchRSIIndexData();
    if (assetData.length === 0) return;

    const rsiSeriesMap = {}, rsiCurrentMap = {};
    assetData.forEach(({ sym, closes }) => {
      const series = calcRSISeries(closes, RSI_PERIOD);
      rsiSeriesMap[sym]  = series;
      rsiCurrentMap[sym] = series.length ? series[series.length - 1] : null;
    });

    const N = 30;
    const aligned = assetData.map(({ sym }) => {
      const s = rsiSeriesMap[sym] || [];
      return s.length > N ? s.slice(-N) : s;
    });
    const minLen = Math.min(...aligned.map(s => s.length));
    if (minLen < 2) return;

    const avgSeries = Array.from({ length: minLen }, (_, i) =>
      aligned.reduce((acc, s) => acc + s[s.length - minLen + i], 0) / aligned.length
    );

    const refData  = assetData[0];
    const allDates = refData.dates.slice(RSI_PERIOD + 1);
    const dates    = allDates.slice(-minLen);

    window._rsiIndexData = { avg: avgSeries, dates };
    drawRSIIndexChart(avgSeries, dates);
    updateRSIIndexCards(rsiCurrentMap);

    const currentAvg = avgSeries[avgSeries.length - 1];
    const avgEl  = document.getElementById('rsiIndexAvg');
    const zoneEl = document.getElementById('rsiIndexZone');
    if (avgEl)  { avgEl.textContent = currentAvg.toFixed(1); avgEl.style.color = getRSIColor(currentAvg); }
    if (zoneEl) { const z = getZone(currentAvg); zoneEl.textContent = z.label; zoneEl.style.color = getRSIColor(currentAvg); }
  } catch (e) {
    console.warn('RSI Index error:', e.message);
    if (loading) loading.style.display = 'none';
  }
}

/* ════════════════════════════════════════════════════════
   COMPARACIONES — Rendimiento Relativo Multi-Activo
   ════════════════════════════════════════════════════════ */

let compData        = null;
let compPeriod      = '1w';
let compBusy        = false;
let compTab         = 'global';
let compCapTier     = 't5';
let compCustomDays  = null;
let disabledGlobal  = new Set();
let liveCompTickers = null;

function getCalendarStart(period) {
  const now = new Date();
  if (period === '1w') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dow = d.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    return d.getTime();
  }
  if (period === '1m') {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  }
  if (period === '1y') {
    return Date.UTC(now.getUTCFullYear(), 0, 1);
  }
  return null;
}

async function fetchCompData() {
  const out = {};
  const allSyms = [...new Set([...COMP_ASSETS, ...CAP_EXTRA_ASSETS])];
  await Promise.allSettled(allSyms.map(async sym => {
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

function buildCompSeries(data, assetList, period) {
  const startTs = compCustomDays !== null
    ? Date.now() - compCustomDays * 86400000
    : getCalendarStart(period);
  const out = [];
  for (const sym of assetList) {
    const klines = data[sym]?.klines;
    if (!klines || klines.length < 2) continue;
    const closes = klines.map(k => parseFloat(k[4]));
    const ts     = klines.map(k => k[0]);
    let si = ts.findIndex(t => t >= startTs);
    if (si < 0) si = ts.length - 1;
    const baseIdx = si > 0 ? si - 1 : si;
    const sc = closes.slice(baseIdx);
    const st = ts.slice(baseIdx);
    if (sc.length < 2) continue;
    const base = sc[0];
    const vals = sc.map(c => ((c / base) - 1) * 100);
    out.push({ sym, color: COMP_COLORS[sym] || '#888', name: sym.replace('USDT',''), fullName: ASSET_NAMES[sym] || '', vals, ts: st, cur: vals[vals.length - 1] });
  }
  return out;
}

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

  ctx.fillStyle = '#0b1728'; ctx.fillRect(0, 0, W, H);

  const ticks = compNiceTicks(minV, maxV, 6);
  ctx.font = '10px "JetBrains Mono",Consolas,monospace'; ctx.textAlign = 'right';
  ctx.setLineDash([3, 6]); ctx.lineWidth = 1;
  for (const t of ticks) {
    const y = yOf(t);
    if (y < pad.t - 4 || y > pad.t + cH + 4) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText((t >= 0 ? '+' : '') + t.toFixed(0) + '%', pad.l - 5, y + 3.5);
  }
  ctx.setLineDash([]);

  const y0 = yOf(0);
  if (y0 >= pad.t && y0 <= pad.t + cH) {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
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

  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + cH); ctx.lineTo(W - pad.r, pad.t + cH); ctx.stroke();

  const drawOrder = [...series].sort((a, b) => a.cur - b.cur);
  for (const s of drawOrder) {
    const tot = s.vals.length;
    ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
    ctx.lineJoin = 'round';
    for (let i = 0; i < tot; i++) { const x = xOf(i, tot), y = yOf(s.vals[i]); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(xOf(tot - 1, tot), yOf(s.vals[tot - 1]), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = s.color; ctx.fill();
  }
  ctx.globalAlpha = 1;
}

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
    const clr = dis ? '#2a3d52' : s.color;
    const fullNm = s.fullName || s.name;
    return `<div class="comp-leg-item${dis ? ' is-off' : ''}" data-sym="${s.sym}">
      <span class="comp-leg-bar" style="background:${clr}"></span>
      <div class="comp-leg-info">
        <span class="comp-leg-ticker">${s.name}</span>
        <span class="comp-leg-fullnm">${fullNm}</span>
      </div>
      <span class="comp-leg-pc ${s.cur >= 0 ? 'pos' : 'neg'}">${s.cur >= 0 ? '+' : ''}${s.cur.toFixed(1)}%</span>
    </div>`;
  }).join('');
  if (onToggle) {
    el.querySelectorAll('.comp-leg-item[data-sym]').forEach(item => {
      item.addEventListener('click', () => onToggle(item.dataset.sym));
    });
  }
}

function drawCompTable(data, period, activeAssets, tbodyId, thIds) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const fv = p => p >= 10000 ? p.toLocaleString('en',{maximumFractionDigits:0})
    : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p.toPrecision(4);
  const fpCell = (p, cls) => p == null
    ? `<td class="comp-na ${cls}">—</td>`
    : `<td class="comp-pc ${p >= 0 ? 'pos' : 'neg'} ${cls}">${p >= 0 ? '+' : ''}${p.toFixed(2)}%</td>`;
  const rankCls = r => r.rank <= 5 ? 'rank-gold' : r.rank <= 25 ? 'rank-silver' : 'rank-bronze';

  const rows = [];
  for (const sym of activeAssets) {
    const { klines, ticker } = data[sym] || {};
    if (!klines || klines.length < 2) continue;
    const closes = klines.map(k => parseFloat(k[4]));
    const last   = closes[closes.length - 1];
    const liveTkr = liveCompTickers?.[sym];
    const price  = parseFloat((liveTkr || ticker).lastPrice);
    const calBase = (p) => {
      const st = getCalendarStart(p);
      const si = klines.findIndex(k => k[0] >= st);
      if (si < 0) return null;
      return closes[si > 0 ? si - 1 : si];
    };
    const bWeek  = calBase('1w');
    const bMonth = calBase('1m');
    const bYear  = calBase('1y');
    const pWeek  = bWeek  != null ? ((last / bWeek)  - 1) * 100 : null;
    const pMonth = bMonth != null ? ((last / bMonth) - 1) * 100 : null;
    const pYear  = bYear  != null ? ((last / bYear)  - 1) * 100 : null;
    rows.push({
      sym, name: sym.replace('USDT',''),
      fullName: ASSET_NAMES[sym] || '',
      price, pWeek, pMonth, pYear,
      color: COMP_COLORS[sym] || '#888',
      rank:  CMC_RANKS[sym]   || 999,
      cat:   ASSET_CATS[sym]  || { cat: '—', cls: 'cat-default' }
    });
  }

  const sortMap = { '1w': 'pWeek', '1m': 'pMonth', '1y': 'pYear' };
  const sk = sortMap[period] || 'pMonth';
  rows.sort((a, b) => (b[sk] ?? -Infinity) - (a[sk] ?? -Infinity));

  tbody.innerHTML = rows.map((r, i) => `<tr class="${i % 2 ? 'alt' : ''}" data-sym="${r.sym}">
    <td class="td-rank"><span class="rank-badge ${rankCls(r)}">${r.rank}</span></td>
    <td class="td-asset"><div class="comp-asset-cell">
      <span class="comp-sw" style="background:${r.color};box-shadow:0 0 6px ${r.color}55"></span>
      <div class="comp-asset-info">
        <span class="comp-nm">${r.name}</span>
        <span class="comp-full-nm">${r.fullName}</span>
      </div>
    </div></td>
    <td class="td-cat"><span class="cat-badge ${r.cat.cls}">${r.cat.cat}</span></td>
    <td class="comp-price font-mono td-price">$${fv(r.price)}</td>
    ${fpCell(r.pWeek, 'td-week')}${fpCell(r.pMonth, 'td-month')}${fpCell(r.pYear, 'td-year')}
  </tr>`).join('');

  if (thIds) {
    [thIds.thWeek,thIds.thMonth,thIds.thYear].forEach(id => document.getElementById(id)?.classList.remove('sorted'));
    const activeThId = sk === 'pWeek' ? thIds.thWeek : sk === 'pMonth' ? thIds.thMonth : thIds.thYear;
    document.getElementById(activeThId)?.classList.add('sorted');
  }
}

function patchCompTablePrices(tickers) {
  const fv = p => p >= 10000 ? p.toLocaleString('en',{maximumFractionDigits:0})
    : p >= 100 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p.toPrecision(4);
  ['compTbody', 'compTbodyAI'].forEach(id => {
    const tbody = document.getElementById(id);
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-sym]').forEach(row => {
      const t = tickers[row.dataset.sym];
      if (!t) return;
      const price = parseFloat(t.lastPrice);
      const pc = row.querySelector('.td-price');
      if (pc) pc.textContent = '$' + fv(price);
    });
  });
}

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
    { thWeek:'thWeek', thMonth:'thMonth', thYear:'thYear' });
  updateDisabledBar();
}

function renderAIView() {
  if (!compData) return;
  const series = buildCompSeries(compData, AI_ASSETS, compPeriod);
  drawCompChart(series, 'perfChartAI', 'compLoadingAI');
  drawCompLegend(series, null, 'compLegendAI', null);
  drawCompTable(compData, compPeriod, AI_ASSETS, 'compTbodyAI',
    { thWeek:'thWeekAI', thMonth:'thMonthAI', thYear:'thYearAI' });
}

function renderCapView() {
  if (!compData) return;
  const assets = getCapTierAssets(compCapTier);
  const series = buildCompSeries(compData, assets, compPeriod);
  const def    = CAP_TIER_DEFS[compCapTier];
  drawCompChart(series, 'perfChartCap', 'compLoadingCap');
  drawCompLegend(series, null, 'compLegendCap', null);
  drawCompTable(compData, compPeriod, assets, 'compTbodyCap',
    { thWeek:'thWeekCap', thMonth:'thMonthCap', thYear:'thYearCap' });
  const sub = document.getElementById('capTierSub');
  if (sub && def) sub.textContent = `${def.label} · por capitalización de mercado`;
}

function renderCompViews() {
  if (compTab === 'global')     renderGlobalView();
  else if (compTab === 'ai')    renderAIView();
  else if (compTab === 'cap')   renderCapView();
}

async function updateComparisons() {
  if (compBusy) return;
  compBusy = true;
  ['compLoading','compLoadingAI','compLoadingCap'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'flex'; });
  try {
    if (!compData) compData = await fetchCompData();
    renderGlobalView();
    renderAIView();
    renderCapView();
  } finally { compBusy = false; }
}

document.querySelectorAll('.comp-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.comp-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    compTab = this.dataset.tab;
    document.getElementById('view-global').style.display = compTab === 'global' ? '' : 'none';
    document.getElementById('view-ai').style.display     = compTab === 'ai'     ? '' : 'none';
    document.getElementById('view-cap').style.display    = compTab === 'cap'    ? '' : 'none';
    document.getElementById('view-defi').style.display   = compTab === 'defi'   ? '' : 'none';
    document.getElementById('view-bears').style.display  = compTab === 'bears'  ? '' : 'none';
    if (compTab === 'defi') cargarDeFi();
    else if (compTab === 'bears') cargarBears();
    else if (compData) setTimeout(() => renderCompViews(), 50);
  });
});

document.querySelectorAll('.tier-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    compCapTier = this.dataset.tier;
    if (compData) renderCapView();
  });
});

(function initRangeSlider() {
  const slider = document.getElementById('compRangeSlider');
  const label  = document.getElementById('compRangeLabel');
  const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const now    = new Date();

  function updateLabel(p) {
    if (!label) return;
    if (compCustomDays === null) {
      const period = p || compPeriod;
      if (period === '1w') label.textContent = 'Semana actual';
      else if (period === '1m') label.textContent = MESES[now.getMonth()] + ' ' + now.getFullYear();
      else label.textContent = 'Año ' + now.getFullYear();
    } else {
      label.textContent = 'Últimos ' + compCustomDays + ' días';
    }
  }

  if (slider) {
    slider.addEventListener('input', function () {
      compCustomDays = parseInt(this.value);
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      updateLabel();
      if (compData) renderCompViews();
    });
  }

  // Single consolidated period-btn handler
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      compPeriod     = this.dataset.period;
      compCustomDays = null;
      if (slider) slider.value = compPeriod === '1w' ? 7 : compPeriod === '1m' ? 30 : 365;
      updateLabel(compPeriod);
      if (compData) renderCompViews();
    });
  });

  updateLabel();
})();

(function initPeriodLabels() {
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MESES_S = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now  = new Date();
  const mes  = MESES[now.getMonth()];
  const mesS = MESES_S[now.getMonth()];
  const yr   = now.getFullYear();

  document.querySelectorAll('.period-btn[data-period="1w"]').forEach(b => b.textContent = 'Semana');
  document.querySelectorAll('.period-btn[data-period="1m"]').forEach(b => b.textContent = mes);
  document.querySelectorAll('.period-btn[data-period="1y"]').forEach(b => b.textContent = yr);

  ['thWeek','thWeekAI','thWeekCap'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'Sem.'; });
  ['thMonth','thMonthAI','thMonthCap'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = mesS; });
  ['thYear','thYearAI','thYearCap'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = yr; });
})();

let _compResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_compResizeTimer);
  _compResizeTimer = setTimeout(() => {
    if (compData) renderCompViews();
    if (volData && !document.getElementById('panel-vol')?.classList.contains('panel-hidden')) renderVolumeChart();
  }, 160);
});

updateComparisons();
setInterval(async () => { compData = null; await updateComparisons(); }, 300_000);

/* ════════════════════════════════════════════════════════
   VOLUMEN BTC — Gráfico de Barras con Promedio Móvil
   ════════════════════════════════════════════════════════ */

let volData     = null;
let volMaPeriod = 20;
let volBusy     = false;

async function fetchBTCVolumeData() {
  const r = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90');
  if (!r.ok) throw new Error('vol fetch failed');
  return await r.json();
}

function calcVolSMA(arr, period, idx) {
  if (idx < period - 1) return null;
  let sum = 0;
  for (let i = idx - period + 1; i <= idx; i++) sum += arr[i];
  return sum / period;
}

async function updateVolumeView() {
  if (volBusy) return;
  volBusy = true;
  const loading = document.getElementById('volLoading');
  if (loading) loading.style.display = 'flex';
  try {
    if (!volData) volData = await fetchBTCVolumeData();
    renderVolumeChart();
  } catch (e) {
    console.error('vol fetch error:', e);
  } finally {
    volBusy = false;
    const l = document.getElementById('volLoading');
    if (l) l.style.display = 'none';
  }
}

function renderVolumeChart() {
  if (!volData) return;

  // Use last 60 of the fetched 90 days; extra days provide MA context at the start
  const raw       = volData.slice(-60);
  const allVols   = volData.map(k => parseFloat(k[7]));   // quote volume (USDT)
  const vols      = raw.map(k => parseFloat(k[7]));
  const dates     = raw.map(k => k[0]);
  const startIdx  = volData.length - 60;

  // Compute MA using full context so day 0 of the 60-day window has a valid MA
  const mas = vols.map((_, i) => calcVolSMA(allVols, volMaPeriod, startIdx + i));

  // Update the large % indicator
  const todayVol = vols[vols.length - 1];
  const todayMa  = mas[mas.length - 1];
  const pct      = todayMa ? ((todayVol - todayMa) / todayMa * 100) : 0;
  const fmtB     = v => v >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : (v / 1e6).toFixed(0) + 'M';
  const pctStr   = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  const subStr   = todayMa ? `Hoy: $${fmtB(todayVol)}  ·  MM${volMaPeriod}: $${fmtB(todayMa)}` : '';

  const pctEl        = document.getElementById('volPctValue');
  const subEl        = document.getElementById('volPctSub');
  const maDaysEl     = document.getElementById('volMaDays');
  const maPeriodLbl  = document.getElementById('volMaPeriodLabel');

  if (pctEl) { pctEl.textContent = pctStr; pctEl.className = 'vol-stat-value ' + (pct >= 0 ? 'vol-above' : 'vol-below'); }
  if (subEl) subEl.textContent = subStr;
  if (maDaysEl) maDaysEl.textContent = volMaPeriod + ' días';
  if (maPeriodLbl) maPeriodLbl.textContent = volMaPeriod;

  // Update dashboard volume strip
  const dvsPctEl  = document.getElementById('dvsPct');
  const dvsSubEl  = document.getElementById('dvsSub');
  const dvsMaLbl  = document.getElementById('dvsMaLabel');
  const dvsSlrVal = document.getElementById('dvsSliderVal');
  const dvsSlr    = document.getElementById('dvsSlider');
  if (dvsMaLbl)  dvsMaLbl.textContent  = volMaPeriod;
  if (dvsSlrVal) dvsSlrVal.textContent = volMaPeriod + 'D';
  if (dvsSlr)    dvsSlr.value          = volMaPeriod;
  if (dvsPctEl)  { dvsPctEl.textContent = pctStr; dvsPctEl.className = 'dvs-pct font-mono ' + (pct >= 0 ? 'up' : 'down'); }
  if (dvsSubEl)  dvsSubEl.textContent = subStr;

  // Update volume panel header badge
  const volPanelPct = document.getElementById('volPanelPct');
  if (volPanelPct) { volPanelPct.textContent = pctStr; volPanelPct.style.color = pct >= 0 ? 'var(--green)' : 'var(--red)'; }

  drawVolumeChart(vols, dates, mas);
}

function drawVolumeChart(vols, dates, mas) {
  const canvas = document.getElementById('volChart');
  if (!canvas) return;

  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W    = Math.max(Math.floor(rect.width), 300);
  const H    = Math.max(Math.floor(rect.height), 200);
  canvas.width  = W * dpr;  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#06101a';
  ctx.fillRect(0, 0, W, H);

  const pad   = { t: 28, b: 46, l: 70, r: 18 };
  const cW    = W - pad.l - pad.r;
  const cH    = H - pad.t - pad.b;
  const n     = vols.length;
  const maxV  = Math.max(...vols) * 1.08;
  const baseY = pad.t + cH;
  const xOf   = i => pad.l + (i + 0.5) * (cW / n);
  const yOf   = v => pad.t + cH - (v / maxV) * cH;

  // Grid + Y-axis labels
  const gridN = 4;
  ctx.font      = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign = 'right';
  ctx.setLineDash([3, 6]);
  ctx.lineWidth = 1;
  for (let g = 1; g <= gridN; g++) {
    const v = maxV * g / gridN;
    const y = yOf(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    const lbl = v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : (v / 1e6).toFixed(0) + 'M';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillText(lbl, pad.l - 6, y + 3);
  }
  ctx.setLineDash([]);

  // Baseline
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, baseY); ctx.lineTo(W - pad.r, baseY); ctx.stroke();

  // Bars — same green/red as RSI zone colours
  const barW = Math.max(2, (cW / n) * 0.72);
  vols.forEach((v, i) => {
    const ma    = mas[i];
    const above = ma !== null ? v >= ma : true;
    const x     = xOf(i) - barW / 2;
    const y     = yOf(v);
    const bH    = baseY - y;
    // fill with glow matching gauge zone colours
    if (above) {
      ctx.shadowColor = 'rgba(22,199,132,0.35)';
      ctx.fillStyle   = 'rgba(22,199,132,0.55)';
      ctx.strokeStyle = 'rgba(22,199,132,0.90)';
    } else {
      ctx.shadowColor = 'rgba(234,57,67,0.35)';
      ctx.fillStyle   = 'rgba(234,57,67,0.55)';
      ctx.strokeStyle = 'rgba(234,57,67,0.90)';
    }
    ctx.shadowBlur = 4;
    ctx.lineWidth  = 0.5;
    ctx.fillRect(x, y, barW, bH);
    ctx.strokeRect(x, y, barW, bH);
    ctx.shadowBlur = 0;
  });

  // MA line — amber glow matching EMA palette
  ctx.beginPath();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = 'rgba(234,179,8,0.6)';
  ctx.shadowBlur  = 8;
  let maStarted   = false;
  mas.forEach((ma, i) => {
    if (ma === null) return;
    const x = xOf(i), y = yOf(ma);
    if (!maStarted) { ctx.moveTo(x, y); maStarted = true; }
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  // X-axis date labels
  ctx.fillStyle  = 'rgba(255,255,255,0.22)';
  ctx.font       = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign  = 'center';
  const step     = Math.max(1, Math.floor(n / 8));
  for (let i = 0; i < n - 3; i += step) {
    const d = new Date(dates[i]);
    ctx.fillText(d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), xOf(i), baseY + 16);
  }
  ctx.textAlign = 'right';
  const dLast   = new Date(dates[n - 1]);
  ctx.fillText(dLast.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), xOf(n - 1) + barW / 2, baseY + 16);

  // MA legend
  const lgX = pad.l + 6, lgY = pad.t + 14;
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = 'rgba(234,179,8,0.5)';
  ctx.shadowBlur  = 6;
  ctx.beginPath(); ctx.moveTo(lgX, lgY); ctx.lineTo(lgX + 18, lgY); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle  = 'rgba(255,255,255,0.45)';
  ctx.font       = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign  = 'left';
  ctx.fillText('MM' + volMaPeriod, lgX + 22, lgY + 4);
}

// MA period sliders (Comparaciones + Dashboard strip — kept in sync)
(function initVolMaSliders() {
  function onPeriodChange(val) {
    volMaPeriod = parseInt(val);
    if (volData) renderVolumeChart();
  }
  const s1 = document.getElementById('volMaSlider');
  if (s1) s1.addEventListener('input', function () { onPeriodChange(this.value); });
  const s2 = document.getElementById('dvsSlider');
  if (s2) s2.addEventListener('input', function () { onPeriodChange(this.value); });
})();

updateVolumeView();
setInterval(() => { volData = null; updateVolumeView(); }, 300_000);

/* ════════════════════════════════════════════════════════
   GRÁFICOS MULTI-TF — Precio + EMAs (20, 50, 100, 200)
   ════════════════════════════════════════════════════════ */

let chartDisplayBars = 100;
const chartEMAVisible = { 20: true, 50: true, 100: true, 200: true };
let chartsData = {};
let chartsBusy = false;

async function fetchKlinesWithTS(tf) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${TF_INTERVAL[tf]}&limit=250`;
  const r   = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const raw = await r.json();
  return { closes: raw.map(k => parseFloat(k[4])), times: raw.map(k => k[0]) };
}

function calcEMAArray(closes, period) {
  const out  = [];
  const mult = 2 / (period + 1);
  let ema    = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (i === period - 1) { out.push(ema); continue; }
    ema = closes[i] * mult + ema * (1 - mult);
    out.push(ema);
  }
  return out;
}

async function updateMultiTFCharts() {
  if (chartsBusy) return;
  chartsBusy = true;
  ['15m','1h','4h','1d'].forEach(tf => { const el = document.getElementById(`chartLoad-${tf}`); if (el) el.style.display = 'flex'; });
  try {
    const tfs     = ['15m','1h','4h','1d'];
    const results = await Promise.allSettled(tfs.map(async tf => ({ tf, ...(await fetchKlinesWithTS(tf)) })));
    const symEl   = document.getElementById('chartsSym');
    if (symEl) symEl.textContent = SYMBOL.replace('USDT', '') + '/USDT';
    results.forEach(res => {
      if (res.status !== 'fulfilled') return;
      const { tf, closes, times } = res.value;
      chartsData[tf] = { closes, times };
      renderTFChart(tf, closes, times);
    });
  } finally {
    chartsBusy = false;
  }
}

function renderTFChart(tf, closes, times) {
  const n    = Math.min(chartDisplayBars, closes.length);
  const sl   = arr => arr.slice(-n);
  const ema20  = chartEMAVisible[20]  ? calcEMAArray(closes, 20)  : [];
  const ema50  = chartEMAVisible[50]  ? calcEMAArray(closes, 50)  : [];
  const ema100 = chartEMAVisible[100] ? calcEMAArray(closes, 100) : [];
  const ema200 = chartEMAVisible[200] ? calcEMAArray(closes, 200) : [];
  drawPriceEMAChart(`chartCanvas-${tf}`, sl(closes), sl(times), sl(ema20), sl(ema50), sl(ema100), sl(ema200), tf);
  const priceEl = document.getElementById(`chartPrice-${tf}`);
  if (priceEl) priceEl.textContent = formatPrice(closes[closes.length - 1]);
  const loadEl  = document.getElementById(`chartLoad-${tf}`);
  if (loadEl) loadEl.style.display = 'none';
}

function drawPriceEMAChart(canvasId, closes, times, ema20, ema50, ema100, ema200, tf) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const dpr  = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W    = Math.max(Math.floor(rect.width), 200);
  const H    = Math.max(Math.floor(rect.height), 150);
  canvas.width  = W * dpr;  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b1728';
  ctx.fillRect(0, 0, W, H);

  const pad = { t: 14, b: 38, l: 64, r: 10 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;
  const n   = closes.length;

  let minV = Math.min(...closes), maxV = Math.max(...closes);
  [ema20, ema50, ema100, ema200].forEach(arr => {
    arr.forEach(v => { if (v !== null) { minV = Math.min(minV, v); maxV = Math.max(maxV, v); } });
  });
  const rng = maxV - minV || 1;
  minV -= rng * 0.04;  maxV += rng * 0.04;

  const xOf = i => pad.l + (i / Math.max(n - 1, 1)) * cW;
  const yOf = v => pad.t + cH - ((v - minV) / (maxV - minV)) * cH;

  // Grid
  const ticks = compNiceTicks(minV, maxV, 5);
  ctx.font = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign = 'right';
  ctx.setLineDash([3, 6]);
  ctx.lineWidth = 1;
  ticks.forEach(t => {
    const y = yOf(t);
    if (y < pad.t - 2 || y > pad.t + cH + 2) return;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(formatPrice(t), pad.l - 4, y + 3);
  });
  ctx.setLineDash([]);

  function drawLine(arr, color, lw, glow) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = lw;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
    let started = false;
    arr.forEach((v, i) => {
      if (v === null) return;
      const x = xOf(i), y = yOf(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // EMAs behind (muted)
  drawLine(ema200, 'rgba(234,57,67,0.48)',  1.5, false);
  drawLine(ema100, 'rgba(245,158,11,0.48)', 1.5, false);
  drawLine(ema50,  'rgba(14,165,233,0.52)', 1.5, false);
  drawLine(ema20,  'rgba(22,199,132,0.52)', 1.5, false);
  // Price line on top — bright + glow
  drawLine(closes, '#e8edf2', 2, true);

  // X-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font      = '9px "JetBrains Mono",Consolas,monospace';
  ctx.textAlign = 'center';
  const useTF   = tf === '15m' || tf === '1h';
  const step    = Math.max(1, Math.floor(n / 6));
  for (let i = 0; i < n; i += step) {
    const d   = new Date(times[i]);
    const lbl = useTF ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    ctx.fillText(lbl, xOf(i), pad.t + cH + 14);
  }
  ctx.textAlign = 'right';
  const dL  = new Date(times[n - 1]);
  ctx.fillText(
    useTF ? dL.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : dL.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    W - pad.r, pad.t + cH + 14
  );
}

let _chartsResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_chartsResizeTimer);
  _chartsResizeTimer = setTimeout(() => {
    ['15m','1h','4h','1d'].forEach(tf => { const d = chartsData[tf]; if (d) renderTFChart(tf, d.closes, d.times); });
  }, 160);
});

// ─── FREE-FLOATING PANEL MANAGER ─────────────────────────
// Legacy vars kept for any residual references
const panelVisible = { charts: true, gauges: true, 'rsi-index': true, ema: true, vol: true };

(function initFloatingPanels() {
  const canvas = document.getElementById('dash-grid');
  if (!canvas) return;

  const G = 12, MIN_W = 280, MIN_H = 80;
  let zTop = 100;

  function cw() { return canvas.clientWidth || 1200; }

  const DEFAULTS = {
    'panel-charts':    () => ({ x: G,                           y: G,   w: Math.floor(cw()*0.60)-G, h: 490, visible: true, minimized: false }),
    'panel-gauges':    () => ({ x: Math.floor(cw()*0.61)+G,    y: G,   w: Math.floor(cw()*0.37)-G, h: 490, visible: true, minimized: false }),
    'panel-rsi-index': () => ({ x: G,                           y: 514, w: Math.floor(cw()*0.49)-G, h: 340, visible: true, minimized: false }),
    'panel-ema':       () => ({ x: Math.floor(cw()*0.50)+G/2,  y: 514, w: Math.floor(cw()*0.49)-G, h: 340, visible: true, minimized: false }),
    'panel-vol':       () => ({ x: G,                           y: 868, w: cw()-G*2,                h: 290, visible: true, minimized: false }),
  };

  function loadState(id)  { try { return JSON.parse(localStorage.getItem('sdash_fp_'+id)); } catch { return null; } }
  function saveState(p) {
    const min = p.classList.contains('panel-minimized');
    localStorage.setItem('sdash_fp_'+p.id, JSON.stringify({
      x: parseInt(p.style.left)||0, y: parseInt(p.style.top)||0,
      w: parseInt(p.style.width)||300,
      h: min ? (parseInt(p.dataset.savedH)||300) : (parseInt(p.style.height)||300),
      minimized: min, visible: !p.classList.contains('panel-hidden'),
    }));
  }

  function updateCanvasHeight() {
    let maxBottom = 800;
    canvas.querySelectorAll('.panel-block:not(.panel-hidden)').forEach(p => {
      const top = parseInt(p.style.top)||0;
      const h   = p.classList.contains('panel-minimized')
                ? (p.querySelector('.panel-hdr')?.offsetHeight||44)
                : (parseInt(p.style.height)||0);
      maxBottom = Math.max(maxBottom, top + h + G*4);
    });
    canvas.style.minHeight = maxBottom + 'px';
  }

  function bringToFront(p) { p.style.zIndex = ++zTop; }

  function triggerResize(p) {
    setTimeout(() => {
      const name = p.id.replace('panel-','');
      if (name==='charts')    ['15m','1h','4h','1d'].forEach(tf => { const d=chartsData[tf]; if(d) renderTFChart(tf,d.closes,d.times); });
      if (name==='vol' && volData) renderVolumeChart();
      if (name==='rsi-index') { const c=document.getElementById('rsiIndexChart'); if(c&&window._rsiIndexData) drawRSIIndexChart(window._rsiIndexData.avg,window._rsiIndexData.dates); }
    }, 30);
  }

  function setCtrlBtn(name, on) {
    document.querySelectorAll(`.dpc-btn[data-panel="${name}"]`).forEach(b => b.classList.toggle('active', on));
  }

  // ── Minimize ──────────────────────────────────────────
  function doMinimize(p) {
    const isMin = p.classList.contains('panel-minimized');
    const body  = p.querySelector('.panel-body');
    const btn   = p.querySelector('.panel-btn-min');
    if (isMin) {
      p.classList.remove('panel-minimized');
      if (body) body.style.display = '';
      if (p.dataset.savedH) p.style.height = p.dataset.savedH;
      if (btn) { btn.textContent='─'; btn.title='Minimizar'; }
    } else {
      if (p.classList.contains('panel-maximized')) doMaximize(p);
      p.dataset.savedH = p.style.height;
      p.classList.add('panel-minimized');
      if (body) body.style.display = 'none';
      p.style.height = 'auto';
      if (btn) { btn.textContent='▶'; btn.title='Restaurar'; }
    }
    saveState(p); updateCanvasHeight();
  }

  // ── Maximize ──────────────────────────────────────────
  function doMaximize(p) {
    const isMax = p.classList.contains('panel-maximized');
    const btn   = p.querySelector('.panel-btn-size');
    if (isMax) {
      p.classList.remove('panel-maximized');
      p.style.left=p.dataset.savedX; p.style.top=p.dataset.savedY;
      p.style.width=p.dataset.savedW; p.style.height=p.dataset.savedH;
      if (btn) { btn.textContent='⊞'; btn.title='Maximizar'; }
    } else {
      if (p.classList.contains('panel-minimized')) {
        p.classList.remove('panel-minimized');
        const body=p.querySelector('.panel-body'); if(body) body.style.display='';
        const mb=p.querySelector('.panel-btn-min'); if(mb){mb.textContent='─';mb.title='Minimizar';}
      }
      p.dataset.savedX=p.style.left; p.dataset.savedY=p.style.top;
      p.dataset.savedW=p.style.width; p.dataset.savedH=p.style.height;
      p.classList.add('panel-maximized');
      const viewH = window.innerHeight - canvas.getBoundingClientRect().top - 8;
      p.style.left='0px'; p.style.top='0px';
      p.style.width=canvas.clientWidth+'px'; p.style.height=Math.max(viewH,500)+'px';
      bringToFront(p);
      if (btn) { btn.textContent='⊟'; btn.title='Restaurar'; }
    }
    saveState(p); updateCanvasHeight(); triggerResize(p);
  }

  // ── Show / Hide ───────────────────────────────────────
  function doShow(name) {
    const p = document.getElementById('panel-'+name); if(!p) return;
    p.classList.remove('panel-hidden');
    setCtrlBtn(name, true); bringToFront(p);
    saveState(p); triggerResize(p);
  }
  function doHide(name) {
    const p = document.getElementById('panel-'+name); if(!p) return;
    p.classList.add('panel-hidden');
    setCtrlBtn(name, false);
    saveState(p); updateCanvasHeight();
  }

  // ── Build panel UI ────────────────────────────────────
  function addMinBtn(p) {
    const actions = p.querySelector('.panel-actions');
    if (!actions || actions.querySelector('.panel-btn-min')) return;
    const btn = document.createElement('button');
    btn.className='panel-btn panel-btn-min'; btn.textContent='─'; btn.title='Minimizar';
    actions.insertBefore(btn, actions.firstChild);
  }

  function addResizeHandles(p) {
    if (p.querySelector('.resize-handle')) return;
    ['n','s','e','w','ne','nw','se','sw'].forEach(dir => {
      const h = document.createElement('div');
      h.className=`resize-handle resize-${dir}`; h.dataset.dir=dir;
      p.appendChild(h);
    });
  }

  // ── Drag ──────────────────────────────────────────────
  function setupDrag(p) {
    p.querySelector('.panel-hdr')?.addEventListener('mousedown', e => {
      if (e.button!==0) return;
      if (e.target.closest('button,input,select,.gauge-asset-tabs')) return;
      if (p.classList.contains('panel-maximized')) return;
      e.preventDefault(); bringToFront(p);
      const sX=e.clientX, sY=e.clientY, oL=parseInt(p.style.left)||0, oT=parseInt(p.style.top)||0;
      p.classList.add('panel-dragging');
      const onMove = ev => {
        p.style.left = Math.max(0, oL+ev.clientX-sX)+'px';
        p.style.top  = Math.max(0, oT+ev.clientY-sY)+'px';
      };
      const onUp = () => {
        p.classList.remove('panel-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        saveState(p); updateCanvasHeight();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ── Resize ────────────────────────────────────────────
  function setupResize(p) {
    p.addEventListener('mousedown', e => {
      const handle = e.target.closest('.resize-handle'); if (!handle) return;
      if (p.classList.contains('panel-minimized')||p.classList.contains('panel-maximized')) return;
      e.preventDefault(); e.stopPropagation(); bringToFront(p);
      const dir=handle.dataset.dir, sX=e.clientX, sY=e.clientY;
      const oL=parseInt(p.style.left)||0, oT=parseInt(p.style.top)||0;
      const oW=parseInt(p.style.width)||300, oH=parseInt(p.style.height)||300;
      p.classList.add('panel-resizing');
      document.body.style.cursor=getComputedStyle(handle).cursor;
      document.body.style.userSelect='none';
      const onMove = ev => {
        const dx=ev.clientX-sX, dy=ev.clientY-sY;
        let l=oL,t=oT,w=oW,h=oH;
        if(dir.includes('e')) w=Math.max(MIN_W,oW+dx);
        if(dir.includes('s')) h=Math.max(MIN_H,oH+dy);
        if(dir.includes('w')){ w=Math.max(MIN_W,oW-dx); l=oL+(oW-w); }
        if(dir.includes('n')){ h=Math.max(MIN_H,oH-dy); t=oT+(oH-h); }
        p.style.left=Math.max(0,l)+'px'; p.style.top=Math.max(0,t)+'px';
        p.style.width=w+'px'; p.style.height=h+'px';
      };
      const onUp = () => {
        p.classList.remove('panel-resizing');
        document.body.style.cursor=''; document.body.style.userSelect='';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        saveState(p); updateCanvasHeight(); triggerResize(p);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ── Wire buttons ──────────────────────────────────────
  function setupButtons(p) {
    const name = p.id.replace('panel-','');
    p.querySelector('.panel-btn-min')?.addEventListener('click', e => { e.stopPropagation(); doMinimize(p); });
    const maxOld=p.querySelector('.panel-btn-size');
    if (maxOld) {
      const maxNew=maxOld.cloneNode(true);
      maxNew.textContent='⊞'; maxNew.title='Maximizar';
      maxNew.addEventListener('click', e => { e.stopPropagation(); doMaximize(p); });
      maxOld.replaceWith(maxNew);
    }
    const clsOld=p.querySelector('.panel-btn-close');
    if (clsOld) {
      const clsNew=clsOld.cloneNode(true);
      clsNew.addEventListener('click', e => { e.stopPropagation(); doHide(name); });
      clsOld.replaceWith(clsNew);
    }
  }

  // ── Apply state ───────────────────────────────────────
  function applyState(p, s) {
    p.style.left=s.x+'px'; p.style.top=s.y+'px';
    p.style.width=s.w+'px'; p.style.height=s.h+'px';
    const name=p.id.replace('panel-','');
    if (!s.visible) { p.classList.add('panel-hidden'); setCtrlBtn(name,false); }
    else setCtrlBtn(name, true);
    if (s.minimized) {
      p.dataset.savedH=s.h+'px'; p.classList.add('panel-minimized');
      const body=p.querySelector('.panel-body'); if(body) body.style.display='none';
      p.style.height='auto';
      const btn=p.querySelector('.panel-btn-min'); if(btn){btn.textContent='▶';btn.title='Restaurar';}
    }
  }

  // ── Control bar ───────────────────────────────────────
  document.querySelectorAll('.dpc-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const p=document.getElementById('panel-'+this.dataset.panel); if(!p) return;
      p.classList.contains('panel-hidden') ? doShow(this.dataset.panel) : doHide(this.dataset.panel);
    });
  });

  // ── Reset layout ──────────────────────────────────────
  document.querySelectorAll('[data-reset-layout]').forEach(btn => {
    btn.addEventListener('click', () => {
      canvas.querySelectorAll('.panel-block').forEach(p => {
        localStorage.removeItem('sdash_fp_'+p.id);
        p.classList.remove('panel-minimized','panel-maximized','panel-hidden');
        const body=p.querySelector('.panel-body'); if(body) body.style.display='';
        const st=(DEFAULTS[p.id]||DEFAULTS['panel-charts'])();
        applyState(p, st); bringToFront(p);
      });
      updateCanvasHeight();
    });
  });

  // ── Bootstrap ─────────────────────────────────────────
  canvas.querySelectorAll('.panel-block').forEach(p => {
    const state = loadState(p.id) || (DEFAULTS[p.id]||DEFAULTS['panel-charts'])();
    addMinBtn(p); addResizeHandles(p);
    applyState(p, state);
    setupDrag(p); setupResize(p); setupButtons(p);
    bringToFront(p);
  });

  updateCanvasHeight();

  window.addEventListener('resize', () => {
    canvas.querySelectorAll('.panel-block.panel-maximized').forEach(p => {
      p.style.width  = canvas.clientWidth+'px';
      p.style.height = Math.max(window.innerHeight-canvas.getBoundingClientRect().top-8, 500)+'px';
    });
  });
})();

// Bar count controls
document.querySelectorAll('.charts-bars-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.charts-bars-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    chartDisplayBars = parseInt(this.dataset.bars, 10);
    ['15m','1h','4h','1d'].forEach(tf => { const d = chartsData[tf]; if (d) renderTFChart(tf, d.closes, d.times); });
  });
});

// EMA toggle controls
document.querySelectorAll('.charts-ema-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const period = parseInt(this.dataset.ema, 10);
    chartEMAVisible[period] = !chartEMAVisible[period];
    this.classList.toggle('active', chartEMAVisible[period]);
    ['15m','1h','4h','1d'].forEach(tf => { const d = chartsData[tf]; if (d) renderTFChart(tf, d.closes, d.times); });
  });
});

updateMultiTFCharts();
setInterval(() => { chartsData = {}; updateMultiTFCharts(); }, 300_000);

/* ════════════════════════════════════════════════════════
   DOMINANCIA & MARKET CAP — CoinGecko Global
   ════════════════════════════════════════════════════════ */

async function fetchDominanceData() {
  const r = await fetch('https://api.coingecko.com/api/v3/global');
  if (!r.ok) throw new Error(`dominance HTTP ${r.status}`);
  return (await r.json()).data;
}

function applyDominanceBar(data) {
  const pct  = data.market_cap_percentage || {};
  const mcap = (data.total_market_cap || {}).usd || 0;

  const fmtPct = v => v != null ? v.toFixed(2) + '%' : '—';
  const fmtMC  = v => {
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9)  return '$' + (v / 1e9).toFixed(1) + 'B';
    return '$' + v.toFixed(0);
  };

  const set = (id, txt, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = txt;
    if (color) el.style.color = color;
  };

  set('domBTC',  fmtPct(pct.btc),  '#f7931a');
  set('domETH',  fmtPct(pct.eth),  '#627eea');
  set('domUSDT', fmtPct(pct.usdt), '#26a17b');
  set('domMCap', fmtMC(mcap),      '#e8edf2');

  const upd = document.getElementById('domUpdated');
  if (upd) upd.textContent = 'act. ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

async function updateDominance() {
  try {
    const data = await fetchDominanceData();
    applyDominanceBar(data);
  } catch (e) {
    console.warn('dominance fetch error:', e.message);
  }
}

updateDominance();
setInterval(updateDominance, 120_000); // cada 2 minutos (respeta rate-limit de CoinGecko)

/* ════════════════════════════════════════════════════════
   MERCADOS GLOBALES — Yahoo Finance
   ════════════════════════════════════════════════════════ */

const MARKET_GROUPS = [
  {
    label: 'Índices US',
    items: [
      { sym: '^GSPC', name: 'S&P 500'   },
      { sym: '^IXIC', name: 'NASDAQ'    },
      { sym: '^DJI',  name: 'Dow Jones' },
    ]
  },
  {
    label: 'Futuros',
    items: [
      { sym: 'ES=F', name: 'S&P Fut.' },
      { sym: 'NQ=F', name: 'NQ Fut.'  },
    ]
  },
  {
    label: 'Asia',
    items: [
      { sym: '^N225',     name: 'Nikkei 225' },
      { sym: '^HSI',      name: 'Hang Seng'  },
      { sym: '000001.SS', name: 'Shanghai'   },
    ]
  },
  {
    label: 'Commodities',
    items: [
      { sym: 'GC=F', name: 'Oro'     },
      { sym: 'CL=F', name: 'WTI Oil' },
    ]
  }
];

async function fetchOneMarket(item) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.sym)}?interval=1d&range=2d&includePrePost=false`;
  const tryProxy = async mkProxy => {
    const res = await fetchWithTimeout(mkProxy(url), 4000);
    if (!res.ok) throw new Error('not ok');
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('no meta');
    const price = meta.regularMarketPrice;
    const prev  = meta.chartPreviousClose ?? meta.previousClose;
    const chg   = (price != null && prev) ? ((price - prev) / prev) * 100 : null;
    return { sym: item.sym, price, chg };
  };
  try {
    return await Promise.any([
      tryProxy(u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`),
      tryProxy(u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`),
    ]);
  } catch {
    return { sym: item.sym, price: null, chg: null };
  }
}

function renderMarkets(bySymbol) {
  const grid  = document.getElementById('marketsGrid');
  const updEl = document.getElementById('marketsUpdated');
  if (!grid) return;

  const fmtPrice = n => {
    if (n == null) return '—';
    if (n >= 10000) return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtChg = n => {
    if (n == null) return { text: '—', cls: 'flat' };
    return { text: `${n > 0 ? '+' : ''}${n.toFixed(2)}%`, cls: n > 0 ? 'up' : n < 0 ? 'down' : 'flat' };
  };

  grid.innerHTML = MARKET_GROUPS.map(group => `
    <div class="markets-group">
      <span class="markets-group__label">${group.label}</span>
      <div class="markets-row">
        ${group.items.map(item => {
          const q = bySymbol[item.sym];
          const { text: chgText, cls: chgCls } = fmtChg(q?.chg);
          return `<div class="market-chip">
            <span class="market-chip__name">${item.name}</span>
            <span class="market-chip__price">${fmtPrice(q?.price)}</span>
            <span class="market-chip__chg ${chgCls}">${chgText}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');

  if (updEl) updEl.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const MKT_CACHE_KEY = 'sdash_mkt_v1';

async function updateMarkets() {
  const grid = document.getElementById('marketsGrid');
  // Show cache instantly while fetching
  try {
    const cached = JSON.parse(localStorage.getItem(MKT_CACHE_KEY) || 'null');
    if (cached?.bySymbol) renderMarkets(cached.bySymbol);
    else if (grid) grid.innerHTML = '<div class="markets-loading">Cargando mercados…</div>';
  } catch { if (grid) grid.innerHTML = '<div class="markets-loading">Cargando mercados…</div>'; }

  const allItems = MARKET_GROUPS.flatMap(g => g.items);
  const results  = await Promise.allSettled(allItems.map(fetchOneMarket));
  const bySymbol = {};
  results.forEach(r => { if (r.status === 'fulfilled') bySymbol[r.value.sym] = r.value; });
  if (Object.values(bySymbol).some(q => q.price != null)) {
    localStorage.setItem(MKT_CACHE_KEY, JSON.stringify({ bySymbol }));
    renderMarkets(bySymbol);
  } else if (!grid?.querySelector('.market-chip')) {
    if (grid) grid.innerHTML = '<div class="markets-error">No se pudieron obtener datos. Reintentando en 60s…</div>';
  }
}

updateMarkets();
setInterval(updateMarkets, 60_000);

/* ════════════════════════════════════════════════════════
   ACTUALIDAD — RSS Multi-Feed (Cripto / Globales / Argentinas)
   ════════════════════════════════════════════════════════ */


const NEWS_CATEGORIES = {
  cripto: {
    feeds: [
      { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk',      color: '#F7931A' },
      { url: 'https://cointelegraph.com/rss',                   name: 'Cointelegraph', color: '#3AB0FF' },
      { url: 'https://decrypt.co/feed',                         name: 'Decrypt',       color: '#5CC8D6' }
    ],
    loaded: false
  },
  globales: {
    feeds: [
      { url: 'https://feeds.reuters.com/Reuters/worldNews',      name: 'Reuters',      color: '#FF8000' },
      { url: 'http://feeds.bbci.co.uk/news/world/rss.xml',       name: 'BBC',          color: '#BB1919' },
      { url: 'https://www.theguardian.com/world/rss',            name: 'The Guardian', color: '#005689' }
    ],
    loaded: false
  },
  argentinas: {
    feeds: [
      { url: 'https://www.infobae.com/feeds/rss/',               name: 'Infobae',      color: '#E31E24' },
      { url: 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/', name: 'La Nación',  color: '#004A8F' },
      { url: 'https://www.clarin.com/rss/ultimas-noticias/',     name: 'Clarín',       color: '#D4003C' }
    ],
    loaded: false
  }
};

let activeNewsCat = 'cripto';

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
}

function parseRSSXml(text, feed) {
  const xml = new DOMParser().parseFromString(text, 'text/xml');
  return Array.from(xml.querySelectorAll('item')).slice(0, 12).map(it => {
    const linkEl = it.querySelector('link');
    const link   = linkEl?.textContent?.trim() || linkEl?.getAttribute('href')
                || it.querySelector('guid')?.textContent?.trim() || '';
    return {
      title:  it.querySelector('title')?.textContent?.trim() || '',
      link,
      date:   new Date(it.querySelector('pubDate')?.textContent?.trim() || ''),
      source: feed.name,
      color:  feed.color
    };
  }).filter(n => n.title && n.link && !isNaN(n.date.getTime()));
}

async function fetchFeed(feed) {
  // Try rss2json + both CORS proxies in parallel — fastest wins
  const tryRss2json = async () => {
    const res = await fetchWithTimeout(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=12`, 4000
    );
    if (!res.ok) throw new Error('fail');
    const data = await res.json();
    if (data.status !== 'ok' || !data.items?.length) throw new Error('empty');
    return data.items.map(item => ({
      title:  item.title?.trim() || '',
      link:   item.link?.trim() || item.guid?.trim() || '',
      date:   new Date(item.pubDate || ''),
      source: feed.name,
      color:  feed.color
    })).filter(n => n.title && n.link && !isNaN(n.date.getTime()));
  };

  const tryProxy = async mkProxy => {
    const res = await fetchWithTimeout(mkProxy(feed.url), 4000);
    if (!res.ok) throw new Error('fail');
    const items = parseRSSXml(await res.text(), feed);
    if (!items.length) throw new Error('empty');
    return items;
  };

  try {
    return await Promise.any([
      tryRss2json(),
      tryProxy(u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`),
      tryProxy(u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`),
    ]);
  } catch {
    return [];
  }
}

function newsTimeAgo(date) {
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1)    return 'ahora';
  if (m < 60)   return `hace ${m}m`;
  if (m < 1440) return `hace ${Math.floor(m / 60)}h`;
  return `hace ${Math.floor(m / 1440)}d`;
}

function renderNewsGrid(cat, items) {
  const grid  = document.getElementById(`newsGrid-${cat}`);
  const updEl = document.getElementById('newsUpdated');
  if (!grid) return;
  if (items.length === 0) {
    grid.innerHTML = '<div class="news-placeholder">No se pudieron cargar las noticias.</div>';
    return;
  }
  grid.innerHTML = items.map(n => `
    <a class="news-card" href="${n.link}" target="_blank" rel="noopener noreferrer" style="border-top-color:${n.color}">
      <span class="news-card__src" style="color:${n.color}">${n.source}</span>
      <p class="news-card__title">${n.title}</p>
      <div class="news-card__foot">
        <span class="news-card__time">${newsTimeAgo(n.date)}</span>
        <span class="news-card__arr">↗</span>
      </div>
    </a>`).join('');
  if (cat === activeNewsCat && updEl)
    updEl.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

async function loadNewsCategory(cat) {
  const catData = NEWS_CATEGORIES[cat];
  const grid    = document.getElementById(`newsGrid-${cat}`);
  if (!grid) return;
  // Show cache instantly
  const cacheKey = `sdash_news_${cat}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached?.items?.length) {
      renderNewsGrid(cat, cached.items.map(n => ({ ...n, date: new Date(n.date) })));
    } else {
      grid.innerHTML = '<div class="news-placeholder">Cargando noticias…</div>';
    }
  } catch { grid.innerHTML = '<div class="news-placeholder">Cargando noticias…</div>'; }

  const settled = await Promise.allSettled(catData.feeds.map(fetchFeed));
  const all     = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const items   = all.sort((a, b) => b.date - a.date).slice(0, 6);
  catData.loaded = true;
  if (items.length) {
    localStorage.setItem(cacheKey, JSON.stringify({ items: items.map(n => ({ ...n, date: n.date.toISOString() })) }));
    renderNewsGrid(cat, items);
  } else if (!grid.querySelector('.news-card')) {
    renderNewsGrid(cat, []);
  }
}

function switchNewsTab(cat) {
  activeNewsCat = cat;
  document.querySelectorAll('.news-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  Object.keys(NEWS_CATEGORIES).forEach(c => {
    const grid = document.getElementById(`newsGrid-${c}`);
    if (grid) grid.classList.toggle('news-grid--hidden', c !== cat);
  });
  if (!NEWS_CATEGORIES[cat].loaded) loadNewsCategory(cat);
  const updEl = document.getElementById('newsUpdated');
  if (updEl && NEWS_CATEGORIES[cat].loaded)
    updEl.textContent = '';
}

document.querySelectorAll('.news-tab').forEach(btn => {
  btn.addEventListener('click', () => switchNewsTab(btn.dataset.cat));
});

loadNewsCategory('cripto');
setInterval(() => loadNewsCategory(activeNewsCat), 2 * 60_000);

/* ════════════════════════════════════════════════════════
   COMPARACIONES — DeFi Charts (DefiLlama + CoinGecko)
   ════════════════════════════════════════════════════════ */

const DEFI_COLORS = {
  aave:  { border: '#B6509E', bg: 'rgba(182,80,158,0.15)' },
  uni:   { border: '#FF007A', bg: 'rgba(255,0,122,0.15)'  },
  lido:  { border: '#00A3FF', bg: 'rgba(0,163,255,0.15)'  },
  curve: { border: '#FFCC00', bg: 'rgba(255,204,0,0.15)'  },
};

let defiLoaded = false;
let bearLoaded = false;

async function cargarDeFi() {
  if (defiLoaded) return;
  try {
    await Promise.all([cargarDefiTVL(), cargarDefiRatio(), cargarDefiDominancia(), cargarDefiFees()]);
    defiLoaded = true;
  } catch (e) {
    const el = document.getElementById('defiLoading');
    if (el) { el.textContent = 'Error cargando datos DeFi.'; el.style.display = 'flex'; }
  }
}

async function cargarDefiTVL() {
  const loadingEl = document.getElementById('defiLoading');
  if (loadingEl) loadingEl.style.display = 'flex';
  const [aave, uni, lido, curve] = await Promise.all([
    fetch('https://api.llama.fi/protocol/aave').then(r => r.json()),
    fetch('https://api.llama.fi/protocol/uniswap').then(r => r.json()),
    fetch('https://api.llama.fi/protocol/lido').then(r => r.json()),
    fetch('https://api.llama.fi/protocol/curve').then(r => r.json()),
  ]);
  if (loadingEl) loadingEl.style.display = 'none';
  const recortar = arr => (arr || []).slice(-365);
  const labels = recortar(aave.tvl).map(d =>
    new Date(d.date * 1000).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
  );
  const gridColor = 'rgba(255,255,255,0.05)';
  new Chart(document.getElementById('defiTvlChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'AAVE',  data: recortar(aave.tvl).map(d => (d.totalLiquidityUSD / 1e9).toFixed(2)),  borderColor: DEFI_COLORS.aave.border,  backgroundColor: DEFI_COLORS.aave.bg,  fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'UNI',   data: recortar(uni.tvl).map(d => (d.totalLiquidityUSD / 1e9).toFixed(2)),   borderColor: DEFI_COLORS.uni.border,   backgroundColor: DEFI_COLORS.uni.bg,   fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'LIDO',  data: recortar(lido.tvl).map(d => (d.totalLiquidityUSD / 1e9).toFixed(2)),  borderColor: DEFI_COLORS.lido.border,  backgroundColor: DEFI_COLORS.lido.bg,  fill: true, tension: 0.3, pointRadius: 0 },
        { label: 'CURVE', data: recortar(curve.tvl).map(d => (d.totalLiquidityUSD / 1e9).toFixed(2)), borderColor: DEFI_COLORS.curve.border, backgroundColor: DEFI_COLORS.curve.bg, fill: true, tension: 0.3, pointRadius: 0 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#a0aec0', boxWidth: 12 } } },
      scales: {
        x: { ticks: { color: '#6b7280', maxTicksLimit: 12 }, grid: { color: gridColor } },
        y: { ticks: { color: '#6b7280', callback: v => '$' + v + 'B' }, grid: { color: gridColor } },
      }
    }
  });
}

async function cargarDefiRatio() {
  const [protocolos, precios] = await Promise.all([
    fetch('https://api.llama.fi/protocols').then(r => r.json()),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=aave,uniswap,lido-dao,curve-dao-token&vs_currencies=usd&include_market_cap=true').then(r => r.json()),
  ]);
  const getTVL = nombre => protocolos.find(p => p.name.toLowerCase() === nombre)?.tvl || 1;
  const datos = [
    { label: 'AAVE',  ratio: (precios.aave?.usd_market_cap / getTVL('aave')).toFixed(2),                    color: DEFI_COLORS.aave.border  },
    { label: 'UNI',   ratio: (precios.uniswap?.usd_market_cap / getTVL('uniswap')).toFixed(2),              color: DEFI_COLORS.uni.border   },
    { label: 'LIDO',  ratio: (precios['lido-dao']?.usd_market_cap / getTVL('lido')).toFixed(2),             color: DEFI_COLORS.lido.border  },
    { label: 'CURVE', ratio: (precios['curve-dao-token']?.usd_market_cap / getTVL('curve')).toFixed(2),     color: DEFI_COLORS.curve.border },
  ];
  new Chart(document.getElementById('defiRatioChart'), {
    type: 'bar',
    data: {
      labels: datos.map(d => d.label),
      datasets: [{ label: 'MC / TVL', data: datos.map(d => d.ratio), backgroundColor: datos.map(d => d.color), borderRadius: 8 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' Ratio: ' + ctx.raw } } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#a0aec0', font: { size: 13 } }, grid: { display: false } },
      }
    }
  });
}

async function cargarDefiDominancia() {
  const protocolos = await fetch('https://api.llama.fi/protocols').then(r => r.json());
  const getTVL = nombre => protocolos.find(p => p.name.toLowerCase() === nombre)?.tvl || 0;
  const tvls = [
    { label: 'AAVE',  tvl: getTVL('aave'),    color: DEFI_COLORS.aave.border  },
    { label: 'UNI',   tvl: getTVL('uniswap'), color: DEFI_COLORS.uni.border   },
    { label: 'LIDO',  tvl: getTVL('lido'),    color: DEFI_COLORS.lido.border  },
    { label: 'CURVE', tvl: getTVL('curve'),   color: DEFI_COLORS.curve.border },
  ];
  new Chart(document.getElementById('defiDominanciaChart'), {
    type: 'doughnut',
    data: {
      labels: tvls.map(d => d.label),
      datasets: [{ data: tvls.map(d => (d.tvl / 1e9).toFixed(2)), backgroundColor: tvls.map(d => d.color), borderColor: 'rgba(255,255,255,0.08)', borderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a0aec0', font: { size: 13 } } },
        tooltip: { callbacks: { label: ctx => ' $' + ctx.raw + 'B TVL' } },
      }
    }
  });
}

async function cargarDefiFees() {
  const data = await fetch('https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true').then(r => r.json());
  const buscar = nombre => data.protocols?.find(p => p.name.toLowerCase().includes(nombre));
  const protocolos = [
    { label: 'AAVE',  data: buscar('aave'),    color: DEFI_COLORS.aave.border  },
    { label: 'UNI',   data: buscar('uniswap'), color: DEFI_COLORS.uni.border   },
    { label: 'LIDO',  data: buscar('lido'),    color: DEFI_COLORS.lido.border  },
    { label: 'CURVE', data: buscar('curve'),   color: DEFI_COLORS.curve.border },
  ];
  new Chart(document.getElementById('defiFeesChart'), {
    type: 'bar',
    data: {
      labels: ['Fees 24h', 'Fees 7d', 'Fees 30d'],
      datasets: protocolos.map(p => ({
        label: p.label,
        data: [((p.data?.total24h || 0) / 1e6).toFixed(2), ((p.data?.total7d || 0) / 1e6).toFixed(2), ((p.data?.total30d || 0) / 1e6).toFixed(2)],
        backgroundColor: p.color, borderRadius: 6,
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#a0aec0', boxWidth: 12 } } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#6b7280', callback: v => '$' + v + 'M' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      }
    }
  });
}

/* ════════════════════════════════════════════════════════
   COMPARACIONES — Bear Markets BTC (Binance API)
   ════════════════════════════════════════════════════════ */

const BEAR_MARKETS = [
  { label: 'Bear 2017-2018', inicio: '2017-12-17', fin: '2018-12-15', color: '#FF6B6B' },
  { label: 'Bear 2021-2022', inicio: '2021-11-09', fin: '2022-11-09', color: '#FFA500' },
  { label: 'Actual 2025-?',  inicio: '2025-10-06', fin: null,         color: '#00E5FF' },
];

async function getBTCPrices(inicio, fin) {
  const startMs = new Date(inicio).getTime();
  const endMs   = fin ? new Date(fin).getTime() : Date.now();
  const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1000`;
  const data = await fetch(url).then(r => r.json());
  return data.map(k => parseFloat(k[4]));
}

function calcBearDrop(precios) {
  const base = precios[0];
  return precios.map(p => parseFloat(((p - base) / base * 100).toFixed(2)));
}

function stdDev(vals) {
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  const varianza = vals.reduce((a, b) => a + Math.pow(b - media, 2), 0) / vals.length;
  return { media, desv: Math.sqrt(varianza) };
}

let bearChartInstance = null;

async function cargarBears() {
  if (bearLoaded) return;
  const loadingEl = document.getElementById('bearLoading');
  if (loadingEl) loadingEl.style.display = 'flex';

  try {
    const datasets   = [];
    const duraciones = [];
    let maxDias = 0;

    for (const bear of BEAR_MARKETS) {
      const precios = await getBTCPrices(bear.inicio, bear.fin);
      const caidas  = calcBearDrop(precios);
      const dias    = caidas.length;
      if (bear.fin) duraciones.push(dias);
      if (dias > maxDias) maxDias = dias;
      datasets.push({
        label: bear.label,
        data: caidas,
        borderColor: bear.color,
        backgroundColor: 'transparent',
        borderWidth: bear.fin ? 2 : 3,
        borderDash: bear.fin ? [] : [6, 3],
        pointRadius: 0,
        tension: 0.3,
      });
    }

    const { media, desv } = stdDev(duraciones);
    const limMin = Math.round(media - desv);
    const limMax = Math.round(media + desv);
    const diasActual = Math.round((Date.now() - new Date('2025-10-06').getTime()) / 86400000);

    // Zona esperada (banda sombreada)
    datasets.push({
      label: `Zona esperada (${limMin}–${limMax} días)`,
      data: Array.from({ length: maxDias }, (_, i) => (i >= limMin && i <= limMax) ? 10 : null),
      borderColor: 'rgba(88,166,255,0)',
      backgroundColor: 'rgba(88,166,255,0.08)',
      fill: true,
      pointRadius: 0,
      borderWidth: 0,
    });

    // Punto día actual
    datasets.push({
      label: `Hoy (día ${diasActual})`,
      data: Array.from({ length: maxDias }, (_, i) => i === diasActual ? 0 : null),
      borderColor: '#00FF99',
      backgroundColor: '#00FF99',
      pointRadius: Array.from({ length: maxDias }, (_, i) => i === diasActual ? 7 : 0),
      borderWidth: 2,
      showLine: false,
    });

    const labels = Array.from({ length: maxDias }, (_, i) => `Día ${i + 1}`);

    if (loadingEl) loadingEl.style.display = 'none';

    if (bearChartInstance) bearChartInstance.destroy();
    bearChartInstance = new Chart(document.getElementById('bearChart'), {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#a0aec0', font: { size: 12 }, boxWidth: 14 } },
          tooltip: { callbacks: { label: ctx => ctx.raw !== null ? ` ${ctx.dataset.label}: ${ctx.raw}%` : '' } },
        },
        scales: {
          x: { ticks: { color: '#6b7280', maxTicksLimit: 15 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#a0aec0', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        },
      },
    });

    document.getElementById('bearPromDias').textContent   = Math.round(media) + ' días';
    document.getElementById('bearDesv').textContent       = '± ' + Math.round(desv) + ' días';
    document.getElementById('bearDiasActual').textContent = diasActual + ' días';
    document.getElementById('bearPct').textContent        = Math.round(diasActual / media * 100) + '%';

    bearLoaded = true;
  } catch (e) {
    if (loadingEl) { loadingEl.textContent = 'Error cargando datos.'; loadingEl.style.display = 'flex'; }
  }
}

/* ════════════════════════════════════════════════════════
   PANEL RESIZE OBSERVER — responsive content + canvas redraw
   ════════════════════════════════════════════════════════ */
(function initPanelResizeObserver() {
  if (!window.ResizeObserver) return;

  const DEBOUNCE = 80;
  const timers   = {};

  // Breakpoints based on panel body width
  function psize(w) {
    if (w < 300) return 'xs';
    if (w < 480) return 'sm';
    if (w < 700) return 'md';
    return 'lg';
  }

  function redrawPanel(name) {
    if (name === 'charts')
      ['15m','1h','4h','1d'].forEach(tf => { const d = chartsData[tf]; if (d) renderTFChart(tf, d.closes, d.times); });
    if (name === 'vol' && volData)
      renderVolumeChart();
    if (name === 'rsi-index' && window._rsiIndexData)
      drawRSIIndexChart(window._rsiIndexData.avg, window._rsiIndexData.dates);
  }

  const ro = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const body  = entry.target;
      const panel = body.closest('.panel-block');
      if (!panel) return;

      const w    = Math.round(entry.contentRect.width);
      const size = psize(w);

      // Update CSS breakpoint attribute
      if (panel.dataset.psize !== size) panel.dataset.psize = size;

      // Debounce canvas redraw on every resize
      const id = panel.id;
      clearTimeout(timers[id]);
      timers[id] = setTimeout(() => redrawPanel(id.replace('panel-', '')), DEBOUNCE);
    });
  });

  // Observe every panel body
  document.querySelectorAll('#dash-grid .panel-block').forEach(panel => {
    const body = panel.querySelector('.panel-body');
    if (body) {
      // Set initial size attribute
      panel.dataset.psize = psize(body.getBoundingClientRect().width || panel.clientWidth);
      ro.observe(body);
    }
  });
})();
