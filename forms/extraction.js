/* ============================================================
   forms/extraction.js — Extraction form (water + alcohol dual extraction)
   ============================================================ */

FORM_BUILDERS.extraction = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>EXTRACTION ID</label>
        ${buildIdField('EXT', id)}
      </div>
      <div class="field-group">
        <label>Technician</label>
        <input type="text" id="f-tech" placeholder="Name">
      </div>
    </div>

    <div class="field-group">
      <label>Species</label>
      ${speciesSelect('f-species')}
    </div>

    <div class="field-group">
      <label>Drying Lot IDs Used</label>
      <input type="text" id="f-dry-ids" placeholder="e.g. DRY-0001, DRY-0002">
    </div>

    <div class="field-group">
      <label>Dry Material Weight (g)</label>
      <input type="number" id="f-dry-weight" placeholder="0">
    </div>

    <div class="section-divider">Water Extraction</div>

    <div class="field-row-3">
      <div class="field-group">
        <label>Start Vol (ml)</label>
        <input type="number" id="f-water-start" placeholder="0">
      </div>
      <div class="field-group">
        <label>Temp (°C)</label>
        <input type="number" id="f-water-temp" placeholder="100">
      </div>
      <div class="field-group">
        <label>Time (hr)</label>
        <input type="number" id="f-water-time" placeholder="2" step="0.5">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Final Vol (ml)</label>
        <input type="number" id="f-water-final" placeholder="0">
      </div>
      <div class="field-group">
        <label>Filtration Method</label>
        <input type="text" id="f-water-filter" placeholder="Coffee filter / Cheesecloth">
      </div>
    </div>

    <div class="section-divider">Alcohol Extraction</div>

    <div class="field-row-3">
      <div class="field-group">
        <label>Start Vol (ml)</label>
        <input type="number" id="f-alc-start" placeholder="0">
      </div>
      <div class="field-group">
        <label>ABV %</label>
        <input type="number" id="f-alc-abv" placeholder="95">
      </div>
      <div class="field-group">
        <label>Time (hr)</label>
        <input type="number" id="f-alc-time" placeholder="24" step="0.5">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Final Vol (ml)</label>
        <input type="number" id="f-alc-final" placeholder="0">
      </div>
      <div class="field-group">
        <label>Filtration Method</label>
        <input type="text" id="f-alc-filter" placeholder="Coffee filter / Buchner funnel">
      </div>
    </div>

    <div class="section-divider">Quality Control</div>

    <div class="field-row">
      <div class="field-group">
        <label>QC Pass / Fail</label>
        <select id="f-qc">
          <option value="">Pending</option>
          <option>Pass</option>
          <option>Fail</option>
        </select>
      </div>
      <div class="field-group">
        <label>QC Notes</label>
        <input type="text" id="f-qc-notes" placeholder="Color, clarity, notes...">
      </div>
    </div>
  `;
};

FORM_FIELDS.extraction = function() {
  return {
    dryIds:      getVal('f-dry-ids'),
    dryWeight:   getVal('f-dry-weight'),
    waterStart:  getVal('f-water-start'),
    waterTemp:   getVal('f-water-temp'),
    waterTime:   getVal('f-water-time'),
    waterFinal:  getVal('f-water-final'),
    waterFilter: getVal('f-water-filter'),
    alcStart:    getVal('f-alc-start'),
    alcAbv:      getVal('f-alc-abv'),
    alcTime:     getVal('f-alc-time'),
    alcFinal:    getVal('f-alc-final'),
    alcFilter:   getVal('f-alc-filter'),
    qc:          getVal('f-qc'),
    qcNotes:     getVal('f-qc-notes'),
  };
};
