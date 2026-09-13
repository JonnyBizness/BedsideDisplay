const STORAGE_KEY = 'bedside-theme';
const LIGHT_CLASS = 'theme-light';

// iOS fires a synthetic click ~300ms after touchend. Ignore a click that
// closely follows a touch, or one tap toggles twice and appears to do nothing.
const GHOST_CLICK_MS = 700;

// Ignore a drag or a wipe of the screen; only a stationary tap counts.
const MOVE_TOLERANCE_PX = 24;

let root;
let isLight = false;
let lastTouchAt = 0;
let touchStart = null;

function apply(light) {
  isLight = light;
  root.classList.toggle(LIGHT_CLASS, light);

  try {
    localStorage.setItem(STORAGE_KEY, light ? 'light' : 'dark');
  } catch (error) {
    // Private browsing blocks writes; the theme just will not persist.
  }
}

export function toggle() {
  apply(!isLight);
}

function onTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
}

function onTouchEnd(event) {
  lastTouchAt = Date.now();

  const touch = event.changedTouches[0];
  if (touchStart && touch) {
    const moved = Math.hypot(
      touch.clientX - touchStart.x,
      touch.clientY - touchStart.y,
    );
    if (moved > MOVE_TOLERANCE_PX) return;
  }

  toggle();
}

function onClick() {
  if (Date.now() - lastTouchAt < GHOST_CLICK_MS) return;
  toggle();
}

export function init(options) {
  root = options.root;

  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    stored = null;
  }
  apply(stored === 'light');

  // Both listeners are needed. iOS Safari does not dispatch click on
  // non-interactive elements, so touchend is what actually fires there;
  // click is what fires on a desktop browser. The guard above stops a
  // device that sends both from counting one tap twice.
  document.addEventListener('touchstart', onTouchStart, false);
  document.addEventListener('touchend', onTouchEnd, false);
  document.addEventListener('click', onClick, false);
}
