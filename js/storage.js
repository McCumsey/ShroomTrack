/* ============================================================
   storage.js — Supabase backend + localStorage offline queue
   ShroomTrack Cultivation Tracking System
   ============================================================ */

// ── Supabase credentials ───────────────────────────────────────────────────
const SUPA_URL = 'https://bzaxhjpvbbldwfutwpvv.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6YXhoanB2YmJsZHdmdXR3cHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNzk0ODAsImV4cCI6MjA5OTY1NTQ4MH0.uG6X9CoWVMxHh4n068mVgqWtW1QXxfRvUY6ljQhThZM';

// ── Internal state ─────────────────────────────────────────────────────────
const PENDING_KEY = 'shroomtrack_pending'; // localStorage offline queue
let _recordCache  = [];   // all records, newest first
let _contamCache  = [];   // contamination_log rows
let _idCache      = {};   // { stage: maxNumber } — keeps getNextId() synchronous
let _lastFetch    = 0;    // epoch ms of last successful records fetch
let _online       = false;

// ── Supabase fetch wrapper ─────────────────────────────────────────────────

function _sfetch(path, opts = {}) {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey':        SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type':  'application/json',
      ...(opts.headers || {}),
    },
  });
}

// ── Connection status dot ──────────────────────────────────────────────────

function _setStatus(online) {
  _online = online;
  const dot = document.getElementById('conn-status');
  if (!dot) return;
  dot.style.background = online ? '#22c55e' : '#ef4444';
  dot.title = online
    ? 'Supabase: connected'
    : 'Supabase: offline — saving locally';
}

// ── Offline queue ──────────────────────────────────────────────────────────

function _getPending() {
  return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
}
function _addPending(rec) {
  const q = _getPending();
  q.push(rec);
  localStorage.setItem(PENDING_KEY, JSON.stringify(q));
}

async function _syncPending() {
  const pending = _getPending();
  if (!pending.length) return;
  const failed = [];
  for (const rec of pending) {
    try { await _pushRecord(rec); }
    catch { failed.push(rec); }
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(failed));
  if (!failed.length) console.log(`Synced ${pending.length} pending record(s) to Supabase.`);
}

// ── Row serialization ──────────────────────────────────────────────────────

const _BASE = new Set([
  'id','stage','timestamp','batchId','species','technician','contamination'
]);

function _toRow(record) {
  const data = {};
  for (const [k, v] of Object.entries(record)) {
    if (!_BASE.has(k)) data[k] = v;
  }
  return {
    id:            record.id,
    stage:         record.stage,
    timestamp:     record.timestamp || new Date().toISOString(),
    batch_id:      record.batchId      || '',
    species:       record.species      || '',
    technician:    record.technician   || '',
    contamination: record.contamination || 'No',
    data,
  };
}

function _fromRow(row) {
  return {
    id:            row.id,
    stage:         row.stage,
    timestamp:     row.timestamp,
    batchId:       row.batch_id,
    species:       row.species,
    technician:    row.technician,
    contamination: row.contamination,
    ...(row.data || {}),
  };
}

// ── Supabase push helpers ──────────────────────────────────────────────────

