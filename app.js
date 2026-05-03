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
const R_OUT = 84, R_IN = 58, R_NDL = 76, R_NDL_BASE = 12;

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
function rsiAngle(rsi) { return 180 - (Math.max(0, Math.min(100, rsi)) / 100) * 180; }

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

  const defs = el('defs');
  defs.innerHTML = `
    <filter id="glow-${id}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glow-sm-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="hub-grad-${id}" cx="50%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#2e4055"/>
      <stop offset="100%" stop-color="#08111c"/>
    </radialGradient>
  `;
  svg.appendChild(defs);

  // Dark background fill
  svg.appendChild(el('path', {
    d: donutArc(R_OUT + 3, R_IN - 3, 180, 0),
    fill: '#07111f'
  }));

  // Outer border ring
  svg.appendChild(el('path', {
    d: donutArc(R_OUT + 3, R_OUT + 1, 180, 0),
    fill: 'none', stroke: '#1a2d3e', 'stroke-width': '1.2'
  }));

  // Zone color segments
  ZONE_SEGS.forEach(z => {
    const a1 = rsiAngle(z.rsi0), a2 = rsiAngle(z.rsi1);
    svg.appendChild(el('path', {
      d: donutArc(R_OUT, R_IN, a1, a2),
      fill: z.color, opacity: z.opacity + 0.05
    }));
  });

  // Active fill (RSI 0 → current) — updated each frame
  svg.appendChild(el('path', {
    class: 'g-active-arc',
    d: '', fill: 'rgba(255,255,255,0.05)', opacity: '0'
  }));

  // Active outer edge glow
  svg.appendChild(el('path', {
    class: 'g-active-stroke',
    d: '', fill: 'none',
    stroke: '#ffffff', 'stroke-width': '1.5', opacity: '0',
    filter: `url(#glow-sm-${id})`
  }));

  // Tick marks
  [0, 10, 20, 26, 30, 40, 50, 60, 70, 74, 80, 90, 100].forEach(rsi => {
    const isMajor = [0, 26, 50, 74, 100].includes(rsi);
    const ang   = rsiAngle(rsi);
    const outer = p2c(CX, CY, R_OUT + 3, ang);
    const inner = p2c(CX, CY, R_OUT - (isMajor ? 4 : 1), ang);
    svg.appendChild(el('line', {
      x1: f(outer.x), y1: f(outer.y), x2: f(inner.x), y2: f(inner.y),
      stroke: isMajor ? '#2e4a62' : '#18283a',
      'stroke-width': isMajor ? '1.5' : '0.8'
    }));
  });

  // Needle glow
  svg.appendChild(el('line', {
    class: 'g-needle-glow',
    x1: f(CX), y1: f(CY), x2: f(CX), y2: f(CY - R_NDL),
    stroke: '#ffffff', 'stroke-width': '5', 'stroke-linecap': 'round',
    opacity: '0.10', filter: `url(#glow-${id})`
  }));

  // Needle
  svg.appendChild(el('line', {
    class: 'g-needle',
    x1: f(p2c(CX, CY, R_NDL_BASE, 270).x), y1: f(p2c(CX, CY, R_NDL_BASE, 270).y),
    x2: f(CX), y2: f(CY - R_NDL),
    stroke: '#c8d8e8', 'stroke-width': '1.5', 'stroke-linecap': 'round',
    filter: `url(#glow-sm-${id})`
  }));

  // Needle tip dot
  svg.appendChild(el('circle', {
    class: 'g-needle-tip',
    cx: f(CX), cy: f(CY - R_NDL), r: '2.5',
    fill: '#ffffff', opacity: '0.85',
    filter: `url(#glow-sm-${id})`
  }));

  // Center hub
  svg.appendChild(el('circle', {
    cx: CX, cy: CY, r: '10',
    fill: `url(#hub-grad-${id})`, stroke: '#1e3248', 'stroke-width': '1.2'
  }));
  svg.appendChild(el('circle', {
    class: 'g-center-dot',
    cx: CX, cy: CY, r: '4',
    fill: '#3a5068'
  }));

  // RSI value — large, centered inside the arc
  const valT = el('text', {
    class: 'g-val-text',
    x: CX, y: CY - 22,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: '#4a6070',
    'font-size': '28',
    'font-family': '"JetBrains Mono",Consolas,monospace',
    'font-weight': '700',
    'letter-spacing': '-1'
  });
  valT.textContent = '—';
  svg.appendChild(valT);
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

  // Update SVG internals: active arc fill + value text + needle tip color
  const svgEl = document.getElementById(`gauge-${tf}`);
  if (svgEl) {
    const arcFill   = svgEl.querySelector('.g-active-arc');
    const arcStroke = svgEl.querySelector('.g-active-stroke');
    const valText   = svgEl.querySelector('.g-val-text');
    const tipDot    = svgEl.querySelector('.g-needle-tip');

    if (rsi > 0.5) {
      const arcPath = donutArc(R_OUT, R_IN, 180, rsiAngle(Math.max(0.5, rsi)));
      if (arcFill) {
        arcFill.setAttribute('d', arcPath);
        arcFill.setAttribute('fill', color + '1e');
        arcFill.setAttribute('opacity', '1');
      }
      if (arcStroke) {
        arcStroke.setAttribute('d', donutArc(R_OUT + 0.5, R_OUT - 0.5, 180, rsiAngle(Math.max(0.5, rsi))));
        arcStroke.setAttribute('stroke', color);
        arcStroke.setAttribute('opacity', '0.7');
      }
    } else {
      if (arcFill)   arcFill.setAttribute('opacity', '0');
      if (arcStroke) arcStroke.setAttribute('opacity', '0');
    }

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
    await Promise.all([updateAllData(), updatePrice()]);
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
    if (compData) setTimeout(() => renderCompViews(), 50);
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
  _compResizeTimer = setTimeout(() => { if (compData) renderCompViews(); }, 160);
});

updateComparisons();
setInterval(async () => { compData = null; await updateComparisons(); }, 300_000);

/* ════════════════════════════════════════════════════════
   NOTICIAS — RSS Multi-Feed
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
  const grid    = document.getElementById('newsGrid');
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
