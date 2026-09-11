import { CONFIG } from './config.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const dayNameFormat = new Intl.DateTimeFormat(CONFIG.LOCALE, { weekday: 'short' });
const longDateFormat = new Intl.DateTimeFormat(CONFIG.LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export const pad2 = (n) => String(n).padStart(2, '0');

// Hand-rolled: bare "YYYY-MM-DD" from Google's all-day events parses as
// UTC midnight natively, which lands on the wrong day in NZ.
export function parseISO(str) {
  if (!str) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
    .exec(str);

  if (!m) {
    const loose = new Date(str);
    return Number.isNaN(loose.getTime()) ? null : loose;
  }

  const [, year, month, day, hour, minute, second, zone] = m;
  const y = Number(year);
  const mo = Number(month) - 1;
  const d = Number(day);

  if (hour === undefined) return new Date(y, mo, d);

  const hh = Number(hour);
  const mm = Number(minute);
  const ss = second ? Number(second) : 0;

  if (!zone) return new Date(y, mo, d, hh, mm, ss);

  let ms = Date.UTC(y, mo, d, hh, mm, ss);
  if (zone !== 'Z') {
    const sign = zone[0] === '-' ? -1 : 1;
    const digits = zone.slice(1).replace(':', '');
    const offsetMin = sign *
      (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)));
    ms -= offsetMin * 60000;
  }
  return new Date(ms);
}

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date, n) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function formatTime(date, use24 = CONFIG.USE_24_HOUR) {
  const minutes = pad2(date.getMinutes());
  if (use24) return `${pad2(date.getHours())}:${minutes}`;
  const hour = date.getHours() % 12 || 12;
  return `${hour}:${minutes}`;
}

export const meridiem = (date) => (date.getHours() < 12 ? 'am' : 'pm');

export const formatLongDate = (date) => longDateFormat.format(date);

export const formatDayLabel = (date) =>
  `${dayNameFormat.format(date)} ${date.getDate()}`;

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

export function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export const round1 = (n) => Math.round(n * 10) / 10;
