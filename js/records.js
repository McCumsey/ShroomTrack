/* ============================================================
   records.js — Records list rendering, filtering, detail view
   ============================================================ */

/* ── Human-readable field labels ─────────────────────────────────────────── */

const FIELD_LABELS = {
  batchId:           'Batch ID',
  batch_id:          'Batch ID',
  species:           'Species',
  technician:        'Technician',
  contamination:     'Contamination',
  contamDate:        'Contam Date',
  action:            'Action Taken',
  // Agar
  recipe:            'Agar Recipe',
  pourDate:          'Pour Date',
  inocDate:          'Inoculation Date',
  inocSource:        'Inoculation Source',
  notes:             'Notes',
  // LC
  volume:            'Volume (ml)',
  // Grain
  grainType:         'Grain Type',
  container:         'Container',
  hydration:         'Hydration Method',
  sterilTemp:        'Sterilization Temp (°C)',
  sterilTime:        'Sterilization Time (min)',
  shakeDate:         'Shake Date',
  colonization:      'Colonization %',
  // Substrate
  substrateFormula:  'Substrate Formula',
  grainIds:          'Grain Spawn IDs',
  spawnRate:         'Spawn Rate %',
  incubation:        'Incubation Conditions',
  fruitingDate:      'Fruiting Date',
  harvestDate:       'Harvest Date',
  fruitingCond:      'Fruiting Conditions',
  wet1:   'Flush 1 — Wet (g)',   dry1: 'Flush 1 — Dry (g)',   yield1: 'Flush 1 — Yield %',
  wet2:   'Flush 2 — Wet (g)',   dry2: 'Flush 2 — Dry (g)',   yield2: 'Flush 2 — Yield %',
  wet3:   'Flush 3 — Wet (g)',   dry3: 'Flush 3 — Dry (g)',   yield3: 'Flush 3 — Yield %',
  // Drying
  subIds:            'Substrate IDs',
  dryMethod:         'Drying Method',
  dryTemp:           'Drying Temp (°C)',
  startDate:         'Start Date',
  endDate:           'End Date',
  preWeight:         'Pre-Dry Weight (g)',
  postWeight:        'Post-Dry Weight (g)',
  storageContainer:  'Storage Container',
  storageLocation:   'Storage Location',
  released:          'Released for Extraction',
  // Extraction
  dryIds:            'Drying Lot IDs',
  dryWeight:         'Dry Material Weight (g)',
  waterStart:        'Water — Start Vol (ml)',
  waterTemp:         'Water Temp (°C)',
  waterTime:         'Water Time (hr)',
  waterFinal:        'Water Final Vol (ml)',
  waterFilter:       'Water Filtration Method',
  alcStart:          'Alcohol — Start Vol (ml)',
  alcAbv:            'Alcohol ABV %',
  alcTime:           'Alcohol Time (hr)',
  alcFinal:          'Alcohol Final Vol (ml)',
  alcFilter:         'Alcohol Filtration Method',
  qc:                'QC Status',
  qcNotes:           'QC Notes',
};

const SKIP_FIELDS = ['id', 'stage', 'timestamp', 'data'];

/* ── Filter state ─────────────────────────────────────────────────────────── */

let currentFilter = 'all';

function filterRecords(btn) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderRecords(currentFilter);
}

/* ── Render records list (latest version per id only) ────────────────────── */

function renderRecords(filter) {
  const all      = getRecords(); // already deduplicated to latest per id
  const filtered = filter === 'all' ? all : all.filter(r => r.stage === filter);
  const list     = document.getElementById('records-list');

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        No records yet for this stage.<br>Start logging to see entries here.
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(r => {
    const cfg        = STAGE_CONFIG[r.stage] || {};
    const date       = r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—';
    const bid        = r.batchId || r.batch_id || '—';
    const contamFlag = r.contamination === 'Yes'
      ? '<span class="contam-flag">⚠ Contam</span>' : '';

    return `
      <div class="record-card" onclick="showDetail('${r.id}')">
        <div class="record-card-header">
          <span class="record-id">${r.id}${contamFlag}</span>
          <span class="record-stage-badge ${cfg.badgeClass || ''}">
            ${cfg.icon || ''} ${cfg.label || r.stage}
          </span>
        </div>
        <div class="record-species">${r.species || '—'}</div>
        <div class="record-date">
          ${date} · Batch: ${bid} · Tech: ${r.technician || '—'}
        </div>
      </div>`;
  }).join('');
}

/* ── Version hint — one-line summary of a historical entry ──────────────── */

