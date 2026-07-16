/* ============================================================
   forms/agar.js — Agar / Petri Dish form
   To add a field: add HTML below AND add the key to FORM_FIELDS.agar()
   ============================================================ */

FORM_BUILDERS.agar = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>AGAR ID</label>
        ${buildIdField('AGAR', id)}
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
      <label>Agar Recipe</label>
      <textarea id="f-recipe" placeholder="e.g. Water 500ml / LME 10g / Agar 10g / YE 0.5g"></textarea>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Pour Date</label>
        <input type="date" id="f-pour-date">
      </div>
      <div class="field-group">
        <label>Inoculation Date</label>
        <input type="date" id="f-inoc-date">
      </div>
    </div>

    <div class="field-group">
      <label>Inoculation Source</label>
      <input type="text" id="f-inoc-source" placeholder="e.g. North Spore, LC-0026">
    </div>

    <div class="field-group">
      <label>Growth Notes</label>
      <textarea id="f-notes" placeholder="Observations, mycelium coverage, anything notable..."></textarea>
    </div>

    ${contam}
  `;
};

FORM_FIELDS.agar = function() {
  return {
    recipe:     getVal('f-recipe'),
    pourDate:   getVal('f-pour-date'),
    inocDate:   getVal('f-inoc-date'),
    inocSource: getVal('f-inoc-source'),
    notes:      getVal('f-notes'),
    contamDate: getVal('f-contam-date'),
    action:     getVal('f-action'),
  };
};
