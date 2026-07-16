/* ============================================================
   app.js — Stage config, view switching, URL routing, DB init
   ============================================================ */

/* ── Stage configuration ─────────────────────────────────────────────────── */

const STAGE_CONFIG = {
  agar:       { label: 'Agar / Petri',        prefix: 'AGAR',  icon: '🧫', badgeClass: 'badge-agar',       sub: 'Plate preparation' },
  lc:         { label: 'Liquid Culture',       prefix: 'LC',    icon: '🧪', badgeClass: 'badge-lc',         sub: 'LC preparation' },
  grain:      { label: 'Grain Spawn',          prefix: 'GRAIN', icon: '🌾', badgeClass: 'badge-grain',      sub: 'Inoculation' },
  substrate:  { label: 'Substrate & Fruiting', prefix: 'SUB',   icon: '🍄', badgeClass: 'badge-substrate',  sub: 'Fruiting & harvest' },
  drying:     { label: 'Drying & Storage',     prefix: 'DRY',   icon: '☀️', badgeClass: 'badge-drying',     sub: 'Post-harvest' },
  extraction: { label: 'Extraction',           prefix: 'EXT',   icon: '⚗️', badgeClass: 'badge-extraction', sub: 'Water & alcohol' },
};

/* ── Species list (shared across all forms) ──────────────────────────────── */

const SPECIES_LIST = [
  "Lion's Mane - Hericium Erinaceus",
  "Turkey Tail - Trametes Versicolor",
  "Reishi - Ganoderma Lucidum",
  "Chaga - Inonotus Obliquus",
  "Chestnut - Pholiota Adiposa",
  "Pink Oyster - Pleurotus Djamor",
  "Pink Oyster - Pleurotus Salmonestramineus",
  "Blue Oyster - Pleurotus Columbinus",
  "Golden Oyster - Pleurotus Citrinopileatus",
  "Branched Oyster - Pleurotus Cornucopiae",
  "Other",
];

function speciesSelect(id) {
  const opts = SPECIES_LIST.map(s => `<option value="${s}">${s}</option>`).join('');
  return `<select id="${id}"><option value="">Select species...</option>${opts}</select>`;
}

/* ── View switching ──────────────────────────────────────────────────────── */

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  const tabMap = { home: 0, form: 0, success: 0, qr: 1, records: 2, detail: 2, reports: 3 };
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const idx = tabMap[name];
  if (idx !== undefined) document.querySelectorAll('.nav-tab')[idx]?.classList.add('active');

  if (name === 'home')    updateCounts();
  if (name === 'records') renderRecords('all');
}

/* ── Home stage counts ───────────────────────────────────────────────────── */

function updateCounts() {
  const all = getRecords();
  Object.keys(STAGE_CONFIG).forEach(stage => {
    const n  = all.filter(r => r.stage === stage).length;
    const el = document.getElementById('cnt-' + stage);
    if (el) el.textContent = n + (n === 1 ? ' record' : ' records');
  });
}

/* ── URL routing — QR scan opens correct form ────────────────────────────── */

function routeFromURL() {
  const p     = new URLSearchParams(window.location.search);
  const stage = p.get('stage');
  const id    = p.get('id');
  if (stage && STAGE_CONFIG[stage]) openForm(stage, id || undefined);
}

/* ── Initialization ──────────────────────────────────────────────────────── */

window.addEventListener('DOMContentLoaded', async () => {
  await initDB();          // Start SQLite (storage.js)
  updateCounts();
  routeFromURL();
  setTimeout(() => generateQR(), 150);
});