function _versionHint(h) {
  if (h.colonization) return `🌾 ${h.colonization}% colonized`;
  if (h.contamination === 'Yes') return '⚠ Contamination logged';
  if (h.harvestDate)  return '🍄 Harvest recorded';
  if (h.released === 'Yes') return '✅ Released for extraction';
  if (h.notes)        return h.notes.slice(0, 50) + (h.notes.length > 50 ? '…' : '');
  if (h.technician)   return `Tech: ${h.technician}`;
  return '';
}

/* ── History section HTML ─────────────────────────────────────────────────── */

function _buildHistorySection(id, currentTimestamp) {
  const history = getRecordHistory(id); // oldest → newest
  if (history.length <= 1) return '';   // nothing to show for a single save

  const rows = history.map((h, i) => {
    const isCurrent  = h.timestamp === currentTimestamp;
    const date       = new Date(h.timestamp).toLocaleString();
    const hint       = _versionHint(h);
    const contamFlag = h.contamination === 'Yes'
      ? '<span class="contam-flag" style="font-size:0.7rem;">⚠ Contam</span>' : '';
    const curBadge   = isCurrent
      ? '<span style="font-size:0.68rem;background:var(--green-light);color:white;padding:1px 7px;border-radius:10px;font-weight:bold;flex-shrink:0;">current</span>'
      : '';

    return `
      <div onclick="showDetail('${h.id}', '${h.timestamp}')"
           style="padding:0.55rem 1rem;border-bottom:1px solid var(--border);
                  cursor:pointer;display:flex;align-items:center;gap:0.5rem;
                  background:${isCurrent ? 'var(--green-pale)' : 'white'};">
        <span style="font-family:monospace;font-size:0.7rem;color:var(--text-muted);
                     min-width:2rem;flex-shrink:0;">v${i + 1}</span>
        <span style="font-size:0.8rem;flex:1;min-width:0;">
          ${date}
          ${hint ? `<br><span style="font-size:0.72rem;color:var(--text-muted);">${hint}</span>` : ''}
        </span>
        ${contamFlag}
        ${curBadge}
      </div>`;
  }).join('');

  return `
    <div class="section-divider" style="margin-top:1.25rem;">
      Version History — ${history.length} saves
    </div>
    <div style="background:white;border:1px solid var(--border);border-radius:10px;
                overflow:hidden;margin-bottom:1rem;">
      ${rows}
    </div>`;
}

/* ── Show record detail ───────────────────────────────────────────────────── */
// timestamp is optional; omit to show the latest version.

function showDetail(id, timestamp) {
  const history = getRecordHistory(id); // all versions, oldest → newest
  if (!history.length) return;

  const rec = timestamp
    ? history.find(r => r.timestamp === timestamp)
    : history[history.length - 1]; // latest = last in oldest-first array

  if (!rec) return;

  const cfg     = STAGE_CONFIG[rec.stage] || {};
  const species = rec.species || '';
  const batchId = rec.batchId || rec.batch_id || '';

  const rows = Object.entries(rec)
    .filter(([k, v]) => !SKIP_FIELDS.includes(k) && v && v !== '{}')
    .map(([k, v]) => `
      <div class="detail-field">
        <span class="detail-label">${FIELD_LABELS[k] || k}</span>
        <span class="detail-value">${v}</span>
      </div>`)
    .join('');

  const historySection = _buildHistorySection(id, rec.timestamp);

  document.getElementById('detail-container').innerHTML = `
    <div class="form-header">
      <h2>${cfg.icon || ''} ${cfg.label || rec.stage}</h2>
      <div class="form-id-badge">${rec.id}</div>
      <p style="margin-top:4px;opacity:0.75;">
        ${timestamp ? 'Viewing version — ' : 'Latest save — '}
        ${new Date(rec.timestamp).toLocaleString()}
      </p>
    </div>

    <button
      onclick="printSingleLabel('${rec.id}','${rec.stage}','${species.replace(/'/g,"\\'")}','${batchId}')"
      style="width:100%;background:var(--bark);color:white;border:none;
             padding:11px;border-radius:8px;font-family:inherit;font-size:0.9rem;
             font-weight:bold;cursor:pointer;margin-bottom:0.75rem;margin-top:0.25rem;">
      🖨 Print Label for ${rec.id}
    </button>

    <div style="background:white;border:1px solid var(--border);
                border-radius:10px;padding:0.75rem 1rem;">
      ${rows || '<p style="color:var(--text-muted);font-size:0.85rem;">No fields recorded.</p>'}
    </div>

    ${historySection}`;

  showView('detail');
}
