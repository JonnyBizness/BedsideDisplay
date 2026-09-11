export const CONFIG = {

  // Apps Script web app /exec URL - see apps-script/Code.gs and README.md.
  // Treat as a secret: anyone with this URL can read the calendar.
  // Leave blank to disable the calendar.
  CALENDAR_PROXY_URL: 'https://script.google.com/macros/s/AKfycbzAOJJLLapFJiKwUolhE_YiCs5JfnMB8xQloNhzatS6BH0GXFBmKZ0imfbl01mch5o_mQ/exec',

  // Anywhere in central Wellington resolves to the same forecast grid
  // cell (-41.30, 174.71), so this is intent, not precision.
  LOCATION: {
    name: 'Te Aro, Wellington',
    latitude: -41.2945,
    longitude: 174.7745,
  },

  TIMEZONE: 'Pacific/Auckland',
  LOCALE: 'en-NZ',

  USE_24_HOUR: true,

  MAX_EVENTS_PER_DAY: 5,

  // Dotted outline showing the iPad Air viewport bounds. Turn off once
  // the display is on the device.
  SHOW_BOUNDS: true,

  REFRESH: {
    weatherMs: 30 * 60 * 1000,
    calendarMs: 60 * 60 * 1000,
  },

  // Tuned for a page that loads once and stays open for weeks: wait a long
  // time rather than give up, and retry a transient failure before showing
  // one. There is deliberately no automatic page reload - see README.
  HTTP: {
    timeoutMs: 60000,
    retries: 2,
    retryBackoffMs: 5000,
  },
};
