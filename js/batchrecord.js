/* ============================================================
   batchrecord.js — GMP-style batch record print export
   Uses the LATEST version of each record for the main document.
   Flags any id where ANY historical version logged contamination.
   ============================================================ */

const STAGE_ORDER = ['agar','lc','grain','substrate','drying','extraction'];

/* ── Entry point ─────────────────────────────────────────────────────────── */
// filter: { stage, species, batchId } — all optional, omit to include everything.

function printBatchRecord(filter = {}) {
  const latest  = getRecords(); // latest version per id
  const records = latest.filter(r => {
    if (filter.stage   && r.stage   !== filter.stage)   return false;
    if (filter.species && r.species !== filter.species)  return false;
    if (filter.batchId && r.batchId !== filter.batchId)  return false;
    return true;
  });

  if (!records.length) {
    alert('No records match the selected filter.');
    return;
  }

  // Build contamination history map: id → true if ANY version ever had contam
  const everContam = {};
  for (const r of records) {
    everContam[r.id] = getRecordHistory(r.id).some(h => h.contamination === 'Yes');
  }

  const printDate = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const title = [
    filter.species ? `Species: ${filter.species}` : null,
    filter.batchId ? `Batch: ${filter.batchId}`   : null,
    filter.stage   ? STAGE_CONFIG[filter.stage]?.label : null,
  ].filter(Boolean).join(' · ') || 'All Records';

  const byStage = _groupByStage(records);
  const sections = STAGE_ORDER
    .filter(s => byStage[s]?.length)
    .map(s => _stageSection(s, byStage[s], everContam))
    .join('');

  const contamSummary = _contamSummary(records, everContam);

  const win = window.open('', '_blank');
  win.document.write(`
<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Batch Record — ${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: white; }
    @page { size: letter; margin: 0.6in; }
    @media print { .no-print { display: none !important; } }

    .doc-header { border-bottom: 2pt solid #1b4332; padding-bottom: 10pt; margin-bottom: 14pt; }
    .doc-title   { font-size: 16pt; font-weight: bold; color: #1b4332; }
    .doc-meta    { font-size: 8pt; color: #666; margin-top: 4pt; }

    .stage-section { margin-bottom: 18pt; break-inside: avoid; }
    .stage-heading {
      background: #1b4332; color: white; padding: 5pt 10pt;
      font-size: 10pt; font-weight: bold; border-radius: 3pt;
      margin-bottom: 6pt;
    }

    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th {
      background: #d8f3dc; color: #1b4332; text-align: left;
      padding: 4pt 7pt; font-size: 7.5pt; text-transform: uppercase;
      letter-spacing: 0.04em; border: 0.5pt solid #bbb;
    }
    td { padding: 4pt 7pt; border: 0.5pt solid #ccc; vertical-align: top; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .contam-cell { color: #b91c1c; font-weight: bold; }
    .ok-cell     { color: #15803d; }

    .contam-section {
      margin-top: 16pt; border: 1pt solid #b91c1c;
      border-radius: 4pt; padding: 10pt 12pt;
      break-inside: avoid;
    }
    .contam-section h3 { color: #b91c1c; font-size: 10pt; margin-bottom: 6pt; }

    .signature-block {
      margin-top: 28pt; border-top: 0.5pt solid #999;
      padding-top: 10pt; display: flex; gap: 40pt;
    }
    .sig-line { flex: 1; }
    .sig-line p { font-size: 8pt; color: #666; margin-top: 20pt;
                  border-top: 0.5pt solid #333; padding-top: 3pt; }

    .print-btn {
      display: block; margin: 0 auto 16pt; padding: 8pt 24pt;
      background: #1b4332; color: white; border: none;
      border-radius: 5pt; font-size: 11pt; cursor: pointer;
    }
  </style>
</head><body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print / Save PDF</button>

  <div class="doc-header">
    <div class="doc-title">ShroomTrack — Batch Production Record</div>
    <div class="doc-meta">
      ${title} &nbsp;·&nbsp; Printed: ${printDate} &nbsp;·&nbsp;
      ${records.length} record${records.length !== 1 ? 's' : ''}
    </div>
  </div>

  ${sections}
  ${contamSummary}

  <div class="signature-block">
    <div class="sig-line">
      <p>Reviewed by (Print)</p>
    </div>
    <div class="sig-line">
      <p>Signature</p>
    </div>
    <div class="sig-line">
      <p>Date</p>
    </div>
  </div>
</body></html>`);
  win.document.close();
}

