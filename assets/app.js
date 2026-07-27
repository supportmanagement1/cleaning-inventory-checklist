/**
 * Shared checklist engine. Each cleaner-N.html / <name>.html page sets:
 *   window.CLEANER_ID         - unique id, used as the localStorage key prefix
 *   window.CLEANER_NAME       - display name
 *   window.CLEANER_PROPERTIES - array of property names this cleaner covers
 * ...then calls initChecklist(). If CLEANER_PROPERTIES is omitted, a single
 * property named after the cleaner is used (backward compatible with the
 * original one-list-per-cleaner pages).
 *
 * Cleaners with more than one property see a "pick your listing" screen
 * first; clicking a listing opens just that property's checklist, with a
 * back link to return to the picker. Cleaners with a single property go
 * straight to their checklist (no picker needed).
 */

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function storageKey(cleanerId, propertySlug) {
  return "inv-checklist-" + cleanerId + "--" + propertySlug;
}

function loadPropertyState(cleanerId, propertySlug) {
  try {
    const raw = localStorage.getItem(storageKey(cleanerId, propertySlug));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function savePropertyState(cleanerId, propertySlug, state) {
  state._savedAt = new Date().toISOString();
  localStorage.setItem(storageKey(cleanerId, propertySlug), JSON.stringify(state));
  const savedEl = document.getElementById("last-saved");
  if (savedEl) {
    savedEl.textContent = "Saved " + new Date().toLocaleTimeString();
  }
}

function itemKey(category, name) {
  return category + "::" + name;
}

function statusFor(qty, par) {
  if (qty <= 0) return { cls: "status-out", label: "OUT" };
  if (qty < par) return { cls: "status-low", label: "LOW" };
  return { cls: "status-ok", label: "OK" };
}

function propertyProgress(cleanerId, propertyName) {
  const state = loadPropertyState(cleanerId, slugify(propertyName));
  let total = 0;
  let checked = 0;
  INVENTORY_DATA.forEach((cat) => {
    total += cat.items.length;
    cat.items.forEach((item) => {
      const saved = state[itemKey(cat.category, item.name)];
      if (saved && saved.checked) checked++;
    });
  });
  return { total: total, checked: checked, savedAt: state._savedAt || null };
}

function initChecklist() {
  const cleanerId = window.CLEANER_ID || "default";
  const cleanerName = window.CLEANER_NAME || "Cleaner";
  const properties = (window.CLEANER_PROPERTIES && window.CLEANER_PROPERTIES.length)
    ? window.CLEANER_PROPERTIES
    : [cleanerName];

  document.getElementById("cleaner-name").textContent = cleanerName;

  function slugInHash() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return null;
    return properties.find((p) => slugify(p) === raw) || null;
  }

  function updateProgressBar(checked, total) {
    const fill = document.getElementById("progress-fill");
    const label = document.getElementById("progress-label-text");
    const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
    fill.style.width = pct + "%";
    label.textContent = checked + " / " + total + " checked (" + pct + "%)";
  }

  function updateSavedLabel(savedAt) {
    const el = document.getElementById("last-saved");
    el.textContent = savedAt ? "Last saved " + new Date(savedAt).toLocaleString() : "Not saved yet";
  }

  function buildPropertyChecklist(container, propertyName, onChange) {
    const slug = slugify(propertyName);
    const state = loadPropertyState(cleanerId, slug);
    const counts = { checked: 0, total: 0 };

    INVENTORY_DATA.forEach((cat) => {
      counts.total += cat.items.length;

      const catEl = document.createElement("div");
      catEl.className = "category";

      const header = document.createElement("div");
      header.className = "category-header";
      header.innerHTML = '<span>' + cat.category + '</span><span class="count"></span>';
      header.addEventListener("click", () => {
        body.style.display = body.style.display === "none" ? "block" : "none";
      });

      const body = document.createElement("div");
      body.className = "category-body";

      cat.items.forEach((item) => {
        const key = itemKey(cat.category, item.name);
        const saved = state[key] || { qty: 0, checked: false };
        if (saved.checked) counts.checked++;

        const row = document.createElement("div");
        row.className = "item-row";

        const check = document.createElement("input");
        check.type = "checkbox";
        check.className = "item-check";
        check.checked = !!saved.checked;

        const nameEl = document.createElement("div");
        nameEl.className = "item-name";
        nameEl.innerHTML = item.name + ' <span class="unit">(' + item.unit + ")</span>";

        const parBadge = document.createElement("span");
        parBadge.className = "par-badge";
        parBadge.textContent = "Par: " + item.par;

        const qtyControl = document.createElement("div");
        qtyControl.className = "qty-control";

        const minusBtn = document.createElement("button");
        minusBtn.type = "button";
        minusBtn.className = "qty-btn";
        minusBtn.textContent = "−";

        const qtyInput = document.createElement("input");
        qtyInput.type = "number";
        qtyInput.className = "qty-input";
        qtyInput.min = "0";
        qtyInput.value = saved.qty;

        const plusBtn = document.createElement("button");
        plusBtn.type = "button";
        plusBtn.className = "qty-btn";
        plusBtn.textContent = "+";

        const statusTag = document.createElement("span");
        statusTag.className = "status-tag";

        function refreshStatus() {
          const qty = parseInt(qtyInput.value, 10) || 0;
          const s = statusFor(qty, item.par);
          statusTag.className = "status-tag " + s.cls;
          statusTag.textContent = s.label;
        }

        function persist() {
          const qty = parseInt(qtyInput.value, 10) || 0;
          state[key] = { qty: qty, checked: check.checked };
          savePropertyState(cleanerId, slug, state);
          onChange(counts.checked, counts.total);
        }

        minusBtn.addEventListener("click", () => {
          qtyInput.value = Math.max(0, (parseInt(qtyInput.value, 10) || 0) - 1);
          refreshStatus();
          persist();
        });

        plusBtn.addEventListener("click", () => {
          qtyInput.value = (parseInt(qtyInput.value, 10) || 0) + 1;
          refreshStatus();
          persist();
        });

        qtyInput.addEventListener("input", () => {
          refreshStatus();
          persist();
        });

        check.addEventListener("change", () => {
          counts.checked += check.checked ? 1 : -1;
          persist();
        });

        refreshStatus();

        qtyControl.appendChild(minusBtn);
        qtyControl.appendChild(qtyInput);
        qtyControl.appendChild(plusBtn);

        row.appendChild(check);
        row.appendChild(nameEl);
        row.appendChild(parBadge);
        row.appendChild(qtyControl);
        row.appendChild(statusTag);

        body.appendChild(row);
      });

      catEl.appendChild(header);
      catEl.appendChild(body);
      container.appendChild(catEl);
    });

    onChange(counts.checked, counts.total);
    return counts;
  }

  function renderPicker(root) {
    const intro = document.createElement("p");
    intro.className = "picker-intro";
    intro.textContent = "Pick a listing to open its checklist:";
    root.appendChild(intro);

    const grid = document.createElement("div");
    grid.className = "listing-grid";

    let totalItems = 0;
    let checkedItems = 0;
    let latestSavedAt = null;

    properties.forEach((propertyName) => {
      const prog = propertyProgress(cleanerId, propertyName);
      totalItems += prog.total;
      checkedItems += prog.checked;
      if (prog.savedAt && (!latestSavedAt || prog.savedAt > latestSavedAt)) {
        latestSavedAt = prog.savedAt;
      }

      const card = document.createElement("a");
      card.href = "#" + slugify(propertyName);
      card.className = "listing-card";
      const pct = prog.total === 0 ? 0 : Math.round((prog.checked / prog.total) * 100);
      let statusCls = "listing-card-ok";
      if (pct < 100 && prog.checked === 0) statusCls = "listing-card-none";
      else if (pct < 100) statusCls = "listing-card-partial";
      card.innerHTML =
        '<span class="listing-card-name">' + propertyName + '</span>' +
        '<span class="listing-card-progress ' + statusCls + '">' + prog.checked + ' / ' + prog.total + ' checked</span>';
      grid.appendChild(card);
    });

    root.appendChild(grid);
    updateProgressBar(checkedItems, totalItems);
    updateSavedLabel(latestSavedAt);
  }

  function renderPropertyDetail(root, propertyName, showBack) {
    if (showBack) {
      const back = document.createElement("a");
      back.href = "#";
      back.className = "back-link";
      back.textContent = "← All my listings";
      root.appendChild(back);
    }

    const propSection = document.createElement("div");
    propSection.className = "property-section";

    const propHeader = document.createElement("div");
    propHeader.className = "property-header property-header-static";
    propHeader.innerHTML = "<span>" + propertyName + "</span>";

    const propBody = document.createElement("div");
    propBody.className = "property-body";

    propSection.appendChild(propHeader);
    propSection.appendChild(propBody);
    root.appendChild(propSection);

    buildPropertyChecklist(propBody,
