/* ============================================================
   forms.js — Form rendering, contamination toggle, submit logic
   ID validation is wired into submitForm() via validateFormIds()
   ============================================================ */

let currentStage = 'agar';

/* ── Open a form ─────────────────────────────────────────────────────────── */

function openForm(stage, prefillId) {
  currentStage = stage;
  const id  = prefillId || getNextId(stage);
  const cfg = STAGE_CONFIG[stage];
  document.getElementById('form-container').innerHTML = buildForm(stage, id, cfg);
  showView('form');
  initFormBehavior(stage);
}

/* ── Shared header ───────────────────────────────────────────────────────── */

function formHeader(cfg, id) {
  return `
    <div class="form-header">
      <h2>${cfg.icon} ${cfg.label}</h2>
      <div class="form-id-badge">${id}</div>
      <p style="margin-top:4px;">Fill out and submit to save record</p>
    </div>
    <input type="hidden" id="f-id"    value="${id}">
    <input type="hidden" id="f-stage" value="${currentStage}">
  `;
}

/* ── Shared contamination block ──────────────────────────────────────────── */

function contamBlock() {
  return `
    <div class="section-divider">Contamination</div>
    <div class="field-group">
      <label>Contamination Observed?</label>
      <div class="contamination-toggle">
        <button class="toggle-btn" id="cont-no"  onclick="setContam('no')">✓ No</button>
        <button class="toggle-btn" id="cont-yes" onclick="setContam('yes')">✗ Yes</button>
      </div>
      <input type="hidden" id="f-contam" value="No">
      <div class="contam-details" id="contam-details">
        <div class="field-row">
          <div class="field-group">
            <label>Contam Date</label>
            <input type="date" id="f-contam-date">
          </div>
          <div class="field-group">
            <label>Action Taken</label>
            <input type="text" id="f-action" placeholder="Dispose / Isolate / Transfer">
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── Build form ──────────────────────────────────────────────────────────── */

function buildForm(stage, id, cfg) {
  const header  = formHeader(cfg, id);
  const contam  = contamBlock();
  const builder = FORM_BUILDERS[stage];
  if (!builder) return `<p>Unknown stage: ${stage}</p>`;
  return builder(header, contam, id, cfg) + `
    <div id="validation-errors" style="
      display:none;
      background:var(--red-light);
      border:1px solid var(--red);
      border-radius:8px;
      padding:0.75rem 1rem;
      margin-top:1rem;
      font-size:0.85rem;
      color:var(--red);
    "></div>
    <button class="submit-btn" onclick="submitForm()">Save Record →</button>
  `;
}

/* ── Post-render behavior ────────────────────────────────────────────────── */

function initFormBehavior(stage) {
  // Yield auto-calc for substrate flush table
  if (stage === 'substrate') {
    [1, 2, 3].forEach(i => {
      const w = document.getElementById(`f-wet${i}`);
      const d = document.getElementById(`f-dry${i}`);
      const y = document.getElementById(`f-yield${i}`);
      if (!w || !d || !y) return;
      const calc = () => {
        const wv = parseFloat(w.value) || 0;
        const dv = parseFloat(d.value) || 0;
        y.value = wv > 0 ? (dv / wv * 100).toFixed(1) : '';
      };
      w.addEventListener('input', calc);
      d.addEventListener('input', calc);
    });
  }

  // Wire up inline ID validation on cross-reference fields
  attachIdValidation('f-inoc-source', ['AGAR', 'LC', 'GRAIN']);
  attachIdValidation('f-grain-ids',   ['GRAIN']);
  attachIdValidation('f-sub-ids',     ['SUB']);
  attachIdValidation('f-dry-ids',     ['DRY']);
}

/* ── Contamination toggle ────────────────────────────────────────────────── */

function setContam(val) {
  document.getElementById('f-contam').value = val === 'yes' ? 'Yes' : 'No';
  document.getElementById('cont-yes').className =
    'toggle-btn' + (val === 'yes' ? ' selected-yes' : '');
  document.getElementById('cont-no').className  =
    'toggle-btn' + (val === 'no'  ? ' selected-no'  : '');
  document.getElementById('contam-details')
    ?.classList.toggle('visible', val === 'yes');
}

/* ── Split ID input helper ───────────────────────────────────────────────── */

function buildIdField(prefix, id) {
  const num    = parseInt((id || '').split('-').pop()) || 1;
  const padded = String(num).padStart(4, '0');
  return `
    <div class="id-split-field">
      <span class="id-prefix">${prefix}-</span>
      <input type="number" id="f-batch-num" min="1" max="9999"
             placeholder="${padded}" value="${num}"
             oninput="syncBatchId('${prefix}')">
    </div>
    <input type="hidden" id="f-batch" value="${prefix}-${padded}">
  `;
}

function syncBatchId(prefix) {
  const numEl  = document.getElementById('f-batch-num');
  const hidden = document.getElementById('f-batch');
  const idEl   = document.getElementById('f-id');
  if (!numEl || !hidden) return;
  const n      = parseInt(numEl.value);
  const fullId = (isNaN(n) || n < 1) ? '' : `${prefix}-${String(n).padStart(4, '0')}`;
  hidden.value = fullId;
  if (idEl) idEl.value = fullId;
}

/* ── Field reader ────────────────────────────────────────────────────────── */

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* ── Submit with validation ──────────────────────────────────────────────── */

function submitForm() {
  // Run ID cross-reference validation first
  const errors = validateFormIds();
  const errDiv = document.getElementById('validation-errors');

  if (errors.length) {
    errDiv.style.display = 'block';
    errDiv.innerHTML = '<strong>⚠ Fix the following before saving:</strong><br>'
      + errors.map(e => `• ${e}`).join('<br>');
    errDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return; // Block save
  }

  errDiv.style.display = 'none';

  const stage = getVal('f-stage');
  const id    = getVal('f-id');

  const base = {
    id,
    stage,
    timestamp:     new Date().toISOString(),
    batchId:       getVal('f-batch'),
    species:       getVal('f-species'),
    technician:    getVal('f-tech'),
    contamination: getVal('f-contam'),
  };

  const extraFields = FORM_FIELDS[stage] ? FORM_FIELDS[stage]() : {};
  saveRecord({ ...base, ...extraFields });

  document.getElementById('success-id-display').textContent = id;
  showView('success');
}
