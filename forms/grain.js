/* ============================================================
   forms/grain.js — Grain Spawn form
   ============================================================ */

FORM_BUILDERS.grain = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>GRAIN ID</label>
        ${buildIdField('GRAIN', id)}
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

    <div class="field-row">
      <div class="field-group">
        <label>Grain Type</label>
        <input type="text" id="f-grain-type" placeholder="Sorghum / Red Milo / Rye">
      </div>
      <div class="field-group">
        <label>Container</label>
        <select id="f-container">
          <option value="">Select...</option>
          <option>Jar</option>
          <option>Bag</option>
          <option>Bucket</option>
        </select>
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Hydration Method</label>
        <input type="text" id="f-hydration" placeholder="Bucket soak / Pressure cook">
      </div>
      <div class="field-group">
        <label>Sterilization Temp (°C)</label>
        <input type="number" id="f-steril-temp" placeholder="121">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Sterilization Time (min)</label>
        <input type="number" id="f-steril-time" placeholder="210">
      </div>
      <div class="field-group">
        <label>Inoculation Date</label>
        <input type="date" id="f-inoc-date">
      </div>
    </div>

    <div class="field-group">
      <label>Inoculation Source</label>
      <input type="text" id="f-inoc-source" placeholder="e.g. LC-0026">
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Shake Date</label>
        <input type="date" id="f-shake-date">
      </div>
      <div class="field-group">
        <label>Colonization %</label>
        <input type="number" id="f-colonization" placeholder="0–100" min="0" max="100">
      </div>
    </div>

    <div class="field-group">
      <label>Notes</label>
      <textarea id="f-notes" placeholder="Growth observations, any issues..."></textarea>
    </div>

    ${contam}
  `;
};

FORM_FIELDS.grain = function() {
  return {
    grainType:  getVal('f-grain-type'),
    container:  getVal('f-container'),
    hydration:  getVal('f-hydration'),
    sterilTemp: getVal('f-steril-temp'),
    sterilTime: getVal('f-steril-time'),
    inocDate:   getVal('f-inoc-date'),
    inocSource: getVal('f-inoc-source'),
    shakeDate:  getVal('f-shake-date'),
    colonization: getVal('f-colonization'),
    notes:      getVal('f-notes'),
    contamDate: getVal('f-contam-date'),
    action:     getVal('f-action'),
  };
};
