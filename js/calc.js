/**
 * Считает график лизинга и итоги.
 * @param {Object} p
 * @param {number} p.price
 * @param {number} p.advance
 * @param {number} p.term
 * @param {number} p.rate
 * @param {number} p.vat
 * @param {number} p.feePct
 * @param {number} p.kaskoPct
 * @param {string} p.startDate
 * @param {number} p.payDay
 * @param {boolean} p.roundPay
 * @returns {Object|null}
 */
function calc(p) {
  const vatK = 1 + p.vat / 100;
  let r = p.rate / 100 / 12;                 // месячная ставка на сумму без НДС
  const gross = p.price - p.advance;          // финансируемая сумма с НДС
  if (p.term < 1 || gross <= 0 || p.price <= 0) return null;

  // Аннуитет на сумму с НДС по ставке r / (1 + НДС): вознаграждение НДС не облагается
  const annuity = (i) => (i === 0 ? gross / p.term : gross * i / (1 - Math.pow(1 + i, -p.term)));
  let pay = annuity(r / vatK);
  if (p.roundPay && r > 0) {
    // Как в графике лизингодателя: платёж округляется, ставка чуть подгоняется, чтобы остаток закрылся ровно
    pay = Math.round(pay);
    let lo = 0, hi = r / vatK * 2 + 0.01;
    for (let n = 0; n < 100; n++) {
      const mid = (lo + hi) / 2;
      if (annuity(mid) > pay) hi = mid; else lo = mid;
    }
    r = (lo + hi) / 2 * vatK;
  }

  const fee = p.price * p.feePct / 100;
  const kasko = p.price * p.kaskoPct / 100 / 12;  // годовая премия КАСКО, разбитая помесячно
  const { start, dates } = buildDates(p);
  let bal = gross / vatK;                     // остаток без НДС
  const rows = [];
  let sumPay = 0, sumRew = 0, sumPrin = 0, sumVat = 0, sumKasko = 0;

  for (let k = 1; k <= p.term; k++) {
    const rew = bal * r;
    let prin = (pay - rew) / vatK;
    if (k === p.term) prin = bal;             // последний платёж закрывает остаток
    const vatAmt = prin * (vatK - 1);
    const rewTotal = rew + (k === 1 ? fee : 0);
    const lease = rewTotal + prin + vatAmt;
    bal -= prin;
    rows.push({ k, date: dates[k - 1], lease, total: lease + kasko, rew: rewTotal, prin, vat: vatAmt, kasko, buyout: Math.max(0, bal) * vatK });
    sumPay += lease + kasko; sumRew += rewTotal; sumPrin += prin; sumVat += vatAmt; sumKasko += kasko;
  }

  // XIRR — без КАСКО: это стоимость самих денег, страховка — отдельный расход
  const flows = [{ d: start, v: gross }].concat(rows.map((x) => ({ d: x.date, v: -x.lease })));
  const totalAll = sumPay + p.advance;
  return {
    pay, fee, kasko, rows, start, gross,
    monthly: pay + kasko,
    first: rows[0].total,
    last: rows[rows.length - 1].total,
    sumPay, sumRew, sumPrin, sumVat, sumKasko,
    totalAll,
    over: totalAll - p.price,
    irr: xirr(flows)
  };
}

/**
 * Даты: аванс — дата договора, 1-й платёж через 2 дня, далее payDay каждого месяца начиная с (месяц договора + 2).
 * @param {Object} p
 * @param {string} p.startDate
 * @param {number} p.term
 * @param {number} p.payDay
 * @returns {{start: Date, dates: Date[]}}
 */
function buildDates(p) {
  const start = p.startDate ? new Date(p.startDate + 'T00:00:00') : new Date();
  const dates = [];
  const first = new Date(start);
  first.setDate(first.getDate() + 2);
  dates.push(first);
  for (let k = 2; k <= p.term; k++) {
    dates.push(new Date(start.getFullYear(), start.getMonth() + k, p.payDay));
  }
  return { start, dates };
}

/**
 * XIRR бисекцией: реальная годовая стоимость денег с учётом дат платежей.
 * @param {{d: Date, v: number}[]} flows
 * @returns {number}
 */
function xirr(flows) {
  const t0 = flows[0].d.getTime();
  const npv = (rate) => flows.reduce((s, f) => s + f.v / Math.pow(1 + rate, (f.d.getTime() - t0) / 864e5 / 365), 0);
  let lo = -0.99, hi = 10;
  if (npv(lo) * npv(hi) > 0) return NaN;
  for (let n = 0; n < 200; n++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
