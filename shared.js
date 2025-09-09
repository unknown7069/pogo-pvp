// Simple shared state across pages using localStorage
// Exposes window.AppState with get/set/remove/clear helpers
(function (global) {
  const STORAGE_KEY = 'pogo-pvp-state';

  function safeParse(json) {
    try {
      return json ? JSON.parse(json) : {};
    } catch (_) {
      return {};
    }
  }

  let state = safeParse(localStorage.getItem(STORAGE_KEY));

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // noop if storage unavailable
    }
  }

  const api = {
    get(key, fallback = null) {
      return Object.prototype.hasOwnProperty.call(state, key)
        ? state[key]
        : fallback;
    },
    set(key, value) {
      state[key] = value;
      save();
    },
    remove(key) {
      delete state[key];
      save();
    },
    clear() {
      state = {};
      save();
    },
  };

  global.AppState = api;
})(window);

