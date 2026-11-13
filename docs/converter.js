// International yard and pound definitions. Mass uses avoirdupois units.
export const categories = {
  length: {
    name: '長度', english: 'LENGTH', base: '公尺',
    units: [
      { id: 'mm', name: '毫米', symbol: 'mm', system: 'metric', factor: 0.001 },
      { id: 'cm', name: '公分', symbol: 'cm', system: 'metric', factor: 0.01 },
      { id: 'm', name: '公尺', symbol: 'm', system: 'metric', factor: 1 },
      { id: 'km', name: '公里', symbol: 'km', system: 'metric', factor: 1000 },
      { id: 'in', name: '英吋', symbol: 'in', system: 'imperial', factor: 0.0254 },
      { id: 'ft', name: '英呎', symbol: 'ft', system: 'imperial', factor: 0.3048 },
      { id: 'yd', name: '碼', symbol: 'yd', system: 'imperial', factor: 0.9144 },
      { id: 'mi', name: '英里', symbol: 'mi', system: 'imperial', factor: 1609.344 },
    ],
    shortcuts: [
      { label: '公分 → 英吋', from: 'cm', to: 'in', value: '1' },
      { label: '公尺 → 英呎', from: 'm', to: 'ft', value: '1' },
      { label: '公里 → 英里', from: 'km', to: 'mi', value: '1' },
    ],
  },
  weight: {
    name: '重量', english: 'WEIGHT', base: '公斤',
    units: [
      { id: 'mg', name: '毫克', symbol: 'mg', system: 'metric', factor: 0.000001 },
      { id: 'g', name: '公克', symbol: 'g', system: 'metric', factor: 0.001 },
      { id: 'kg', name: '公斤', symbol: 'kg', system: 'metric', factor: 1 },
      { id: 't', name: '公噸', symbol: 't', system: 'metric', factor: 1000 },
      { id: 'oz', name: '盎司（常衡）', symbol: 'oz', system: 'imperial', factor: 0.028349523125 },
      { id: 'lb', name: '磅', symbol: 'lb', system: 'imperial', factor: 0.45359237 },
      { id: 'st', name: '英石', symbol: 'st', system: 'imperial', factor: 6.35029318 },
      { id: 'short-ton', name: '美噸（短噸）', symbol: 'US ton', system: 'imperial', factor: 907.18474 },
      { id: 'long-ton', name: '英噸（長噸）', symbol: 'UK ton', system: 'imperial', factor: 1016.0469088 },
    ],
    shortcuts: [
      { label: '公斤 → 磅', from: 'kg', to: 'lb', value: '1' },
      { label: '公克 → 盎司', from: 'g', to: 'oz', value: '1' },
      { label: '磅 → 公斤', from: 'lb', to: 'kg', value: '1' },
    ],
  },
};

export function parseAmount(raw) {
  const text = String(raw).normalize('NFKC').trim();
  if (!text) return { value: null, error: '' };
  // Accept ungrouped decimals or correctly grouped thousands, with optional exponent.
  const pattern = /^[+]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
  if (!pattern.test(text)) return { value: null, error: '請輸入大於或等於 0 的有效數字。' };
  const value = Number(text.replaceAll(',', ''));
  if (!Number.isFinite(value)) return { value: null, error: '數值太大，請輸入較小的數字。' };
  const mantissa = text.split(/[eE]/)[0];
  if (value === 0 && /[1-9]/.test(mantissa)) return { value: null, error: '數值太小，請輸入較大的數字。' };
  return { value, error: '' };
}

export function getUnit(category, id) {
  const unit = categories[category]?.units.find(item => item.id === id);
  if (!unit) throw new RangeError('未知的單位');
  return unit;
}

export function convert(value, category, from, to) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('無效的數值');
  const fromUnit = getUnit(category, from);
  const toUnit = getUnit(category, to);
  const ratio = fromUnit.factor / toUnit.factor;
  const result = value * ratio;
  if (!Number.isFinite(result)) throw new RangeError('換算結果太大，請減小輸入數值。');
  if (value !== 0 && result === 0) throw new RangeError('換算結果太小，請增加輸入數值。');
  return result;
}

export function formatNumber(value, precision = 'auto') {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return precision === 'auto' ? '0' : (0).toFixed(Number(precision));
  if (Math.abs(value) >= 1e12 || Math.abs(value) < 1e-6) {
    return value.toExponential(precision === 'auto' ? 7 : Number(precision)).replace(/(\.\d*?[1-9])0+e|\.0+e/, '$1e');
  }
  if (precision !== 'auto' && Number(value.toFixed(Number(precision))) === 0) {
    return value.toExponential(Number(precision));
  }
  return new Intl.NumberFormat('zh-TW', precision === 'auto'
    ? { maximumSignificantDigits: 8 }
    : { minimumFractionDigits: Number(precision), maximumFractionDigits: Number(precision) }).format(value);
}
