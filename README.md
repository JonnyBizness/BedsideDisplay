# Bedside Display

A static single-page clock, three-day calendar, and rain chart for an iPad
running full-screen in portrait. No server, no build step — push to a repo and
enable GitHub Pages.

## Current state

| Piece | Status |
| --- | --- |
| Clock, rain chart, three-day columns | Built and working |
| Weather (Open-Meteo, Te Aro) | Live, no key needed |
| Calendar proxy (Apps Script) | Deployed, authorised, returning JSON |
| `CALENDAR_PROXY_URL` in `js/config.js` | Set and verified cross-origin |
| GitHub Pages | Not yet enabled |
| `SHOW_BOUNDS` | Still `true` — dotted preview outline is showing |

Apps Script project:
[13zjpiOP…cBCDh8nwi](https://script.google.com/home/projects/13zjpiOP0cyZ7fcvXNbhkb2y7QGB_f_7XhYiIL_TN87xOqLzcBCDh8nwi/settings)

Remaining to go live: set `SHOW_BOUNDS: false`, push, enable Pages, then
**On the iPad** below.

## Layout

```
index.html
css/styles.css
js/config.js     settings — proxy URL, location, formats, refresh intervals
js/util.js       date parsing, formatting, DOM/SVG helpers
js/http.js       fetch wrapper with timeout
js/clock.js      clock + date line
js/weather.js    Open-Meteo fetch + SVG rain chart
js/calendar.js   Google Calendar fetch + three-day columns
js/main.js       entry point, wiring and refresh scheduling

apps-script/Code.gs   calendar proxy, deployed to script.google.com
```

ES modules, loaded via `<script type="module">`. No bundler.

## Browser target

iPad Air (1st gen), which reaches **iOS 12 / Safari 12**. Chrome on iOS uses
the same WebKit, so Safari 12 is the ceiling either way.

Available: ES modules, `fetch`, `async`/`await`, arrow functions, template
literals, destructuring, `flatMap`, `Intl`, CSS Grid, CSS custom properties,
`AbortController`.

**Not** available — avoid these:

- `Promise.allSettled` (Safari 13)
- optional chaining `?.` and nullish coalescing `??` (Safari 13.1)
- `gap` on **flexbox** (Safari 14.1) — it works on Grid, which is why the
  calendar columns use Grid

Design canvas is **768 × 1024 CSS pixels** (portrait); 1536 × 2048 physical on
the Air's retina screen.

`SHOW_BOUNDS` in `js/config.js` draws a dotted outline at exactly that size so
a desktop browser preview shows precisely what the iPad will show. Turn it off
once the display is on the device.

## Configuration

### 1. Weather

**Already working.** Open-Meteo needs no key and sends CORS headers, so it
works from GitHub Pages as-is. `LOCATION` is set to Te Aro.

Do not expect finer placement to change anything: every central Wellington
coordinate tested — CBD, Te Aro, Courtenay Place — resolves to the same
forecast grid cell (-41.3005, 174.7059) and returns identical data. The model
grid is coarser than the city. To move it somewhere genuinely different, edit
`LOCATION` and `TIMEZONE` in `js/config.js`.

### 2. Google Calendar

**Already done.** The proxy is deployed and `CALENDAR_PROXY_URL` is set. What
follows is for changing it later.

**Why a proxy exists at all** — worth knowing before anyone tries to
"simplify" it away. A Google API key can only read *public* calendars, and
browser OAuth tokens expire after an hour with no silent refresh on Safari.
Neither survives on a display that runs for weeks. `apps-script/Code.gs` runs
as you, reads the calendar directly, and returns the same JSON shape the
Calendar API would — no API key, no Cloud Console project, nothing to host.

The `/exec` URL is a secret: anyone holding it can read the calendar. It also
ships inside the JavaScript the iPad downloads, so it is readable by anyone
who can load the page. That is inherent to a serverless build, not a mistake.

#### Required: the Advanced Calendar Service

In the script editor, **Services (+) → Calendar API → Add**. `Code.gs` calls
`Calendar.Events.list`, and without the service enabled `Calendar` is
undefined and every request throws.

It does not use `CalendarApp`, which looks simpler and needs no service, but
was measured at **32–46 seconds per request** — past any sane client timeout.
`Calendar.Events.list` returns in a couple of seconds. Do not "simplify" it
back.

#### Changing the script

Edit `apps-script/Code.gs` here, paste it into the project, then redeploy via
**Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy**.

**Do not use "New deployment".** It mints a fresh `/exec` URL while
`js/config.js` keeps pointing at the old one, and the only symptom is the
calendar quietly reading *unavailable*.

#### Adding more calendars

Add their IDs to `CALENDAR_IDS` at the top of `Code.gs`, then redeploy as
above. The script merges them server-side, so `js/config.js` needs no change.

#### When the calendar reads "unavailable"

Open the `/exec` URL in a **private/incognito window** — no Google session, so
it behaves exactly like the iPad. What you see tells you which thing broke:

| What you see | Cause |
| --- | --- |
| JSON starting `{"items":[` | Working; problem is elsewhere |
| Google sign-in page | Access is not **Anyone** (`Anyone with Google account` also fails) |
| "Unable to open the file" / 404 | No Web app deployment at that URL — it was replaced or deleted |
| "Access denied" / 403 | Deployment exists but is restricted |
| JSON, but takes 30s+ | Script is using `CalendarApp`; switch to the Advanced Calendar Service |
| Error mentioning `Calendar is not defined` | Advanced Calendar Service not added |

Status reads *Calendar: Request timed out* when a response takes longer than
`HTTP_TIMEOUT_MS` in `js/config.js`. Time the endpoint before raising it —
a slow script is the cause far more often than a tight timeout:

```bash
curl -s -o /dev/null -L -w "%{time_total}s ttfb=%{time_starttransfer}s\n" "<EXEC_URL>"
```

A fast `time_connect` with a slow `ttfb` means the script is slow, not the
network.

`curl -I` against `/exec` always returns 403 — Apps Script does not answer HEAD
requests. Use a normal GET when testing from a terminal.

#### Rebuilding from scratch

Only if the project is lost.

1. [script.google.com](https://script.google.com) → **New project**.
2. Paste `apps-script/Code.gs` over the stub.
3. **Project Settings** → time zone **Pacific/Auckland**. The default is US
   Pacific, and all-day events land on the wrong day if it is left there.
4. **Deploy → New deployment**. Click the **⚙ gear** beside "Select type" and
   choose **Web app** — left alone it deploys a *Library*, which returns a
   `/macros/library/…` URL that can never serve JSON.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorise it. The "unverified app" warning is expected for your own script:
   *Advanced* → *Go to (project name)*.
6. Verify in incognito, then put the `/exec` URL in `js/config.js`.

With `CALENDAR_PROXY_URL` blank, the columns render empty and show
*not configured*.

## Running for weeks

The display is built to be loaded once and left alone, not reloaded.

**It never reloads itself.** An earlier version reloaded every 6 hours to
shed memory. That was removed: if the network happened to be down at reload
time, the iPad would land on a browser error page and stay dead until someone
noticed. A stale display that recovers on its next poll is strictly better
than a blank one. Nothing accumulates between renders — each refresh clears
and rebuilds its nodes, and no listeners are added after startup.

**Polling is slow and forgiving.** Calendar hourly, weather every 30 minutes,
a 60s timeout and 2 retries with exponential backoff (5s, then 10s). A
transient failure never reaches the screen; a real one shows on the status
line and keeps retrying on the next tick.

**The clock tick can never die.** It reschedules itself inside a `try`, so an
error during a render costs one wrong minute instead of freezing the clock
forever. Do not "tidy" that `catch` away — a frozen clock is the one failure
this display cannot absorb.

**Staleness is visible.** The status line shows the last time *everything*
succeeded, with the day included once that is no longer today. `Updated
Tue 09:15` on a Friday means the calendar has been failing for days.

**Midnight rollover** is driven by the clock noticing the date changed, which
triggers a full refresh so the three-day columns advance.

## Local preview

ES modules will not load over `file://`. Use the bundled server rather than
`python -m http.server`:

```bash
python tools/serve.py 8123
```

It sends `Cache-Control: no-store`. Plain `http.server` lets Chrome cache ES
modules, which silently mixes old and new files after an edit — that produces
failures that look exactly like real bugs (a removed config key reads as
`undefined` and every request instantly "times out"). If you have already
cached files from a plain server, serve on a different port to get a clean
cache key.

## Deploying

**Not yet done.** Push to `main`, then Settings → Pages → deploy from `main` /
root. Free GitHub Pages only serves **public** repos; private needs a paid plan.

## On the iPad

**Not yet done.**

Open the Pages URL in Safari, Share → **Add to Home Screen**, then launch from
the icon. The `apple-mobile-web-app-capable` meta tag makes it run without
browser chrome. Set Settings → Display & Brightness → Auto-Lock → Never.

Then leave it. It does not reload itself — see **Running for weeks** above.

**After pushing an update**, the iPad keeps running the version it loaded at
open time; reload it by hand to pick up changes. GitHub Pages serves assets
with `max-age=600`, so if you reload within ten minutes of a push you can get
a mix of old and new modules. Wait, or reload twice.
