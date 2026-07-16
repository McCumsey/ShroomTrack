/* ============================================================
   forms/drying.js — Drying & Storage form
   ============================================================ */

FORM_BUILDERS.drying = function(header, contam, id, cfg) {
  return `
    ${header}

    <div class="field-row">
      <div class="field-group">
        <label>BATCH ID</label>
        ${buildIdField('DRY', id)}
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
      <label>Substrate IDs Used</label>
      <input type="text" id="f-sub-ids" placeholder="e.g. SUB-0001, SUB-0002">
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Drying Method</label>
        <select id="f-dry-method">
          <option value="">Select...</option>
          <option>Food Dehydrator</option>
          <option>Air Dry</option>
          <option>Freeze Dry</option>
          <option>Oven Low Heat</option>
        </select>
      </div>
      <div class="field-group">
        <label>Drying Temp (°C)</label>
        <input type="number" id="f-dry-temp" placeholder="40">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Start Date</label>
        <input type="date" id="f-start-date">
      </div>
      <div class="field-group">
        <label>End Date</label>
        <input type="date" id="f-end-date">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Pre-Dry Weight (g)</label>
        <input type="number" id="f-pre-weight" placeholder="0">
      </div>
      <div class="field-group">
        <label>Post-Dry Weight (g)</label>
        <input type="number" id="f-post-weight" placeholder="0">
      </div>
    </div>

    <div class="field-row">
      <div class="field-group">
        <label>Storage Container</label>
        <input type="text" id="f-storage-container" placeholder="Mason jar / Mylar bag">
      </div>
      <div class="field-group">
        <label>Storage Location</label>
        <input type="text" id="f-storage-location" placeholder="Shelf A, Bin 3">
      </div>
    </div>

    <div class="field-group">
      <label>Released for Extraction?</label>
      <select id="f-released">
        <option value="No">No — hold in storage</option>
        <option value="Yes">Yes — release for extraction</option>
      </select>
    </div>
  `;
};

FORM_FIELDS.drying = function() {
  return {
    subIds:           getVal('f-sub-ids'),
    dryMethod:        getVal('f-dry-method'),
    dryTemp:          getVal('f-dry-temp'),
    startDate:        getVal('f-start-date'),
    endDate:          getVal('f-end-date'),
    preWeight:        getVal('f-pre-weight'),
    postWeight:       getVal('f-post-weight'),
    storageContainer: getVal('f-storage-container'),
    storageLocation:  getVal('f-storage-location'),
    released:         getVal('f-released'),
  };
};