async function _pushRecord(record) {
  const res = await _sfetch('records', {
    method:  'POST',
    headers: { 'Prefer': 'return=minimal' },
    body:    JSON.stringify(_toRow(record)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`records ${res.status}: ${text}`);
  }
  _setStatus(true);
}

async function _pushContamLog(record) {
  const row = {
    log_id:      `CONT-${record.stage.toUpperCase()}-${Date.now()}`,
    timestamp:   record.timestamp || new Date().toISOString(),
    record_id:   record.id,
    stage:       record.stage,
    batch_id:    record.batchId    || '',
    species:     record.species    || '',
    contam_date: record.contamDate || '',
    action:      record.action     || '',
    technician:  record.technician || '',
  };
  const res = await _sfetch('contamination_log', {
    method:  'POST',
    headers: { 'Prefer': 'return=minimal' },
    body:    JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`contamination_log ${res.status}`);
}

// ── Fetch from Supabase ────────────────────────────────────────────────────

async function _fetchRecords() {
  const res = await _sfetch('records?order=timestamp.desc');
  if (!res.ok) throw new Error(`records fetch ${res.status}`);
  const rows = await res.json();
  _recordCache = rows.map(_fromRow);
  _lastFetch   = Date.now();
  _setStatus(true);
}

async function _fetchContamLog() {
  const res = await _sfetch('contamination_log?order=timestamp.desc');
  if (!res.ok) throw new Error(`contamination_log fetch ${res.status}`);
  _contamCache = await res.json();
}

// ── ID validation ──────────────────────────────────────────────────────────

const ID_PATTERNS = {
  AGAR:  /^AGAR-\d{4}$/,
  LC:    /^LC-\d{4}$/,
  GRAIN: /^GRAIN-\d{4}$/,
  SUB:   /^SUB-\d{4}$/,
  DRY:   /^DRY-\d{4}$/,
  EXT:   /^EXT-\d{4}$/,
  BATCH: /^BATCH-\d{4}$/,
};

function validateId(value, allowedPrefixes) {
  if (!value || !value.trim()) return { valid: true, message: '' };
  const ids      = value.split(',').map(s => s.trim()).filter(Boolean);
  const patterns = allowedPrefixes.map(p => ID_PATTERNS[p]).filter(Boolean);
  const bad      = ids.filter(id => !patterns.some(p => p.test(id)));
  if (!bad.length) return { valid: true, message: '' };
  const expected = allowedPrefixes.map(p => p + '-XXXX').join(' or ');
  return { valid: false, message: `"${bad.join(', ')}" — expected: ${expected}` };
}

function validateFormIds() {
  const rules = [
    { fieldId: 'f-inoc-source', allowed: ['AGAR', 'LC', 'GRAIN'] },
    { fieldId: 'f-grain-ids',   allowed: ['GRAIN'] },
    { fieldId: 'f-sub-ids',     allowed: ['SUB'] },
    { fieldId: 'f-dry-ids',     allowed: ['DRY'] },
  ];
  const errors = [];
  for (const { fieldId, allowed } of rules) {
    const el = document.getElementById(fieldId);
    if (!el) continue;
    const result = validateId(el.value, allowed);
    if (!result.valid) {
      const label = el.closest('.field-group')
                      ?.querySelector('label')?.textContent?.trim() || fieldId;
      errors.push(`${label}: ${result.message}`);
    }
  }
  return errors;
}

function attachIdValidation(fieldId, allowedPrefixes) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  let hint = document.getElementById(fieldId + '-hint');
  if (!hint) {
    hint = Object.assign(document.createElement('div'), { id: fieldId + '-hint' });
    hint.style.cssText = 'font-size:0.72rem;color:var(--red);margin-top:3px;min-height:1rem;';
    el.parentNode.appendChild(hint);
  }
  const check = () => {
    const r = validateId(el.value, allowedPrefixes);
    hint.textContent    = r.valid ? '' : '⚠ ' + r.message;
    el.style.borderColor = r.valid ? '' : 'var(--red)';
  };
  el.addEventListener('blur',  check);
  el.addEventListener('input', () => { if (hint.textContent) check(); });
}

// ── ID generation (synchronous via cache) ──────────────────────────────────

function getNextId(stage) {
  const cfg = STAGE_CONFIG[stage];
  const n   = (_idCache[stage] || 0) + 1;
  return `${cfg.prefix}-${String(n).padStart(4, '0')}`;
}

// ── DB init ────────────────────────────────────────────────────────────────

async function initDB() {
  try {
    await Promise.all([_fetchRecords(), _fetchContamLog()]);

    // Build ID cache from live records + any queued offline records
    const pending = _getPending();
    for (const stage of Object.keys(STAGE_CONFIG)) {
      const cfg   = STAGE_CONFIG[stage];
      const strip = r => parseInt((r.id || '').replace(cfg.prefix + '-', '')) || 0;
      _idCache[stage] = Math.max(
        ..._recordCache.filter(r => r.stage === stage).map(strip),
        ...pending.filter(r => r.stage === stage).map(strip),
        0
      );
    }

    await _syncPending();
    console.log('ShroomTrack — Supabase connected');
    _setStatus(true);
  } catch (err) {
    console.warn('Supabase unavailable, running offline:', err);
    _setStatus(false);
    // Fall back to last localStorage snapshot
    _recordCache = JSON.parse(localStorage.getItem('shroomtrack_records') || '[]');
    for (const stage of Object.keys(STAGE_CONFIG)) {
      const cfg = STAGE_CONFIG[stage];
      _idCache[stage] = _recordCache
        .filter(r => r.stage === stage)
        .reduce((m, r) => Math.max(m, parseInt((r.id||'').replace(cfg.prefix+'-',''))||0), 0);
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

function saveRecord(record) {
  // Immediately update the ID cache so the next getNextId() call is correct
  const cfg = STAGE_CONFIG[record.stage];
  if (cfg) {
    const n = parseInt((record.id || '').replace(cfg.prefix + '-', '')) || 0;
    if (n > (_idCache[record.stage] || 0)) _idCache[record.stage] = n;
  }

  // Optimistic cache update so the Records view reflects the save instantly
  _recordCache.unshift(_fromRow(_toRow(record)));
  localStorage.setItem('shroomtrack_records', JSON.stringify(_recordCache));

  // Async push to Supabase; fall back to offline queue on failure
  _pushRecord(record)
    .then(() => {
      if (record.contamination === 'Yes') return _pushContamLog(record);
    })
    .catch(() => {
      _addPending(record);
      _setStatus(false);
    });
}

function getRecords() {
  // Background refresh when cache is stale (> 30 s) — keeps multi-device in sync
  if (Date.now() - _lastFetch > 30_000) {
    _fetchRecords()
      .then(() => {
        if (document.getElementById('view-records')?.classList.contains('active')) {
          const f = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
          if (typeof renderRecords === 'function') renderRecords(f);
        }
        if (typeof updateCounts === 'function') updateCounts();
      })
      .catch(() => {});
  }
  // _recordCache is sorted newest-first from Supabase. Deduplicate: first
  // occurrence of each id is the latest version — exactly what the list needs.
  const seen = new Set();
  return _recordCache.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// Returns ALL timestamped versions of one id, oldest → newest (audit trail).
function getRecordHistory(id) {
  return _recordCache.filter(r => r.id === id).reverse();
}

function exportCSV() {
  const all = getRecords();
  if (!all.length) { alert('No records to export.'); return; }
  const keys = [...new Set(all.flatMap(r => Object.keys(r)))];
  const csv  = [
    keys.join(','),
    ...all.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))
  ].join('\n');
  trigger_download(csv, `shroomtrack-${today()}.csv`, 'text/csv');
}

function exportSQLite() {
  // Exports JSON (SQLite n/a with Supabase backend)
  const all = getRecords();
  if (!all.length) { alert('No records to export.'); return; }
  trigger_download(
    JSON.stringify(all, null, 2),
    `shroomtrack-${today()}.json`,
    'application/json'
  );
}

function trigger_download(data, filename, type) {
  const blob = new Blob([data], { type });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: filename,
  });
  a.click();
}

function today() { return new Date().toISOString().slice(0, 10); }

// ── Reports query runner (JS over cached data — no SQL.js needed) ──────────

function runQuery(sql) {
  const s = sql.trim().toLowerCase();
  if (s.includes('from contamination_log'))            return _qContamLog();
  if (s.includes('contam_rate_pct'))                   return _qContamRate();
  if (s.includes('group by stage'))                    return _qByStage();
  if (s.includes('group by species'))                  return _qBySpecies();
  if (s.includes('group by technician'))               return _qByTech();
  if (s.includes('batch_id') && s.includes("!= ''"))   return _qBatchTrace();
  if (s.includes('sqlite_master'))                     return _qSchema();
  return _qAllRecords();
}

function _qAllRecords() {
  const rows = _recordCache.map(r => [
    r.id, r.stage, r.batchId || '', r.species || '',
    r.technician || '', r.contamination || 'No',
    (r.timestamp || '').slice(0, 10),
  ]);
  return {
    columns: ['id','stage','batch_id','species','technician','contamination','date'],
    rows,
  };
}

function _qContamLog() {
  const rows = _contamCache.map(r => [
    r.log_id, (r.timestamp||'').slice(0,10), r.record_id,
    r.stage, r.batch_id||'', r.species||'',
    r.contam_date||'', r.action||'', r.technician||'',
  ]);
  return {
    columns: ['log_id','date','record_id','stage','batch_id','species','contam_date','action','technician'],
    rows,
  };
}

function _qByStage() {
  const m = {};
  for (const r of _recordCache) {
    if (!m[r.stage]) m[r.stage] = { total: 0, contaminated: 0 };
    m[r.stage].total++;
    if (r.contamination === 'Yes') m[r.stage].contaminated++;
  }
  const rows = Object.entries(m)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([stage, d]) => [stage, d.total, d.contaminated]);
  return { columns: ['stage','total_records','contaminated'], rows };
}

