import { CONFIG } from './config.js';
import * as Calendar from './calendar.js';
import * as Clock from './clock.js';
import * as Theme from './theme.js';
import * as Weather from './weather.js';
import { formatDayLabel, formatTime, isSameDay } from './util.js';

const byId = (id) => document.getElementById(id);

const failures = { weather: null, calendar: null };

let statusEl;
let lastHealthyAt = null;

// Bare time is ambiguous once the display has been up for days, so show
// the day too when the last good update was not today.
function stamp(date) {
  return isSameDay(date, new Date())
    ? formatTime(date, true)
    : `${formatDayLabel(date)} ${formatTime(date, true)}`;
}

function setStatus() {
  const current = [failures.weather, failures.calendar].filter(Boolean);
  const lead = lastHealthyAt ? `Updated ${stamp(lastHealthyAt)}` : 'Starting';

  statusEl.textContent = [lead, ...current].join(' · ');
  statusEl.classList.toggle('status-error', current.length > 0);
}

async function run(source, refresh) {
  failures[source] = await refresh();
  if (!failures.weather && !failures.calendar) lastHealthyAt = new Date();
  setStatus();
}

function refreshAll() {
  run('weather', Weather.refresh);
  run('calendar', Calendar.refresh);
}

function start() {
  statusEl = byId('status');

  if (CONFIG.SHOW_BOUNDS) byId('app').classList.add('app-bounds');

  Theme.init({ root: document.documentElement });

  Weather.init({ chartEl: byId('rain-chart'), summaryEl: byId('rain-summary') });
  Calendar.init({ daysEl: byId('days'), noteEl: byId('calendar-note') });

  // Fires onDayChange immediately, which performs the initial load, and
  // again at every midnight so the three-day columns roll over.
  Clock.start({
    timeEl: byId('clock'),
    meridiemEl: byId('clock-meridiem'),
    dateEl: byId('date-line'),
    onDayChange: refreshAll,
  });

  setInterval(() => run('weather', Weather.refresh), CONFIG.REFRESH.weatherMs);
  setInterval(() => run('calendar', Calendar.refresh), CONFIG.REFRESH.calendarMs);
}

start();
