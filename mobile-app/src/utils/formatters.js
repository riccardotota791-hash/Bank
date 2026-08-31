const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatterCompact = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEuro(value, compact = false) {
  const n = Number.isFinite(value) ? value : 0;
  return compact ? currencyFormatterCompact.format(n) : currencyFormatter.format(n);
}

export function formatCompactAmount(value) {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M €`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k €`;
  return formatEuro(n, true);
}

export function formatPercent(value, decimals = 0) {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(decimals)}%`;
}

export function formatSignedPercent(value, decimals = 0) {
  const n = Number.isFinite(value) ? value : 0;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const MONTHS_IT_SHORT = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic',
];

export function monthLabel(monthKey, short = false) {
  const [year, month] = monthKey.split('-').map(Number);
  const name = short ? MONTHS_IT_SHORT[month - 1] : MONTHS_IT[month - 1];
  return short ? `${name} '${String(year).slice(2)}` : `${name} ${year}`;
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function currentMonthKey() {
  return monthKeyOf(todayISODate());
}

export function shiftMonthKey(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatDateIT(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_IT[m - 1]} ${y}`;
}
