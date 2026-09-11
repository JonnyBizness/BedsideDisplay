/**
 * Bedside Display calendar proxy.
 *
 * Paste into script.google.com, set the script timezone to Pacific/Auckland
 * in Project Settings, then Deploy > New deployment > Web app with
 * "Execute as: Me" and "Who has access: Anyone". See README.md.
 *
 * Returns the same JSON shape as the Google Calendar API, so the display
 * needs no API key and the calendar stays private.
 */

// 'primary' is your default calendar. Add more IDs to merge them.
const CALENDAR_IDS = ['primary'];

const DAYS_BEHIND = 1;
const DAYS_AHEAD = 1;

function doGet(e) {
  const params = (e && e.parameter) || {};
  const from = params.from ? new Date(params.from) : dayOffset(-DAYS_BEHIND);
  const to = params.to ? new Date(params.to) : dayOffset(DAYS_AHEAD + 1);

  const items = [];

  for (const id of CALENDAR_IDS) {
    const calendar = id === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(id);

    if (!calendar) continue;

    for (const event of calendar.getEvents(from, to)) {
      items.push(event.isAllDayEvent()
        ? {
          summary: event.getTitle(),
          // getAllDayEndDate is exclusive, matching the Calendar API.
          start: { date: ymd(event.getAllDayStartDate()) },
          end: { date: ymd(event.getAllDayEndDate()) },
        }
        : {
          summary: event.getTitle(),
          start: { dateTime: event.getStartTime().toISOString() },
          end: { dateTime: event.getEndTime().toISOString() },
        });
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}

function dayOffset(days) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
}

function ymd(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
