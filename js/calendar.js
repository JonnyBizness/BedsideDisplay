import { CONFIG } from './config.js';
import { getJSON, query } from './http.js';
import {
  addDays, clear, el, formatDayLabel, formatTime, isSameDay, parseISO, startOfDay,
} from './util.js';

// Yesterday, today, tomorrow - today in the middle.
const OFFSETS = [-1, 0, 1];

let daysEl;
let noteEl;

const buildUrl = (from, to) => `${CONFIG.CALENDAR_PROXY_URL}?${query({
  from: from.toISOString(),
  to: to.toISOString(),
})}`;

function normalise(item) {
  const allDay = Boolean(item.start && item.start.date);
  const start = parseISO(allDay ? item.start.date : item.start.dateTime);
  if (!start) return null;

  const rawEnd = item.end ? (item.end.date || item.end.dateTime) : null;
  const end = parseISO(rawEnd) || start;

  return {
    title: item.summary || '(no title)',
    allDay,
    start,
    // Google's all-day end date is exclusive; step back into the last real day.
    end: allDay ? addDays(end, -1) : end,
  };
}

const compare = (a, b) =>
  (a.allDay === b.allDay ? a.start - b.start : (a.allDay ? -1 : 1));

const eventsForDay = (events, day) => events
  .filter((event) => (event.allDay
    ? startOfDay(event.start) <= day && day <= startOfDay(event.end)
    : isSameDay(event.start, day)))
  .sort(compare);

function renderEvent(event) {
  const row = el('div', event.allDay ? 'event event-allday' : 'event');
  row.append(
    el('span', 'event-time', event.allDay ? 'all day' : formatTime(event.start)),
    el('span', 'event-title', event.title),
  );
  return row;
}

function renderColumn(day, events, offset, cap) {
  const classes = ['day'];
  if (offset === 0) classes.push('day-today');
  if (offset < 0) classes.push('day-past');

  const column = el('div', classes.join(' '));
  column.append(el('div', 'day-label', formatDayLabel(day)));

  const list = el('div', 'day-events');
  if (!events.length) {
    list.append(el('div', 'placeholder', '—'));
  } else {
    const shown = Math.min(events.length, cap);
    events.slice(0, shown).forEach((event, i) => {
      const row = renderEvent(event);
      // Inline rather than its own line, so the marker never costs a
      // whole extra row in a short column.
      if (i === shown - 1 && events.length > shown) {
        row.append(el('span', 'event-more', ` +${events.length - shown}`));
      }
      list.append(row);
    });
  }

  column.append(list);
  return column;
}

function paint(events, cap) {
  const today = new Date();
  clear(daysEl);
  for (const offset of OFFSETS) {
    const day = addDays(today, offset);
    daysEl.append(renderColumn(day, eventsForDay(events, day), offset, cap));
  }
}

// Each column clips independently, so the grid container never reports
// overflow - measure the columns themselves.
const anyColumnOverflows = () => Array.from(daysEl.children)
  .some((column) => column.scrollHeight > column.clientHeight + 1);

// Drop the per-day cap until every column fits, so a half-cut event
// row never appears.
function renderDays(events) {
  let cap = CONFIG.MAX_EVENTS_PER_DAY;
  paint(events, cap);

  while (cap > 1 && anyColumnOverflows()) {
    cap -= 1;
    paint(events, cap);
  }
}

const isConfigured = () => Boolean(CONFIG.CALENDAR_PROXY_URL);

export function init(options) {
  ({ daysEl, noteEl } = options);
  renderDays([]);
}

export async function refresh() {
  if (!isConfigured()) {
    renderDays([]);
    noteEl.textContent = 'not configured';
    return null;
  }

  const today = new Date();
  const from = addDays(startOfDay(today), OFFSETS[0]);
  const to = addDays(startOfDay(today), OFFSETS[OFFSETS.length - 1] + 1);

  try {
    const data = await getJSON(buildUrl(from, to));
    const events = (data.items || []).map(normalise).filter(Boolean);

    renderDays(events);
    noteEl.textContent = `${events.length} ${events.length === 1 ? 'event' : 'events'}`;
    return null;
  } catch (error) {
    // Leave the last good render on screen rather than blanking the columns.
    noteEl.textContent = 'unavailable';
    return `Calendar: ${error.message}`;
  }
}
