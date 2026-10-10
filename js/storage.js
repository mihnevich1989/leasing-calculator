/** Ключ списка сохранённых вариантов в localStorage. */
const STORE_KEY = 'leasing-calc-scenarios';

/**
 * Читает сохранённые варианты.
 * @returns {Object[]}
 */
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
}

/**
 * Записывает сохранённые варианты.
 * @param {Object[]} list
 * @returns {void}
 */
function storeSaved(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* хранилище недоступно */ }
}

/** @type {Object[]} */
let saved = loadSaved();
