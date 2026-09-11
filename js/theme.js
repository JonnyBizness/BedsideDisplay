const STORAGE_KEY = 'bedside-theme';
const LIGHT_CLASS = 'theme-light';

let root;
let isLight = false;

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

export function init(options) {
  root = options.root;

  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    stored = null;
  }
  apply(stored === 'light');

  // 'click' only. Listening for touchend as well double-fires on iOS
  // (touchend, then a synthetic click) and toggles twice per tap.
  // touch-action: manipulation removes the 300ms delay.
  document.addEventListener('click', toggle, false);
}
