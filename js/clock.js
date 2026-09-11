import { CONFIG } from './config.js';
import { formatTime, formatLongDate, meridiem } from './util.js';

let timeEl;
let meridiemEl;
let dateEl;
let onDayChange;
let lastDayKey = '';

const dayKey = (date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function render() {
  const now = new Date();

  timeEl.textContent = formatTime(now);
  if (!CONFIG.USE_24_HOUR) meridiemEl.textContent = meridiem(now);

  const key = dayKey(now);
  if (key !== lastDayKey) {
    lastDayKey = key;
    dateEl.textContent = formatLongDate(now);
    if (onDayChange) onDayChange(now);
  }
}

// Re-align to the next minute boundary after each tick; setInterval
// drifts badly on a device left idle for weeks.
function scheduleNext() {
  const now = Date.now();
  const delay = 60000 - (now % 60000);
  setTimeout(() => {
    render();
    scheduleNext();
  }, delay + 50);
}

export function start(options) {
  ({ timeEl, meridiemEl, dateEl, onDayChange } = options);

  if (CONFIG.USE_24_HOUR) meridiemEl.hidden = true;

  render();
  scheduleNext();
}
