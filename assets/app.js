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
 *
 * Language: every piece of text below comes from t() / itemName() /
 * categoryName() / unitName(), defined in i18n.js (loaded before this
 * file). Load order in each HTML page must be:
 *   items.js, par-overrides.js, i18n.js, app.js
 */

// Where "Submit Restock List" sends the report. Set up at formspree.io.
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mzdnywvz";

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
    savedEl.textContent = t("savedAt") + " " + new Date().toLocaleTimeString();
  }
}

function itemKey(category, name) {
  return category + "::" + name;
}

function statusFor(qty, par) {
  if (qty <= 0) return { cls: "status-out", key: "statusOut" };
  if (qty < par) return { cls: "status-low", key: "statusLow" };
  return { cls: "status-ok", key: "statusOk" };
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

  applyStaticStrings();
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
    label.textContent = checked + " / " + total + " " + t("checkedWord") + " (" + pct + "%)";
  }

  function updateSavedLabel(savedAt) {
    const el = document.getElementById("last-saved");
    el.textContent = savedAt ? t("lastSaved") + " " + new Date(savedAt).toLocaleString() : t("notSavedYet");
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
      header.innerHTML = '<span>' + categoryName(cat.category) + '</span><span class="count"></span>';
      header.addEventListener("click", () => {
        body.style.display = body.style.display === "none" ? "block" : "none";
      });

      const body = document.createElement("div");
      body.className = "category-body";

      cat.items.forEach((item) => {
        const key = itemKey(cat.category, item.name);
        const saved = state[key] || { qty: 0, checked: false, comment: "" };
        if (saved.checked) counts.checked++;
        const effectivePar = parFor(propertyName, item.name, item.par);

        const row = document.createElement("div");
        row.className = "item-row";

        const check = document.createElement("input");
        check.type = "checkbox";
        check.className = "item-check";
        check.checked = !!saved.checked;

        const nameEl = document.createElement("div");
        nameEl.className = "item-name";
        nameEl.innerHTML = itemName(item.name) + ' <span class="unit">(' + unitName(item.unit) + ")</span>";

        const parBadge = document.createElement("span");
        parBadge.className = "par-badge";
        parBadge.textContent = t("parLabel") + ": " + effectivePar;

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

        const commentInput = document.createElement("input");
        commentInput.type = "text";
        commentInput.className = "comment-input";
        commentInput.placeholder = t("addNote");
        commentInput.value = saved.comment || "";

        function refreshStatus() {
          const qty = parseInt(qtyInput.value, 10) || 0;
          const s = statusFor(qty, effectivePar);
          statusTag.className = "status-tag " + s.cls;
          statusTag.textContent = t(s.key);
        }

        function persist() {
          const qty = parseInt(qtyInput.value, 10) || 0;
          state[key] = { qty: qty, checked: check.checked, comment: commentInput.value };
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

        commentInput.addEventListener("input", () => {
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
        row.appendChild(commentInput);

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
    intro.textContent = t("pickListing");
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
        '<span class="listing-card-progress ' + statusCls + '">' + prog.checked + ' / ' + prog.total + ' ' + t("checkedWord") + '</span>';
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
      back.textContent = t("allListings");
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

    buildPropertyChecklist(propBody, propertyName, (checked, total) => {
      updateProgressBar(checked, total);
      const state = loadPropertyState(cleanerId, slugify(propertyName));
      updateSavedLabel(state._savedAt || null);
    });
  }

  function render() {
    const root = document.getElementById("checklist-root");
    root.innerHTML = "";

    if (properties.length === 1) {
      renderPropertyDetail(root, properties[0], false);
      return;
    }

    const hashProperty = slugInHash();
    if (hashProperty) {
      renderPropertyDetail(root, hashProperty, true);
    } else {
      renderPicker(root);
    }
  }

  window.onhashchange = render;
  render();

  if (typeof initLangToggle === "function") {
    initLangToggle(render);
  }

  document.getElementById("reset-btn").onclick = () => {
    const hashProperty = properties.length > 1 ? slugInHash() : properties[0];

    if (hashProperty) {
      if (confirm(t("resetConfirmOne").replace("{listing}", hashProperty))) {
        localStorage.removeItem(storageKey(cleanerId, slugify(hashProperty)));
        render();
      }
    } else {
      if (confirm(t("resetConfirmAll").replace("{name}", cleanerName))) {
        properties.forEach((propertyName) => {
          localStorage.removeItem(storageKey(cleanerId, slugify(propertyName)));
        });
        render();
      }
    }
  };

  // forceLang, if given (e.g. "en"), builds the whole report in that
  // language regardless of what's currently shown on screen. Used for
  // the Formspree submission, which should always be readable in English.
  function buildRestockReport(forceLang) {
    const hashProperty = properties.length > 1 ? slugInHash() : properties[0];
    const propertiesToReport = hashProperty ? [hashProperty] : properties;

    const lines = [];
    lines.push(t("restockListHeader", forceLang) + " — " + cleanerName + " — " + new Date().toLocaleDateString());
    let anyShortages = false;

    propertiesToReport.forEach((propertyName) => {
      const slug = slugify(propertyName);
      const state = loadPropertyState(cleanerId, slug);
      const propLines = [];

      const noteLines = [];

      INVENTORY_DATA.forEach((cat) => {
        const shortages = cat.items.filter((item) => {
          const s = state[itemKey(cat.category, item.name)] || { qty: 0 };
          return (s.qty || 0) < parFor(propertyName, item.name, item.par);
        });
        if (shortages.length) {
          propLines.push(categoryName(cat.category, forceLang) + ":");
          shortages.forEach((item) => {
            const s = state[itemKey(cat.category, item.name)] || { qty: 0 };
            const need = parFor(propertyName, item.name, item.par) - (s.qty || 0);
            const noteSuffix = s.comment && s.comment.trim() ? " (" + s.comment.trim() + ")" : "";
            propLines.push("  - " + itemName(item.name, forceLang) + ": " + need + " " + unitName(item.unit, forceLang) + noteSuffix);
          });
        }

        cat.items.forEach((item) => {
          const s = state[itemKey(cat.category, item.name)] || {};
          const isShort = (s.qty || 0) < parFor(propertyName, item.name, item.par);
          if (!isShort && s.comment && s.comment.trim()) {
            noteLines.push("  - " + itemName(item.name, forceLang) + ": " + s.comment.trim());
          }
        });
      });

      if (propLines.length) {
        anyShortages = true;
        lines.push("");
        lines.push(propertyName + ":");
        lines.push(...propLines);
      }

      if (noteLines.length) {
        lines.push("");
        lines.push(propertyName + " — " + t("otherNotes", forceLang));
        lines.push(...noteLines);
      }
    });

    if (!anyShortages) {
      lines.push("");
      lines.push(hashProperty
        ? t("everythingParListing", forceLang)
        : t("everythingParAll", forceLang));
    }

    return {
      text: lines.join("\n"),
      anyShortages: anyShortages,
      hashProperty: hashProperty,
      propertiesToReport: propertiesToReport
    };
  }

  function showListModal(title, subtitle, text) {
    const titleEl = document.getElementById("modal-title");
    const subtitleEl = document.getElementById("modal-subtitle");
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    document.getElementById("copy-textarea").value = text;
    document.getElementById("copy-modal-overlay").classList.add("open");
  }

  document.getElementById("copy-btn").onclick = () => {
    // Copy uses whatever language is currently on screen — it's for the
    // cleaner's own reference.
    const report = buildRestockReport();
    showListModal(t("shoppingListTitle"), t("copiedSubtitle"), report.text);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(report.text).catch(() => {});
    }
  };

  document.getElementById("close-modal-btn").onclick = () => {
    document.getElementById("copy-modal-overlay").classList.remove("open");
  };

  document.getElementById("print-btn").onclick = () => {
    window.print();
  };

  const submitBtn = document.getElementById("submit-btn");
  const submitStatus = document.getElementById("submit-status");

  function setSubmitStatus(text, cls) {
    if (!submitStatus) return;
    submitStatus.textContent = text;
    submitStatus.className = "submit-status" + (cls ? " " + cls : "");
  }

  if (submitBtn) {
    submitBtn.onclick = () => {
      // Submissions always go out in English, regardless of the language
      // currently selected on screen — this is what the manager reads.
      const report = buildRestockReport("en");

      submitBtn.disabled = true;
      setSubmitStatus(t("submitting"), "");

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          cleaner: cleanerName,
          properties: report.propertiesToReport.join(", "),
          submitted_at: new Date().toLocaleString("en-US"),
          restock_list: report.text
        })
      })
        .then((res) => {
          submitBtn.disabled = false;
          if (res.ok) {
            setSubmitStatus(t("submittedThanks"), "success");
            // Show exactly what was sent (English), so the confirmation
            // matches the actual submission.
            showListModal(t("submittedTitle"), t("thisWasSent"), report.text);
          } else {
            setSubmitStatus(t("couldntSubmitTry"), "error");
          }
        })
        .catch(() => {
          submitBtn.disabled = false;
          setSubmitStatus(t("couldntSubmitConn"), "error");
        });
    };
  }
}
