/**
 * Возвращает элемент по id.
 * @param {string} id
 * @returns {HTMLElement}
 */
const $ = (id) => document.getElementById(id);

/**
 * Форматирует число в ru-RU.
 * @param {number} v
 * @param {number} [d]
 * @returns {string}
 */
const fmt = (v, d = 2) => Number.isFinite(v)
  ? v.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d })
  : '—';

/**
 * Форматирует дату в ru-RU.
 * @param {Date} d
 * @returns {string}
 */
const fmtDate = (d) => d.toLocaleDateString('ru-RU');

/**
 * Разбирает список чисел из строки.
 * @param {string} s
 * @returns {number[]}
 */
const parseList = (s) => s.split(/[,;\s]+/).map((x) => parseFloat(x.replace(',', '.'))).filter((x) => Number.isFinite(x) && x >= 0);
