'use strict';

const STORAGE_KEY = 'gastos-hans-deylin';
const SPLIT = { propia: 0.2, mancomunada: 0.2, ahorro: 0.6 };
const PAYERS = { ambos: 'Ambos', hans: 'Hans', deylin: 'Deylin' };

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const fmt = (n) => money.format(Math.round(n));

// ---------- Cálculo ----------

function calculate(month) {
  const hans = Number(month.incomes.hans) || 0;
  const deylin = Number(month.incomes.deylin) || 0;
  const incomeTotal = hans + deylin;

  const hansShare = month.splitMode === 'equal' || incomeTotal === 0 ? 0.5 : hans / incomeTotal;
  const fixed = { hans: 0, deylin: 0 };
  let expensesTotal = 0;
  for (const e of month.expenses) {
    const amount = Number(e.amount) || 0;
    expensesTotal += amount;
    if (e.payer === 'hans') fixed.hans += amount;
    else if (e.payer === 'deylin') fixed.deylin += amount;
    else {
      fixed.hans += amount * hansShare;
      fixed.deylin += amount * (1 - hansShare);
    }
  }

  const person = (income, fixedCost) => {
    const remaining = income - fixedCost;
    const base = Math.max(0, remaining);
    return {
      income,
      fixed: fixedCost,
      remaining,
      propia: base * SPLIT.propia,
      mancomunada: base * SPLIT.mancomunada,
      ahorro: base * SPLIT.ahorro,
    };
  };

  const h = person(hans, fixed.hans);
  const d = person(deylin, fixed.deylin);
  const together = {
    mancomunada: h.mancomunada + d.mancomunada,
    ahorro: h.ahorro + d.ahorro,
  };
  together.total = together.mancomunada + together.ahorro;

  return { incomeTotal, expensesTotal, remainingTotal: incomeTotal - expensesTotal, hans: h, deylin: d, together };
}

// ---------- Estado / almacenamiento ----------

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // almacenamiento no disponible: la app sigue funcionando sin guardar
  }
}

function emptyMonth() {
  return { incomes: { hans: '', deylin: '' }, splitMode: 'proportional', expenses: [] };
}

function previousKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const db = load();
const $ = (id) => document.getElementById(id);
const now = new Date();
let currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

function current() {
  if (!db[currentKey]) db[currentKey] = emptyMonth();
  return db[currentKey];
}

// ---------- Render ----------

function renderExpenses() {
  const tbody = document.querySelector('#expenses tbody');
  tbody.replaceChildren();
  current().expenses.forEach((e, i) => {
    const tr = document.createElement('tr');

    const name = document.createElement('input');
    name.value = e.name;
    name.placeholder = 'Arriendo, luz, internet…';
    name.addEventListener('input', () => { e.name = name.value; save(); });

    const amount = document.createElement('input');
    amount.type = 'number';
    amount.min = '0';
    amount.inputmode = 'numeric';
    amount.value = e.amount;
    amount.placeholder = '0';
    amount.addEventListener('input', () => { e.amount = amount.value; update(); });

    const payer = document.createElement('select');
    for (const [value, label] of Object.entries(PAYERS)) payer.add(new Option(label, value));
    payer.value = e.payer;
    payer.addEventListener('change', () => { e.payer = payer.value; update(); });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.title = 'Eliminar';
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      current().expenses.splice(i, 1);
      renderExpenses();
      update();
    });

    for (const el of [name, amount, payer, remove]) {
      const td = document.createElement('td');
      td.append(el);
      tr.append(td);
    }
    tbody.append(tr);
  });
}

function renderList(dl, rows) {
  dl.replaceChildren();
  for (const [label, value, cls] of rows) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = fmt(value);
    if (cls) { dt.className = cls; dd.className = cls; }
    if (value < 0) dd.classList.add('negative');
    dl.append(dt, dd);
  }
}

function renderPerson(dl, p) {
  renderList(dl, [
    ['Ingresos', p.income],
    ['Gastos fijos', p.fixed],
    ['Sobrante', p.remaining, 'sep'],
    ['Plata propia (20%)', p.propia, 'sep big'],
    ['Mancomunada (20%)', p.mancomunada],
    ['Ahorro (60%)', p.ahorro],
  ]);
}

function update() {
  const r = calculate(current());
  $('income-total').textContent = fmt(r.incomeTotal);
  $('expenses-total').textContent = fmt(r.expensesTotal);
  $('remaining-total').textContent = fmt(r.remainingTotal);
  $('remaining-total').classList.toggle('negative', r.remainingTotal < 0);

  renderPerson(document.querySelector('#card-hans dl'), r.hans);
  renderPerson(document.querySelector('#card-deylin dl'), r.deylin);
  renderList(document.querySelector('#card-together dl'), [
    ['Mancomunada Hans', r.hans.mancomunada],
    ['Mancomunada Deylin', r.deylin.mancomunada],
    ['Total mancomunada', r.together.mancomunada, 'sep'],
    ['Ahorro Hans', r.hans.ahorro, 'sep'],
    ['Ahorro Deylin', r.deylin.ahorro],
    ['Total ahorro', r.together.ahorro, 'sep'],
    ['Total juntos', r.together.total, 'sep big'],
  ]);
  save();
}

function loadMonth() {
  const m = current();
  $('month').value = currentKey;
  $('income-hans').value = m.incomes.hans;
  $('income-deylin').value = m.incomes.deylin;
  $('split-mode').value = m.splitMode;
  renderExpenses();
  update();
}

// ---------- Eventos ----------

$('month').addEventListener('change', () => {
  if (!$('month').value) return;
  currentKey = $('month').value;
  loadMonth();
});
$('income-hans').addEventListener('input', (ev) => { current().incomes.hans = ev.target.value; update(); });
$('income-deylin').addEventListener('input', (ev) => { current().incomes.deylin = ev.target.value; update(); });
$('split-mode').addEventListener('change', (ev) => { current().splitMode = ev.target.value; update(); });
$('add-expense').addEventListener('click', () => {
  current().expenses.push({ name: '', amount: '', payer: 'ambos' });
  renderExpenses();
  update();
  document.querySelector('#expenses tbody tr:last-child input').focus();
});
$('copy-prev').addEventListener('click', () => {
  const prev = db[previousKey(currentKey)];
  if (!prev || prev.expenses.length === 0) {
    alert('El mes anterior no tiene gastos fijos guardados.');
    return;
  }
  const m = current();
  if (m.expenses.length && !confirm('¿Reemplazar los gastos fijos de este mes por los del mes anterior?')) return;
  m.expenses = prev.expenses.map((e) => ({ ...e }));
  renderExpenses();
  update();
});

loadMonth();
