/**
 * Site-wide language support (English / Spanish).
 *
 * Every page that wants bilingual text loads this file, then:
 *   - calls t(key) for UI strings
 *   - calls itemName(name) / categoryName(name) / unitName(unit) for
 *     inventory vocabulary (defined in items.js)
 *   - calls initLangToggle(rerenderFn) once, after the "EN"/"ES" buttons
 *     exist in the page, to wire them up
 *
 * The chosen language is stored under one shared key, so switching it on
 * any page (the home page or any cleaner's checklist) applies everywhere
 * else on the site too, on that same device/browser.
 */

const LANG_STORAGE_KEY = "site-lang";

const UI_STRINGS = {
  en: {
    // Home page
    indexHeading: "Cleaning Inventory Checklists",
    indexSubtitle: "Thank you for helping us provide the best possible experience for our guests. Your support is greatly appreciated!",
    indexIntro: "Select your name below to open your personal checklist. Each link remembers your progress on the device you use it on.",
    indexHowToLabel: "How to use:",
    indexHowToBody: "Open your checklist. If you cover more than one property, pick a listing first. Count what's on the shelf, enter the quantity for each item, and check it off. Items below par level are automatically flagged LOW or OUT. When you're done, tap Copy Restock List and send it to your manager.",

    // Checklist page
    pageTitle: "Inventory Checklist",
    pageHeading: "Inventory Checklist",
    assignedTo: "Assigned to:",
    copyBtn: "Copy Restock List",
    submitBtn: "Submit Restock List",
    printBtn: "Print",
    resetBtn: "Reset",
    footerNote: "Data is saved only on this device/browser.",
    modalDefaultTitle: "Restock List",
    modalDefaultSubtitle: "Copied to clipboard. Paste this into a text or email to your manager.",
    closeBtn: "Close",
    pickListing: "Pick a listing to open its checklist:",
    allListings: "← All my listings",
    checkedWord: "checked",
    notSavedYet: "Not saved yet",
    lastSaved: "Last saved",
    savedAt: "Saved",
    addNote: "Add a note (optional)",
    parLabel: "Par",
    statusOut: "OUT",
    statusLow: "LOW",
    statusOk: "OK",
    shoppingListTitle: "Shopping List",
    copiedSubtitle: "Copied to clipboard. Paste this into a text or email to your manager.",
    thisWasSent: "This shopping list was sent:",
    submittedTitle: "Submitted!",
    submitting: "Submitting…",
    submittedThanks: "Submitted — thank you!",
    couldntSubmitTry: "Couldn't submit. Try again, or use Copy Restock List instead.",
    couldntSubmitConn: "Couldn't submit — check your connection and try again.",
    resetConfirmOne: "Reset the checklist for {listing}? This clears all quantities and checkmarks for this listing.",
    resetConfirmAll: "Reset every listing's checklist for {name}? This clears all quantities and checkmarks.",
    restockListHeader: "Restock list",
    everythingParListing: "Everything is at or above par at this listing. Nothing needed.",
    everythingParAll: "Everything is at or above par across all listings. Nothing needed.",
    otherNotes: "other notes:"
  },
  es: {
    indexHeading: "Listas de Inventario de Limpieza",
    indexSubtitle: "Gracias por ayudarnos a ofrecer la mejor experiencia posible a nuestros huéspedes. ¡Agradecemos mucho tu apoyo!",
    indexIntro: "Selecciona tu nombre abajo para abrir tu lista personal. Cada enlace recuerda tu progreso en el dispositivo que uses.",
    indexHowToLabel: "Cómo usar:",
    indexHowToBody: "Abre tu lista. Si tienes más de una propiedad, elige una primero. Cuenta lo que hay en el estante, ingresa la cantidad de cada artículo y márcalo. Los artículos por debajo del mínimo se marcan automáticamente como BAJO o AGOTADO. Cuando termines, toca Copiar Lista de Reposición y envíala a tu gerente.",

    pageTitle: "Lista de Inventario",
    pageHeading: "Lista de Inventario",
    assignedTo: "Asignado a:",
    copyBtn: "Copiar Lista de Reposición",
    submitBtn: "Enviar Lista de Reposición",
    printBtn: "Imprimir",
    resetBtn: "Reiniciar",
    footerNote: "Los datos se guardan solo en este dispositivo o navegador.",
    modalDefaultTitle: "Lista de Reposición",
    modalDefaultSubtitle: "Copiado. Puedes pegar esta lista en un mensaje o correo electrónico para tu gerente.",
    closeBtn: "Cerrar",
    pickListing: "Elige una propiedad para abrir su lista:",
    allListings: "← Todas mis propiedades",
    checkedWord: "marcados",
    notSavedYet: "Aún no guardado",
    lastSaved: "Última vez guardado",
    savedAt: "Guardado",
    addNote: "Agregar una nota (opcional)",
    parLabel: "Mínimo",
    statusOut: "AGOTADO",
    statusLow: "BAJO",
    statusOk: "OK",
    shoppingListTitle: "Lista de Compras",
    copiedSubtitle: "Copiado al portapapeles. Pégalo en un mensaje o correo para tu gerente.",
    thisWasSent: "Esta lista de compras fue enviada:",
    submittedTitle: "¡Enviado!",
    submitting: "Enviando…",
    submittedThanks: "Enviado — ¡gracias!",
    couldntSubmitTry: "No se pudo enviar. Intenta de nuevo, o usa Copiar Lista de Reposición.",
    couldntSubmitConn: "No se pudo enviar — revisa tu conexión e intenta de nuevo.",
    resetConfirmOne: "¿Reiniciar la lista de {listing}? Esto borra todas las cantidades y marcas de esta propiedad.",
    resetConfirmAll: "¿Reiniciar la lista de todas las propiedades de {name}? Esto borra todas las cantidades y marcas.",
    restockListHeader: "Lista de reposición",
    everythingParListing: "Todo está al nivel mínimo o por encima en esta propiedad. No se necesita nada.",
    everythingParAll: "Todo está al nivel mínimo o por encima en todas las propiedades. No se necesita nada.",
    otherNotes: "otras notas:"
  }
};