/* ── Group records by stage ──────────────────────────────────────────────── */

function _groupByStage(records) {
  return records.reduce((acc, r) => {
    (acc[r.stage] = acc[r.stage] || []).push(r);
    return acc;
  }, {});
}

/* ── Build one stage section ─────────────────────────────────────────────── */

function _stageSection(stage, records, everContam) {
  const cfg     = STAGE_CONFIG[stage] || {};
  const columns = _columnsForStage(stage);

  const headerRow = columns.map(c => `<th>${c.label}</th>`).join('');
  const bodyRows  = records.map(r => {
    const contamInHistory = everContam[r.id];
    const cells = columns.map(c => {
      if (c.key === 'contam') {
        const text = contamInHistory
          ? (r.contamination === 'Yes' ? '⚠ Yes (current)' : '⚠ Yes (historical)')
          : 'No';
        const cls  = contamInHistory ? 'contam-cell' : 'ok-cell';
        return `<td class="${cls}">${text}</td>`;
      }
      const val = r[c.key] ?? '';
      return `<td>${val}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="stage-section">
      <div class="stage-heading">${cfg.icon || ''} ${cfg.label || stage}</div>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

/* ── Column definitions per stage ────────────────────────────────────────── */

function _columnsForStage(stage) {
  const base = [
    { key: 'id',          label: 'ID' },
    { key: 'species',     label: 'Species' },
    { key: 'technician',  label: 'Technician' },
    { key: 'timestamp',   label: 'Last Saved',
      format: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'contam',      label: 'Contamination' },
  ];

  const extra = {
    agar:       [{ key: 'inocSource', label: 'Source' },
                 { key: 'pourDate',   label: 'Pour Date' }],
    lc:         [{ key: 'volume',     label: 'Volume (ml)' },
                 { key: 'inocSource', label: 'Source' }],
    grain:      [{ key: 'grainType',  label: 'Grain' },
                 { key: 'colonization', label: 'Col %' },
                 { key: 'inocSource', label: 'Source' }],
    substrate:  [{ key: 'grainIds',   label: 'Grain IDs' },
                 { key: 'spawnRate',  label: 'Spawn %' },
                 { key: 'harvestDate',label: 'Harvest' }],
    drying:     [{ key: 'dryMethod',  label: 'Method' },
                 { key: 'preWeight',  label: 'Pre (g)' },
                 { key: 'postWeight', label: 'Post (g)' }],
    extraction: [{ key: 'dryIds',     label: 'Dry Lots' },
                 { key: 'waterFinal', label: 'Water Final (ml)' },
                 { key: 'alcFinal',   label: 'Alc Final (ml)' },
                 { key: 'qc',         label: 'QC' }],
  };

  // Splice extra columns before the contamination column
  const cols = [...base];
  const contamIdx = cols.findIndex(c => c.key === 'contam');
  cols.splice(contamIdx, 0, ...(extra[stage] || []));
  return cols;
}

/* ── Contamination summary section ──────────────────────────────────────── */

function _contamSummary(records, everContam) {
  const flagged = records.filter(r => everContam[r.id]);
  if (!flagged.length) return '';

  const rows = flagged.map(r => {
    const history   = getRecordHistory(r.id);
    const events    = history.filter(h => h.contamination === 'Yes');
    const firstDate = events.length
      ? new Date(events[0].timestamp).toLocaleDateString()
      : '—';
    const action    = events[0]?.action || '—';
    return `
      <tr>
        <td>${r.id}</td>
        <td>${r.stage}</td>
        <td>${r.species || '—'}</td>
        <td>${firstDate}</td>
        <td>${action}</td>
        <td>${events[0]?.technician || '—'}</td>
      </tr>`;
  }).join('');

  return `
    <div class="contam-section">
      <h3>⚠ Contamination Events — ${flagged.length} affected record${flagged.length !== 1 ? 's' : ''}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Stage</th><th>Species</th>
            <th>First Detected</th><th>Action Taken</th><th>Technician</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ── Quick-launch helpers ─────────────────────────────────────────────────── */
// Called from index.html buttons; filter by active stage chip if desired.

function printCurrentBatchRecord() {
  const activeStage = document.querySelector('.filter-chip.active')?.dataset.filter;
  printBatchRecord(activeStage && activeStage !== 'all' ? { stage: activeStage } : {});
}
