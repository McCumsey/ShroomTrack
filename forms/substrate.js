/* ============================================================
   forms/substrate.js — Substrate & Fruiting form
   Includes Flush 1/2/3 weight table with auto-calculated yield %
   ============================================================ */

FORM_BUILDERS.substrate = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>SUBSTRATE ID</label>
        ${buildIdField('SUB', id)}
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
      <label>Substrate Formula</label>
      <textarea id="f-substrate-formula"
        placeholder="e.g. Hardwood sawdust 70% / Wheat bran 20% / Gypsum 10%"></textarea>
    </div>

    <div class="field-group">
      <label>Grain Spawn IDs Used</label>
      <input type="text" id="f-grain-ids" placeholder="e.g. GRAIN-0030, GRAIN-0031">
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Spawn Rate %</label>
        <input type="number" id="f-spawn-rate" placeholder="15" min="0" max="100">
      </div>
      <div class="field-group">
        <label>Inoculation Date</label>
        <input type="date" id="f-inoc-date">
      </div>
    </div>

    <div class="field-group">
      <label>Incubation Conditions</label>
      <input type="text" id="f-incubation" placeholder="e.g. 75°F, dark, 85% RH">
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Fruiting Date</label>
        <input type="date" id="f-fruiting-date">
      </div>
      <div class="field-group">
        <label>Harvest Date</label>
        <input type="date" id="f-harvest-date">
      </div>
    </div>

    <div class="field-group">
      <label>Fruiting Conditions</label>
      <input type="text" id="f-fruiting-cond" placeholder="e.g. 68°F, 90% RH, FAE 2x daily">
    </div>

    <div class="section-divider">Flush Weights</div>
    <table class="flush-table">
      <thead>
        <tr>
          <th></th>
          <th>Wet Weight (g)</th>
          <th>Dry Weight (g)</th>
          <th>Yield %</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="flush-label">Flush 1</td>
          <td><input type="number" id="f-wet1" placeholder="0"></td>
          <td><input type="number" id="f-dry1" placeholder="0"></td>
          <td><input type="number" id="f-yield1" readonly style="background:#f8f9fa;"></td>
        </tr>
        <tr>
          <td class="flush-label">Flush 2</td>
          <td><input type="number" id="f-wet2" placeholder="0"></td>
          <td><input type="number" id="f-dry2" placeholder="0"></td>
          <td><input type="number" id="f-yield2" readonly style="background:#f8f9fa;"></td>
        </tr>
        <tr>
          <td class="flush-label">Flush 3</td>
          <td><input type="number" id="f-wet3" placeholder="0"></td>
          <td><input type="number" id="f-dry3" placeholder="0"></td>
          <td><input type="number" id="f-yield3" readonly style="background:#f8f9fa;"></td>
        </tr>
      </tbody>
    </table>

    ${contam}
  `;
};

FORM_FIELDS.substrate = function() {
  return {
    substrateFormula: getVal('f-substrate-formula'),
    grainIds:         getVal('f-grain-ids'),
    spawnRate:        getVal('f-spawn-rate'),
    inocDate:         getVal('f-inoc-date'),
    incubation:       getVal('f-incubation'),
    fruitingDate:     getVal('f-fruiting-date'),
    harvestDate:      getVal('f-harvest-date'),
    fruitingCond:     getVal('f-fruiting-cond'),
    wet1:             getVal('f-wet1'),
    dry1:             getVal('f-dry1'),
    yield1:           getVal('f-yield1'),
    wet2:             getVal('f-wet2'),
    dry2:             getVal('f-dry2'),
    yield2:           getVal('f-yield2'),
    wet3:             getVal('f-wet3'),
    dry3:             getVal('f-dry3'),
    yield3:           getVal('f-yield3'),
    contamDate:       getVal('f-contam-date'),
    action:           getVal('f-action'),
  };
};
