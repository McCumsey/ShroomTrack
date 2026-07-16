/* ============================================================
   qr.js — QR code generation, single label print, bulk sheet
   ============================================================ */

const APP_URL = window.location.href.split('?')[0];
let currentQrStage = 'agar';
let qrInstance     = null;

/* ── Stage selector ───────────────────────────────────────────────────────── */

function selectQrStage(btn) {
  document.querySelectorAll('.qr-stage-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentQrStage = btn.dataset.stage;

  const cfg = STAGE_CONFIG[currentQrStage];
  document.getElementById('bulk-stage-display').textContent = cfg.label;
  document.getElementById('bulk-species-display').textContent = '';
  document.getElementById('qr-id-input').value = getNextId(currentQrStage);
  generateQR();
}

/* ── Generate a single QR code ────────────────────────────────────────────── */

function generateQR() {
  const id   = document.getElementById('qr-id-input').value.trim()
               || getNextId(currentQrStage);
  const url  = `${APP_URL}?stage=${currentQrStage}&id=${encodeURIComponent(id)}`;
  const wrap = document.getElementById('qr-canvas-wrap');

  wrap.innerHTML = '';
  if (qrInstance) { try { qrInstance.clear(); } catch (e) {} }

  qrInstance = new QRCode(wrap, {
    text:         url,
    width:        180,
    height:       180,
    colorDark:    '#1b4332',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });

  document.getElementById('qr-label-text').textContent = id;
  document.getElementById('qr-url-text').textContent   = url;
}

/* ── Download QR as PNG ───────────────────────────────────────────────────── */

function downloadQR() {
  const canvas = document.querySelector('#qr-canvas-wrap canvas');
  if (!canvas) return;
  const id   = document.getElementById('qr-id-input').value.trim();
  const link = document.createElement('a');
  link.download = `${id}-qr.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

/* ── Shared label HTML builder ────────────────────────────────────────────── */

function buildLabelHTML(id, stage, species, printDate, batchId, qrSize = 120, horizontal = false) {
  const cfg        = STAGE_CONFIG[stage] || {};
  const stageLabel = cfg.label || stage;
  const icon       = cfg.icon  || '';

  const stageColors = {
    agar:       '#2e7d32',
    lc:         '#1565c0',
    grain:      '#f57f17',
    substrate:  '#880e4f',
    drying:     '#6a1b9a',
    extraction: '#004d40',
  };
  const color = stageColors[stage] || '#1b4332';

  const speciesHtml = species
    ? `<div class="label-species">${species}</div>`
    : '';

  if (horizontal) {
    return `
      <div class="label" data-id="${id}" data-stage="${stage}"
           data-url="${APP_URL}?stage=${stage}&id=${encodeURIComponent(id)}"
           data-color="${color}" data-size="${qrSize}">
        <div class="label-qr-wrap"></div>
        <div class="label-info">
          <div class="label-id">${id}</div>
          ${speciesHtml}
          <div class="label-date">Printed: ${printDate}</div>
        </div>
      </div>`;
  }

  return `
    <div class="label" data-id="${id}" data-stage="${stage}"
         data-url="${APP_URL}?stage=${stage}&id=${encodeURIComponent(id)}"
         data-color="${color}" data-size="${qrSize}">
      <div class="label-qr-wrap"></div>
      <div class="label-id">${id}</div>
      ${speciesHtml}
      <div class="label-date">Printed: ${printDate}</div>
    </div>`;
}

/* ── Single-label print styles ───────────────────────────────────────────── */

function printWindowStyles() {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      @media print { @page { size: letter; margin: 0.5in; } .no-print { display:none !important; } }
      .label {
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        background: white;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .label-qr-wrap { display: flex; justify-content: center; margin-bottom: 6px; }
      .label-id { font-family: 'Courier New', monospace; font-size: 15px; font-weight: bold; color: #1b4332; margin-bottom: 4px; letter-spacing: 0.05em; }
      .label-species { font-size: 11px; font-weight: bold; color: #222; margin-bottom: 4px; }
      .label-date { font-size: 13px; font-weight: bold; color: #888; margin-top: 4px; }
      .print-btn { display:block; margin:0 auto 16px; padding:8px 24px; background:#1b4332; color:white; border:none; border-radius:6px; font-size:13px; cursor:pointer; }
    </style>`;
}

/* ── Bulk sheet print styles — 2.25" × 1.25" labels, 3-up on letter ─────── */

function bulkPrintStyles() {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }

      @page { margin: 0.25in; }
      @media print { .no-print { display: none !important; } }

      .page-header {
        font-size: 8pt;
        color: #555;
        text-align: center;
        padding-bottom: 6pt;
        margin-bottom: 6pt;
        border-bottom: 0.5pt solid #ccc;
      }

      /* 3 labels across — each 2.25 in wide */
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 2.25in);
        gap: 0.1in;
        justify-content: center;
      }

      /* Fixed label size: 2.25 × 1.25 in, horizontal layout */
      .label {
        width: 2.25in;
        height: 1.25in;
        min-height: 1.25in; 
        border: 0.5pt solid #bbb;
        border-radius: 3pt;
        padding: 0.06in 0.07in;
        display: flex;
        flex-direction: row;
        align-items: center;
        overflow: hidden;
        background: white;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      /* QR sits on the left */
      .label-qr-wrap {
        flex-shrink: 0;
        margin-right: 0.06in;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Text block fills remaining width */
      .label-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .label-id {
        font-family: 'Courier New', monospace;
        font-size: 7.5pt;
        font-weight: bold;
        color: #1b4332;
        margin-bottom: 2pt;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .label-species {
        font-size: 6.5pt;
        font-weight: bold;
        color: #222;
        margin-bottom: 2pt;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .label-blank { color: #aaa; font-weight: normal; font-style: italic; }
      .label-meta { margin-bottom: 2pt; }
      .label-stage {
        font-size: 6pt;
        color: #555;
        background: #f0f0f0;
        padding: 1pt 4pt;
        border-radius: 6pt;
        display: inline-block;
      }
      .label-batch {
        font-size: 6pt;
        color: #1b4332;
        background: #d8f3dc;
        padding: 1pt 4pt;
        border-radius: 6pt;
        font-family: monospace;
        display: inline-block;
        margin-left: 2pt;
      }
      .label-date { font-size: 7pt; color: #888; }

      /* Each page-worth of labels gets its own container with an explicit break */
      .page {
        break-after: page;
        page-break-after: always;
      }
      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .print-btn { display:block; margin:0 auto 10pt; padding:6pt 20pt; background:#1b4332; color:white; border:none; border-radius:5pt; font-size:11pt; cursor:pointer; }
    </style>`;
}

/* ── Shared QR render script (injected into print window) ────────────────── */
// Borrows the already-loaded QRCode constructor from the opener window —
// avoids any file:// script-loading restrictions in the about:blank popup.

function printWindowQrScript() {
  return `
    <script>
      var QRCode = window.opener && window.opener.QRCode;
      var labels = document.querySelectorAll('.label');
      var total = labels.length;
      var rendered = 0;

      if (!QRCode || total === 0) {
        setTimeout(function() { window.print(); }, 500);
      } else {
        labels.forEach(function(label) {
          var wrap = label.querySelector('.label-qr-wrap');
          var url  = label.dataset.url;
          var size = parseInt(label.dataset.size) || 80;
          if (wrap && url) {
            new QRCode(wrap, {
              text: url, width: size, height: size,
              colorDark: '#000000', colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.M
            });
          }
          rendered++;
          if (rendered === total) {
            setTimeout(function() { window.print(); }, 600);
          }
        });
      }
    <\/script>`;
}


/* ── Print label for a single saved record ────────────────────────────────── */

function printSingleLabel(id, stage, species, batchId) {
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const labelHTML = buildLabelHTML(id, stage, species, printDate, batchId, 140);

  const win = window.open('', '_blank');
  win.document.write(`
<!DOCTYPE html><html><head>
  <title>Label — ${id}</title>
  ${printWindowStyles()}
</head><body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print Label</button>
  <div style="display:flex;justify-content:center;padding:20px;">
    <div style="width:220px;">
      ${labelHTML}
    </div>
  </div>
  ${printWindowQrScript()}
</body></html>`);
  win.document.close();
}

/* ── Bulk print label sheet ───────────────────────────────────────────────── */

function printBulk() {
  const stage   = currentQrStage;
  const cfg     = STAGE_CONFIG[stage];
  const start   = parseInt(document.getElementById('bulk-start').value)   || 1;
  const end     = parseInt(document.getElementById('bulk-end').value)     || 10;
  const species = (document.getElementById('bulk-species').value || '').trim();
  const batchId = (document.getElementById('bulk-batch').value  || '').trim();

  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  // Build individual label elements
  const labels = [];
  for (let i = start; i <= end; i++) {
    const id = `${cfg.prefix}-${String(i).padStart(4, '0')}`;
    labels.push(buildLabelHTML(id, stage, species, printDate, batchId, 80, true));
  }

  // Chunk into explicit page containers — 3 cols × 7 rows = 21 per page.
  // The browser treats each .page div as a discrete block and respects
  // break-after:page, preventing the entire sheet from collapsing to one page.
  const PER_PAGE = 21;
  let pagesHTML = '';
  for (let p = 0; p < labels.length; p += PER_PAGE) {
    const chunk = labels.slice(p, p + PER_PAGE).join('');
    pagesHTML += `<div class="page"><div class="grid">${chunk}</div></div>`;
  }

  const win = window.open('', '_blank');
  win.document.write(`
<!DOCTYPE html><html><head>
  <title>QR Labels — ${cfg.label}</title>
  ${bulkPrintStyles()}
</head><body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print Sheet</button>
  <div class="page-header no-print">
    ShroomTrack — ${cfg.label} Labels &nbsp;|&nbsp;
    IDs: ${cfg.prefix}-${String(start).padStart(4,'0')} to ${cfg.prefix}-${String(end).padStart(4,'0')} &nbsp;|&nbsp;
    ${species || 'Species: pending'} &nbsp;|&nbsp; Printed: ${printDate}
  </div>
  ${pagesHTML}
  ${printWindowQrScript()}
</body></html>`);
  win.document.close();
}
