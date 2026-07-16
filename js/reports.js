/* ============================================================
   reports.js — SQL query console and preset report queries
   ============================================================ */

/* ── Preset queries ──────────────────────────────────────────────────────── */

const PRESET_QUERIES = [
  {
    label: 'All records — newest first',
    sql: `SELECT id, stage, batch_id, species, technician, contamination,
                 SUBSTR(timestamp,1,10) AS date
          FROM records
          ORDER BY timestamp DESC;`
  },
  {
    label: 'Contamination events',
    sql: `SELECT log_id, SUBSTR(timestamp,1,10) AS date, record_id,
                 stage, batch_id, species, contam_date, action, technician
          FROM contamination_log
          ORDER BY timestamp DESC;`
  },
  {
    label: 'Record count by stage',
    sql: `SELECT stage,
                 COUNT(*) AS total_records,
                 SUM(CASE WHEN contamination='Yes' THEN 1 ELSE 0 END) AS contaminated
          FROM records
          GROUP BY stage
          ORDER BY stage;`
  },
  {
    label: 'Record count by species',
    sql: `SELECT species,
                 COUNT(*) AS total_records
          FROM records
          WHERE species != ''
          GROUP BY species
          ORDER BY total_records DESC;`
  },
  {
    label: 'Batch traceability — all stages for a batch',
    sql: `SELECT batch_id, stage, id, species, technician,
                 SUBSTR(timestamp,1,10) AS date, contamination
          FROM records
          WHERE batch_id != ''
          ORDER BY batch_id, timestamp;`
  },
  {
    label: 'Records by technician',
    sql: `SELECT technician,
                 COUNT(*) AS total,
                 SUM(CASE WHEN contamination='Yes' THEN 1 ELSE 0 END) AS contam_events
          FROM records
          WHERE technician != ''
          GROUP BY technician
          ORDER BY total DESC;`
  },
  {
    label: 'Contamination rate by stage (%)',
    sql: `SELECT stage,
                 COUNT(*) AS total,
                 SUM(CASE WHEN contamination='Yes' THEN 1 ELSE 0 END) AS contaminated,
                 ROUND(100.0 * SUM(CASE WHEN contamination='Yes' THEN 1 ELSE 0 END)
                       / COUNT(*), 1) AS contam_rate_pct
          FROM records
          GROUP BY stage
          ORDER BY contam_rate_pct DESC;`
  },
  {
    label: 'Show table schema',
    sql: `SELECT name, sql FROM sqlite_master WHERE type='table';`
  },
];

/* ── Render preset buttons ───────────────────────────────────────────────── */

function renderPresets() {
  const container = document.getElementById('preset-list');
  if (!container) return;
  container.innerHTML = PRESET_QUERIES.map((q, i) => `
    <button class="preset-btn" onclick="loadPreset(${i})">${q.label}</button>
  `).join('');
}

function loadPreset(index) {
  const q = PRESET_QUERIES[index];
  if (!q) return;
  document.getElementById('sql-input').value = q.sql.trim();
  runReport();
}

/* ── Run a query and render results ─────────────────────────────────────── */

function runReport() {
  const sql       = (document.getElementById('sql-input').value || '').trim();
  const resultDiv = document.getElementById('query-results');
  if (!sql) return;

  try {
    const { columns, rows } = runQuery(sql);
    renderTable(resultDiv, columns, rows);
  } catch (err) {
    resultDiv.innerHTML = `
      <div style="background:var(--red-light);border:1px solid var(--red);
                  border-radius:8px;padding:0.75rem;color:var(--red);font-size:0.85rem;">
        <strong>SQL Error:</strong><br>${err.message}
      </div>`;
  }
}

/* ── Render a results table ──────────────────────────────────────────────── */

function renderTable(container, columns, rows) {
  if (!rows.length) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem 0;">
      Query returned no rows.</p>`;
    return;
  }

  const thead = `<tr>${columns.map(c =>
    `<th style="background:var(--green-dark);color:white;padding:7px 10px;
                text-align:left;font-size:0.75rem;white-space:nowrap;">${c}</th>`
  ).join('')}</tr>`;

  const tbody = rows.map((row, ri) =>
    `<tr style="background:${ri % 2 === 0 ? 'white' : 'var(--green-pale)'};">
      ${row.map(cell =>
        `<td style="padding:6px 10px;font-size:0.8rem;border-bottom:0.5px solid var(--border);
                    white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;"
             title="${cell ?? ''}">${cell ?? '—'}</td>`
      ).join('')}
    </tr>`
  ).join('');

  container.innerHTML = `
    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">
      ${rows.length} row${rows.length !== 1 ? 's' : ''} returned
    </div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border);">
      <table style="width:100%;border-collapse:collapse;">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
    <button onclick="exportResultCSV(${JSON.stringify(columns)}, ${JSON.stringify(rows)})"
            style="margin-top:8px;background:var(--green-pale);color:var(--green-dark);
                   border:1px solid var(--green-light);padding:5px 12px;border-radius:20px;
                   font-size:0.75rem;font-family:inherit;cursor:pointer;font-weight:bold;">
      Export this result as CSV
    </button>`;
}

/* ── Export query result to CSV ─────────────────────────────────────────── */

function exportResultCSV(columns, rows) {
  const lines = [
    columns.join(','),
    ...rows.map(r => r.map(v => JSON.stringify(v ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/csv' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `shroomtrack-query-${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
}

/* ── Init reports view on first open ────────────────────────────────────── */

function initReports() {
  renderPresets();
  // Default query loaded on first open
  const input = document.getElementById('sql-input');
  if (input && !input.value) {
    loadPreset(0);
  }
}
