/**
 * Обновляет итог, пояснение и график платежей.
 * @param {Object} p
 * @param {Object|null} res
 * @returns {void}
 */
function renderMain(p, res) {
  $('advancePct').textContent = p.price > 0 ? `${fmt(p.advance / p.price * 100, 2)}% от стоимости` : '';
  $('feeHint').textContent = `= ${fmt(p.price * p.feePct / 100)} BYN, добавляется к 1-му платежу`;
  $('kaskoHint').textContent = `= ${fmt(p.price * p.kaskoPct / 100)} BYN/год, по ${fmt(p.price * p.kaskoPct / 100 / 12)} в каждый платёж`;
  $('err').textContent = res ? '' : 'Проверьте параметры: аванс должен быть меньше стоимости, срок — от 1 месяца.';
  if (!res) {
    ['kMonthly', 'kFirst', 'kTotal', 'kOver', 'kKasko', 'kIrr'].forEach((id) => { $(id).textContent = '—'; });
    $('schedule').innerHTML = '';
    $('explain').textContent = '';
    return;
  }
  $('kMonthly').textContent = fmt(res.monthly);
  $('kMonthlyL').textContent = res.kasko > 0
    ? `Ежемесячный платёж (${fmt(res.pay)} лизинг + ${fmt(res.kasko)} КАСКО)`
    : 'Ежемесячный платёж';
  $('kKasko').textContent = fmt(res.sumKasko);
  $('kFirst').textContent = fmt(res.first);
  $('kTotal').textContent = fmt(res.totalAll);
  $('kOver').textContent = fmt(res.over);
  $('kIrr').textContent = fmt(res.irr * 100, 2) + '%';
  $('explain').innerHTML =
    `Финансируется <b>${fmt(res.gross)}</b> BYN (стоимость минус аванс). ` +
    `Ставка ${fmt(p.rate, 2)}% считается от суммы <b>без НДС</b>, а НДС на вознаграждение не берётся, ` +
    `поэтому фактически на ваши деньги это ≈ <b>${fmt(p.rate / (1 + p.vat / 100), 2)}%</b> номинальных годовых. ` +
    `С комиссией и ранним первым платежом реальная ставка (XIRR) — <b>${fmt(res.irr * 100, 2)}%</b>. ` +
    `Это значение и стоит сравнивать со ставкой банковского кредита.` +
    (res.kasko > 0 ? ` КАСКО в XIRR не входит (это отдельный расход), но учтено в платежах, итоге и переплате.` : '');

  let html = '<thead><tr><th>№</th><th>Дата</th><th>Платёж итого</th><th>Лизинг с НДС</th><th>Вознаграждение</th><th>Стоимость без НДС</th><th>НДС</th><th>КАСКО</th><th>Выкуп после платежа</th></tr></thead><tbody>';
  html += `<tr><td>аванс</td><td>${fmtDate(res.start)}</td><td>${fmt(p.advance)}</td><td>${fmt(p.advance)}</td><td>0,00</td><td>${fmt(p.advance / (1 + p.vat / 100))}</td><td>${fmt(p.advance - p.advance / (1 + p.vat / 100))}</td><td>0,00</td><td>${fmt(res.gross)}</td></tr>`;
  res.rows.forEach((x) => {
    html += `<tr><td>${x.k}</td><td>${fmtDate(x.date)}</td><td>${fmt(x.total)}</td><td>${fmt(x.lease)}</td><td>${fmt(x.rew)}</td><td>${fmt(x.prin)}</td><td>${fmt(x.vat)}</td><td>${fmt(x.kasko)}</td><td>${fmt(x.buyout)}</td></tr>`;
  });
  const advNet = p.advance / (1 + p.vat / 100);
  html += `</tbody><tfoot><tr><td>Итого</td><td></td><td>${fmt(res.totalAll)}</td><td>${fmt(res.totalAll - res.sumKasko)}</td><td>${fmt(res.sumRew)}</td><td>${fmt(res.sumPrin + advNet)}</td><td>${fmt(res.sumVat + p.advance - advNet)}</td><td>${fmt(res.sumKasko)}</td><td></td></tr></tfoot>`;
  $('schedule').innerHTML = html;
}

/**
 * Строит матрицу аванс × срок.
 * @param {Object} p
 * @returns {void}
 */
function renderMatrix(p) {
  const advs = parseList($('mAdv').value);
  const terms = parseList($('mTerm').value).map(Math.round).filter((t) => t >= 1);
  const limit = parseFloat($('mLimit').value) || Infinity;
  const cells = advs.map((a) => terms.map((t) => calc({ ...p, advance: a, term: t })));

  let best = null;
  cells.forEach((row, ai) => row.forEach((c, ti) => {
    if (c && c.monthly <= limit && (!best || c.over < best.over)) best = { ai, ti, over: c.over };
  }));

  let html = '<thead><tr><th>Аванс \\ срок</th>' + terms.map((t) => `<th>${t} мес</th>`).join('') + '</tr></thead><tbody>';
  advs.forEach((a, ai) => {
    html += `<tr><td>${fmt(a, 0)} <small style="color:var(--muted)">(${fmt(a / p.price * 100, 1)}%)</small></td>`;
    terms.forEach((t, ti) => {
      const c = cells[ai][ti];
      const cls = [];
      if (best && best.ai === ai && best.ti === ti) cls.push('best');
      if (a === p.advance && t === p.term) cls.push('cur');
      html += c
        ? `<td class="${cls.join(' ')}" title="Реальная ставка ${fmt(c.irr * 100, 2)}%">${fmt(c.monthly)}<small>+${fmt(c.over, 0)}</small></td>`
        : '<td>—</td>';
    });
    html += '</tr>';
  });
  $('matrix').innerHTML = html + '</tbody>';
}

/**
 * Рисует таблицу сохранённых вариантов.
 * @returns {void}
 */
function renderSaved() {
  $('savedEmpty').style.display = saved.length ? 'none' : '';
  if (!saved.length) { $('saved').innerHTML = ''; return; }
  const minOver = Math.min(...saved.map((s) => s.over));
  let html = '<thead><tr><th>Вариант</th><th>Аванс</th><th>Срок</th><th>Ставка</th><th>КАСКО</th><th>Платёж</th><th>1-й платёж</th><th>Всего</th><th>Переплата</th><th>XIRR</th><th></th></tr></thead><tbody>';
  saved.forEach((s, idx) => {
    html += `<tr><td>${fmt(s.price, 0)} BYN</td><td>${fmt(s.advance, 0)}</td><td>${s.term}</td><td>${fmt(s.rate, 2)}%</td>` +
      `<td>${fmt(s.kaskoPct || 0, 2)}%</td><td>${fmt(s.monthly ?? s.pay)}</td><td>${fmt(s.first)}</td><td>${fmt(s.totalAll)}</td>` +
      `<td style="${s.over === minOver ? 'color:var(--good);font-weight:650' : ''}">${fmt(s.over)}</td>` +
      `<td>${fmt(s.irr * 100, 2)}%</td><td><button class="del" data-i="${idx}">✕</button></td></tr>`;
  });
  $('saved').innerHTML = html + '</tbody>';
}
