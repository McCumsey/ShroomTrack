/* ============================================================
   forms/lc.js — Liquid Culture form
   ============================================================ */

FORM_BUILDERS.lc = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>LIQUID CULTURE ID</label>
        ${buildIdField('LC', id)}
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
      <label>Media Recipe</label>
      <textarea id="f-recipe" placeholder="e.g. Distilled Water 600ml - Honey 6ml"></textarea>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Volume (ml)</label>
        <input type="number" id="f-volume" placeholder="600">
      </div>
      <div class="field-group">
        <label>Inoculation Date</label>
        <input type="date" id="f-inoc-date">
      </div>
    </div>

    <div class="field-group">
      <label>Inoculation Source</label>
      <input type="text" id="f-inoc-source" placeholder="e.g. North Spore, AGAR-0026">
    </div>

    <div class="field-group">
      <label>Growth Notes</label>
      <textarea id="f-notes" placeholder="Mycelium growth, clarity, any observations..."></textarea>
    </div>

    ${contam}
  `;
};

FORM_FIELDS.lc = function() {
  return {
    recipe:     getVal('f-recipe'),
    volume:     getVal('f-volume'),
    inocDate:   getVal('f-inoc-date'),
    inocSource: getVal('f-inoc-source'),
    notes:      getVal('f-notes'),
    contamDate: getVal('f-contam-date'),
    action:     getVal('f-action'),
  };
};
