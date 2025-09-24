(function (global: Window & typeof window) {

  var STORAGE_KEY = 'pogo-pvp-state';

  // --- Utils ---------------------------------------------------------------
  function safeParse(json: string | null) {
    if (!json) return {} as Record<string, any>;
    try { return JSON.parse(json) as Record<string, any>; } catch (_) { return {} as Record<string, any>; }
  }

  function storageAvailable() {
    try {
      var testKey = '__appstate_test__';
      global.localStorage.setItem(testKey, '1');
      global.localStorage.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  }

  var hasStorage = storageAvailable();

  // --- Backing store -------------------------------------------------------
  var state: Record<string, any> = (function init() {
    if (!hasStorage) return {} as Record<string, any>;
    return safeParse(global.localStorage.getItem(STORAGE_KEY));
  }());

  function persist(next: Record<string, any>) {
    if (!hasStorage) return;
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {
      // Quota exceeded or storage blocked; keep in-memory state as source of truth.
    }
  }

  // --- Pub/Sub for change notifications (optional) -------------------------
  var listeners = new Set<StateListener>();
  function notify() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (_) {}
    });
  }

  // Keep other tabs/windows in sync.
  if (hasStorage && global.addEventListener) {
    global.addEventListener('storage', function (e) {
      if (e.key !== STORAGE_KEY) return;
      state = safeParse(e.newValue);
      notify();
    });
  }

  // --- Public API ----------------------------------------------------------
  var api = {
    get: function (key: string, fallback?: unknown) {
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : (arguments.length > 1 ? fallback ?? null : null);
    },
    set: function (key: string, value: unknown) {
      if (Object.prototype.hasOwnProperty.call(state, key) && state[key] === value) return;
      state[key] = value;
      persist(state);
      notify();
    },
    remove: function (key: string) {
      if (!Object.prototype.hasOwnProperty.call(state, key)) return;
      delete state[key];
      persist(state);
      notify();
    },
    clear: function () {
      if (Object.keys(state).length === 0) return;
      state = {};
      persist(state);
      notify();
    },
    keys: function () { return Object.keys(state); },
    all: function () { return Object.assign({}, state); },
    read: function () { return Object.assign({}, state); },
    replace: function (next: Record<string, any>) {
      state = Object(next) === next ? Object.assign({}, next) : {};
      persist(state);
      notify();
    },
    merge: function (patch: Record<string, any>) {
      if (Object(patch) !== patch) return;
      var changed = false;
      for (var k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k) && state[k] !== patch[k]) {
          state[k] = patch[k];
          changed = true;
        }
      }
      if (changed) { persist(state); notify(); }
    },
    write: function (patch: Record<string, any>) { (this as any).merge(patch); },
    subscribe: function (fn: StateListener) {
      if (typeof fn !== 'function') return function () {};
      listeners.add(fn);
      try { fn(state); } catch (_) {}
      return function () { listeners.delete(fn); };
    }
  } as unknown as AppStateApi;

  global.AppState = api;

  var sharedStateHelpers: Record<string, any> = {
    readState: function () { return api.read(); },
    writeState: function (patch: Record<string, any>) { api.write(patch); },
    mergeState: function (patch: Record<string, any>) { api.merge(patch); },
    replaceState: function (next: Record<string, any>) { api.replace(next); },
    clearState: function () { api.clear(); },
    getStateValue: function (key: string, fallback?: unknown) { return api.get(key, fallback); },
    setStateValue: function (key: string, value: unknown) { api.set(key, value); },
    removeStateValue: function (key: string) { api.remove(key); },
    subscribeState: function (fn: StateListener) { return api.subscribe(fn); }
  };

  Object.keys(sharedStateHelpers).forEach(function (key) {
    (global as Record<string, any>)[key] = sharedStateHelpers[key];
  });

})(window);

