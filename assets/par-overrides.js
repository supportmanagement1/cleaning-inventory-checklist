/**
 * Custom par (minimum) levels, per property, for every cleaner's site.
 *
 * Each property name below is a key. Inside it, list only the items you
 * want to override — anything you leave out just uses the default "par"
 * value set in items.js. An empty {} means "use all the defaults."
 *
 * This file is meant to be edited from admin.html — open that page,
 * adjust numbers there, and it will generate an updated version of this
 * file for you to paste back in. You can also edit it by hand here if
 * you prefer; the format is the same either way.
 */
const PAR_OVERRIDES = {
  "Bates Walk": {},
  "Edgar's Bungalow": {},
  "Capitol Hill": {},
  "Ravensdale Cabin": {},
  "Lake Ridge Ramble": {},
  "Ballard Home": {},
  "Casa Spanaway": {},
  "Queen Anne": {},
  "Saltar's Inn – Suite 1": {},
  "Saltar's Inn – Suite 2": {},
  "Saltar's Inn – Suite 3": {}
};

// Looks up the effective par for an item at a given property — the
// property's custom number above if one is set, otherwise the default
// from items.js.
function parFor(propertyName, itemNameKey, defaultPar) {
  const overrides = PAR_OVERRIDES[propertyName];
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, itemNameKey)) {
    return overrides[itemNameKey];
  }
  return defaultPar;
}
