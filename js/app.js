/**
 * Читает параметры формы.
 * @returns {Object}
 */
function readParams() {
  return {
    price: parseFloat($('price').value) || 0,
    advance: parseFloat($('advance').value) || 0,
    term: Math.round(parseFloat($('term').value) || 0),
    rate: parseFloat($('rate').value) || 0,
    vat: parseFloat($('vat').value) || 0,
    feePct: parseFloat($('feePct').value) || 0,
    kaskoPct: parseFloat($('kaskoPct').value) || 0,
    startDate: $('startDate').value,
    payDay: Math.min(28, Math.max(1, Math.round(parseFloat($('payDay').value) || 5))),
    roundPay: $('roundPay').checked
  };
}

/**
 * Пересчитывает итог и матрицу по текущим полям.
 * @returns {void}
 */
function update() {
  const p = readParams();
  renderMain(p, calc(p));
  renderMatrix(p);
}

document.querySelectorAll('input').forEach((el) => el.addEventListener('input', update));
$('addScenario').addEventListener('click', () => {
  const p = readParams();
  const r = calc(p);
  if (!r) return;
  saved.push({ price: p.price, advance: p.advance, term: p.term, rate: p.rate, kaskoPct: p.kaskoPct, pay: r.pay, monthly: r.monthly, first: r.first, totalAll: r.totalAll, over: r.over, irr: r.irr });
  storeSaved(saved);
  renderSaved();
});
$('saved').addEventListener('click', (e) => {
  const i = e.target.dataset && e.target.dataset.i;
  if (i === undefined) return;
  saved.splice(Number(i), 1);
  storeSaved(saved);
  renderSaved();
});
$('presetAl').addEventListener('click', () => {
  Object.entries({ price: 18500, advance: 4500, term: 48, rate: 24, vat: 20, feePct: 0.4, kaskoPct: 0, startDate: '2026-08-24', payDay: 5 })
    .forEach(([k, v]) => { $(k).value = v; });
  $('roundPay').checked = true;
  update();
});

update();
renderSaved();