// Item, category, and unit names — English is the canonical name used in
// items.js; these are the Spanish equivalents shown when Spanish is
// selected. Add to these if you add new items/categories/units.
const ES_ITEM_NAMES = {
  "Coffee": "Café",
  "Salt": "Sal",
  "Pepper": "Pimienta",
  "Cooking Oil": "Aceite de cocina",
  "Aluminum Foil": "Papel de aluminio",
  "Plastic Wrap": "Papel film",
  "Zip-top Bags": "Bolsas con cierre",
  "Dish Soap": "Jabón para platos",
  "Dishwasher Pods": "Cápsulas para lavavajillas",
  "Kitchen Sponge": "Esponja de cocina",
  "Paper Towels": "Toallas de papel",
  "Trash Bags": "Bolsas de basura",
  "Toilet Paper": "Papel higiénico",
  "Facial Tissue": "Pañuelos desechables",
  "Hand Soap": "Jabón de manos",
  "Shampoo": "Champú",
  "Conditioner": "Acondicionador",
  "Body Wash": "Gel de baño",
  "Mini Trash Bags": "Bolsas pequeñas de basura",
  "Detergent": "Detergente",
  "Dryer Sheets": "Toallitas para secadora",
  "Multi-surface Cleaner": "Limpiador multisuperficie",
  "Bathroom Cleaner": "Limpiador de baño",
  "Disinfectant Spray": "Spray desinfectante"
};

const ES_CATEGORY_NAMES = {
  "Kitchen Essentials": "Artículos esenciales de cocina",
  "Bathroom": "Baño",
  "Laundry": "Lavandería",
  "Cleaning Supplies": "Productos de limpieza"
};

const ES_UNIT_NAMES = {
  "bags": "bolsas",
  "containers": "recipientes",
  "bottles": "botellas",
  "rolls": "rollos",
  "boxes": "cajas",
  "packs": "paquetes",
  "pcs": "piezas"
};

function getLang() {
  return localStorage.getItem(LANG_STORAGE_KEY) || "es";
}

function setLang(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

// Every lookup below takes an optional langOverride, so a specific piece
// of text (e.g. the report sent to Formspree) can be forced into a
// language regardless of what's currently selected on screen.
function t(key, langOverride) {
  const lang = langOverride || getLang();
  const table = UI_STRINGS[lang] || UI_STRINGS.en;
  return table[key] !== undefined ? table[key] : (UI_STRINGS.en[key] || key);
}

function itemName(englishName, langOverride) {
  const lang = langOverride || getLang();
  if (lang !== "es") return englishName;
  return ES_ITEM_NAMES[englishName] || englishName;
}

function categoryName(englishName, langOverride) {
  const lang = langOverride || getLang();
  if (lang !== "es") return englishName;
  return ES_CATEGORY_NAMES[englishName] || englishName;
}

function unitName(englishUnit, langOverride) {
  const lang = langOverride || getLang();
  if (lang !== "es") return englishUnit;
  return ES_UNIT_NAMES[englishUnit] || englishUnit;
}

// Updates every piece of static (non-dynamically-built) text on the
// current page to match the current language. Safe to call on any page —
// elements that don't exist here are just skipped.
function applyStaticStrings() {
  document.documentElement.lang = getLang();

  const set = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  // Home page
  set("index-heading", "indexHeading");
  set("index-subtitle", "indexSubtitle");
  set("index-intro", "indexIntro");
  set("index-howto-label", "indexHowToLabel");
  set("index-howto-body", "indexHowToBody");

  // Checklist pages
  const pageHeadingEl = document.getElementById("page-heading");
  if (pageHeadingEl) {
    document.title = t("pageTitle") + " — " + (window.CLEANER_NAME || "");
  }
  set("page-heading", "pageHeading");
  set("assigned-to-label", "assignedTo");
  set("copy-btn", "copyBtn");
  set("submit-btn", "submitBtn");
  set("print-btn", "printBtn");
  set("reset-btn", "resetBtn");
  set("modal-title", "modalDefaultTitle");
  set("modal-subtitle", "modalDefaultSubtitle");
  set("close-modal-btn", "closeBtn");

  const footerEl = document.querySelector("footer.note");
  if (footerEl && footerEl.hasAttribute("data-i18n")) {
    footerEl.textContent = t("footerNote");
  }

  const enBtn = document.getElementById("lang-en-btn");
  const esBtn = document.getElementById("lang-es-btn");
  if (enBtn) enBtn.classList.toggle("active", getLang() === "en");
  if (esBtn) esBtn.classList.toggle("active", getLang() === "es");
}

// Wires up the "English" / "Español" buttons, if present on the page.
// rerenderFn (optional) is called after switching, so a page with
// dynamically-built content (like a checklist) can rebuild it in the
// new language.
function initLangToggle(rerenderFn) {
  const enBtn = document.getElementById("lang-en-btn");
  const esBtn = document.getElementById("lang-es-btn");

  function switchTo(lang) {
    if (getLang() === lang) return;
    setLang(lang);
    applyStaticStrings();
    if (typeof rerenderFn === "function") rerenderFn();
  }

  if (enBtn) enBtn.addEventListener("click", () => switchTo("en"));
  if (esBtn) esBtn.addEventListener("click", () => switchTo("es"));

  applyStaticStrings();
}
