import { CONFIG } from './config.js';
import * as Calendar from './calendar.js';
import * as Clock from './clock.js';
import * as Theme from './theme.js';
import * as Weather from './weather.js';
import { formatTime } from './util.js';

const byId = (id) => document.getElementById(id);

let statusEl;

function setStatus(errors) {
  const parts = [`Updated ${formatTime(new Date(), true)}`, ...errors];
  statusEl.textContent = parts.join(' · ');
  statusEl.classList.toggle('status-error', errors.length > 0);
}

async function refreshAll() {
  const errors = (await Promise.all([Weather.refresh(), Calendar.refresh()]))
    .filter(Boolean);
  setStatus(errors);
}

function start() {
  statusEl = byId('status');

  if (CONFIG.SHOW_BOUNDS) byId('app').classList.add('app-bounds');

  Theme.init({ root: document.documentElement });

  Weather.init({ chartEl: byId('rain-chart'), summaryEl: byId('rain-summary') });
  Calendar.init({ daysEl: byId('days'), noteEl: byId('calendar-note') });

  Clock.start({
    timeEl: byId('clock'),
    meridiemEl: byId('clock-meridiem'),
    dateEl: byId('date-line'),
    onDayChange: refreshAll,
  });

  setInterval(() => Weather.refresh().then((e) => setStatus(e ? [e] : [])),
    CONFIG.REFRESH.weatherMs);
  setInterval(() => Calendar.refresh().then((e) => setStatus(e ? [e] : [])),
    CONFIG.REFRESH.calendarMs);
  setInterval(() => window.location.reload(), CONFIG.REFRESH.reloadMs);
}

start();
