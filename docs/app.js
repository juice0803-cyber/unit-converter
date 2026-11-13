import { categories, getUnit, parseAmount, convert, formatNumber } from './converter.js';

const $ = id => document.getElementById(id);
const states = {
  length: { amount: '100', from: 'cm', to: 'in' },
  weight: { amount: '1', from: 'kg', to: 'lb' },
};
let category = 'length';
let copyText = '';
let toastTimer;
const tabs = [...document.querySelectorAll('[data-category]')];

function makeOption(unit) {
  const option = document.createElement('option');
  option.value = unit.id;
  option.textContent = `${unit.name} (${unit.symbol})`;
  return option;
}

function setCategory(next) {
  category = next;
  const data = categories[category];
  const state = states[category];
  for (const tab of tabs) {
    const active = tab.dataset.category === category;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  $('conversion-panel').setAttribute('aria-labelledby', `${category}-tab`);
  for (const select of [$('from-unit'), $('to-unit')]) {
    select.replaceChildren();
    for (const system of ['metric', 'imperial']) {
      const group = document.createElement('optgroup');
      group.label = system === 'metric' ? '公制' : '英制 / 美制';
      group.append(...data.units.filter(unit => unit.system === system).map(makeOption));
      select.append(group);
    }
  }
  $('amount').value = state.amount;
  $('from-unit').value = state.from;
  $('to-unit').value = state.to;
  $('shortcuts').replaceChildren(...data.shortcuts.map(shortcut => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shortcut';
    const label = document.createElement('span');
    label.textContent = shortcut.label;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(label, arrow);
    button.addEventListener('click', () => {
      $('amount').value = shortcut.value;
      $('from-unit').value = shortcut.from;
      $('to-unit').value = shortcut.to;
      update();
    });
    return button;
  }));
  $('unit-tip').textContent = category === 'length'
    ? '1 英吋正好等於 2.54 公分。買螢幕、量尺寸時，換算一下更有底。'
    : '1 磅正好等於 0.45359237 公斤。食譜中的盎司使用常衡盎司，與液量盎司不同。';
  $('definition-note').textContent = category === 'length'
    ? '採用國際英吋、英呎與英里定義。結果依顯示精度四捨五入。'
    : '重量採常衡制；不含金衡盎司與液量盎司。公噸、美噸（短噸）、英噸（長噸）分別換算。結果依顯示精度四捨五入。';
  update();
}

function update() {
  const from = $('from-unit').value;
  const to = $('to-unit').value;
  const fromUnit = getUnit(category, from);
  const toUnit = getUnit(category, to);
  const precision = $('precision').value;
  Object.assign(states[category], { amount: $('amount').value, from, to });
  const parsed = parseAmount($('amount').value);
  let error = parsed.error;
  let value = null;
  if (parsed.value !== null) {
    try { value = convert(parsed.value, category, from, to); }
    catch (problem) { error = problem.message; }
  }
  $('input-error').textContent = error;
  $('amount').setAttribute('aria-invalid', String(Boolean(error)));
  $('input-symbol').textContent = fromUnit.symbol;
  $('result-symbol').textContent = toUnit.symbol;
  $('result').textContent = value === null ? '—' : formatNumber(value, precision);
  $('equation').textContent = value === null
    ? (error ? '調整輸入數值後，即可繼續換算。' : '輸入數字，立即查看換算結果。')
    : `${formatNumber(parsed.value)} ${fromUnit.name} = ${formatNumber(value, precision)} ${toUnit.name}`;
  $('copy').disabled = value === null;
  copyText = value === null ? '' : `${formatNumber(value, precision)} ${toUnit.symbol}`;
  $('reference-context').textContent = parsed.value === null || error
    ? '輸入有效數字後，查看所有單位'
    : `以目前輸入的 ${formatNumber(parsed.value)} ${fromUnit.name}換算`;
  $('equivalents').replaceChildren(...categories[category].units.map(unit => {
    const item = document.createElement('div');
    item.className = 'equivalent';
    const heading = document.createElement('div');
    heading.className = 'equivalent-top';
    const name = document.createElement('span');
    name.textContent = unit.name;
    const system = document.createElement('span');
    system.className = 'system-label';
    system.textContent = unit.system === 'metric' ? '公制' : '英 / 美制';
    heading.append(name, system);
    const number = document.createElement('p');
    number.className = 'equivalent-value';
    let equivalent = '—';
    if (parsed.value !== null && !error) {
      try { equivalent = formatNumber(convert(parsed.value, category, from, unit.id), precision); }
      catch { equivalent = '超出範圍'; }
    }
    number.append(document.createTextNode(equivalent));
    const symbol = document.createElement('span');
    symbol.textContent = unit.symbol;
    number.append(symbol);
    item.append(heading, number);
    return item;
  }));
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2400);
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => setCategory(tab.dataset.category));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs.find(item => item !== tab);
    setCategory(next.dataset.category);
    next.focus();
  });
});
$('amount').addEventListener('input', update);
for (const id of ['from-unit', 'to-unit', 'precision']) $(id).addEventListener('change', update);
$('swap').addEventListener('click', () => {
  const from = $('from-unit').value;
  $('from-unit').value = $('to-unit').value;
  $('to-unit').value = from;
  update();
});
$('copy').addEventListener('click', async () => {
  if (!copyText) return;
  try {
    await navigator.clipboard.writeText(copyText);
    toast('已複製換算結果');
  } catch {
    toast('無法使用剪貼簿，請選取結果後手動複製。');
  }
});
setCategory('length');
