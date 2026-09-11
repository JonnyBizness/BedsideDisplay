import { CONFIG } from './config.js';
import { getJSON, query } from './http.js';
import { clear, el, formatTime, pad2, parseISO, round1, svg } from './util.js';

const API = 'https://api.open-meteo.com/v1/forecast';

const VIEW_W = 760;
const VIEW_H = 150;
const TOP = 8;
const BASELINE = 112;
const LABEL_Y = 138;
const CHART_H = BASELINE - TOP;

let chartEl;
let summaryEl;

const buildUrl = () => `${API}?${query({
  latitude: CONFIG.LOCATION.latitude,
  longitude: CONFIG.LOCATION.longitude,
  hourly: 'precipitation,precipitation_probability',
  timezone: CONFIG.TIMEZONE,
  forecast_days: 1,
})}`;

function toHours(hourly) {
  if (!hourly || !hourly.time) return [];

  return hourly.time.slice(0, 24).map((stamp, i) => ({
    date: parseISO(stamp),
    mm: (hourly.precipitation && hourly.precipitation[i]) || 0,
    probability: (hourly.precipitation_probability &&
      hourly.precipitation_probability[i]) || 0,
  }));
}

function summarise(hours) {
  const total = hours.reduce((sum, hour) => sum + hour.mm, 0);
  const peak = hours.reduce(
    (best, hour) => (hour.probability > best.probability ? hour : best),
    hours[0],
  );

  if (total < 0.1 && peak.probability < 15) {
    return `Dry · peak ${peak.probability}%`;
  }
  return `${round1(total)} mm · peak ${peak.probability}% at ${formatTime(peak.date)}`;
}

// Colours live in CSS so the chart follows the theme; only the
// rain-intensity ramp is data-driven.
function barStyle({ mm }) {
  if (mm <= 0) return { className: 'rain-bar', opacity: 1 };
  return {
    className: 'rain-bar is-wet',
    opacity: 0.45 + Math.min(mm / 3, 1) * 0.55,
  };
}

function render(hours) {
  clear(chartEl);

  const root = svg('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    preserveAspectRatio: 'none',
  });

  root.append(
    svg('line', {
      class: 'rain-baseline',
      x1: 0, y1: BASELINE, x2: VIEW_W, y2: BASELINE,
    }),
    svg('line', {
      class: 'rain-grid',
      x1: 0, y1: TOP + CHART_H / 2, x2: VIEW_W, y2: TOP + CHART_H / 2,
    }),
  );

  const slot = VIEW_W / 24;
  const barW = slot - 10;

  hours.forEach((hour, i) => {
    const height = Math.max((hour.probability / 100) * CHART_H, 2);
    const { className, opacity } = barStyle(hour);

    root.append(svg('rect', {
      class: className,
      x: round1(i * slot + (slot - barW) / 2),
      y: round1(BASELINE - height),
      width: round1(barW),
      height: round1(height),
      rx: 2,
      'fill-opacity': opacity,
    }));

    if (i % 3 === 0) {
      const label = svg('text', {
        class: 'rain-hour',
        x: round1(i * slot + slot / 2),
        y: LABEL_Y,
        'text-anchor': 'middle',
      });
      label.textContent = pad2(i);
      root.append(label);
    }
  });

  const now = new Date();
  const nowX = ((now.getHours() * 60 + now.getMinutes()) / 1440) * VIEW_W;
  root.append(svg('line', {
    class: 'rain-now',
    x1: round1(nowX), y1: TOP - 4,
    x2: round1(nowX), y2: BASELINE + 5,
  }));

  chartEl.append(root);
}

export function init(options) {
  ({ chartEl, summaryEl } = options);
}

export async function refresh() {
  try {
    const data = await getJSON(buildUrl());
    const hours = toHours(data.hourly);
    if (!hours.length) throw new Error('No forecast data');

    render(hours);
    summaryEl.textContent = summarise(hours);
    return null;
  } catch (error) {
    clear(chartEl);
    chartEl.append(el('div', 'placeholder', 'Forecast unavailable'));
    summaryEl.textContent = '—';
    return `Weather: ${error.message}`;
  }
}
