/**
 * Bedside Display calendar proxy.
 *
 * REQUIRES the Advanced Calendar Service. In the editor: Services (+) >
 * Calendar API > Add. Without it `Calendar` is undefined and every request
 * fails with a ReferenceError.
 *
 * This deliberately does NOT use CalendarApp. CalendarApp.getEvents() was
 * measured at 32-46s per request, well past any sane client timeout.
 * Calendar.Events.list is a thin wrapper over the REST API and returns in
 * a couple of seconds.
 *
 * Deploy: Web app, "Execute as: Me", "Who has access: Anyone". See README.md.
 */

// 'primary' is your default calendar. Add more IDs to merge them.
const CALENDAR_IDS = ['primary'];

const DAYS_BEHIND = 1;
const DAYS_AHEAD = 1;

function doGet(e) {
  const params = (e && e.parameter) || {};
  const timeMin = (params.from ? new Date(params.from) : dayOffset(-DAYS_BEHIND));
  const timeMax = (params.to ? new Date(params.to) : dayOffset(DAYS_AHEAD + 1));

  const items = [];

  for (const id of CALENDAR_IDS) {
    const response = Calendar.Events.list(id, {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      fields: 'items(summary,start,end)',
    });

    if (response.items) items.push(...response.items);
  }

  // Already the Calendar API shape, so the client needs no translation:
  // all-day events carry start.date, timed events start.dateTime.
  return ContentService
    .createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}

function dayOffset(days) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
}