function _qBySpecies() {
  const m = {};
  for (const r of _recordCache) {
    if (!r.species) continue;
    m[r.species] = (m[r.species] || 0) + 1;
  }
  const rows = Object.entries(m)
    .sort(([,a],[,b]) => b - a)
    .map(([species, count]) => [species, count]);
  return { columns: ['species','total_records'], rows };
}

function _qBatchTrace() {
  const rows = _recordCache
    .filter(r => r.batchId)
    .sort((a,b) =>
      (a.batchId||'').localeCompare(b.batchId||'') ||
      (a.timestamp||'').localeCompare(b.timestamp||'')
    )
    .map(r => [
      r.batchId, r.stage, r.id, r.species||'',
      r.technician||'', (r.timestamp||'').slice(0,10), r.contamination||'No',
    ]);
  return {
    columns: ['batch_id','stage','id','species','technician','date','contamination'],
    rows,
  };
}

function _qByTech() {
  const m = {};
  for (const r of _recordCache) {
    if (!r.technician) continue;
    if (!m[r.technician]) m[r.technician] = { total: 0, contam: 0 };
    m[r.technician].total++;
    if (r.contamination === 'Yes') m[r.technician].contam++;
  }
  const rows = Object.entries(m)
    .sort(([,a],[,b]) => b.total - a.total)
    .map(([tech, d]) => [tech, d.total, d.contam]);
  return { columns: ['technician','total','contam_events'], rows };
}

function _qContamRate() {
  const m = {};
  for (const r of _recordCache) {
    if (!m[r.stage]) m[r.stage] = { total: 0, contaminated: 0 };
    m[r.stage].total++;
    if (r.contamination === 'Yes') m[r.stage].contaminated++;
  }
  const rows = Object.entries(m)
    .map(([stage, d]) => [
      stage, d.total, d.contaminated,
      d.total ? (100 * d.contaminated / d.total).toFixed(1) : '0.0',
    ])
    .sort(([,,, a],[,,, b]) => parseFloat(b) - parseFloat(a));
  return { columns: ['stage','total','contaminated','contam_rate_pct'], rows };
}

function _qSchema() {
  return {
    columns: ['table', 'columns'],
    rows: [
      ['records',          'id, stage, timestamp, batch_id, species, technician, contamination, data (JSONB)'],
      ['contamination_log','log_id, timestamp, record_id, stage, batch_id, species, contam_date, action, technician'],
    ],
  };
}
