(function (global) {
    var STORAGE_KEY = 'pogo-pvp-state';
    // --- Utils ---------------------------------------------------------------
    function safeParse(json) {
        if (!json)
            return {};
        try {
            return JSON.parse(json);
        }
        catch (_) {
            return {};
        }
    }
    function storageAvailable() {
        try {
            var testKey = '__appstate_test__';
            global.localStorage.setItem(testKey, '1');
            global.localStorage.removeItem(testKey);
            return true;
        }
        catch (_) {
            return false;
        }
    }
    var hasStorage = storageAvailable();
    // --- Backing store -------------------------------------------------------
    var state = (function init() {
        if (!hasStorage)
            return {};
        return safeParse(global.localStorage.getItem(STORAGE_KEY));
    }());
    function persist(next) {
        if (!hasStorage)
            return;
        try {
            global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        catch (_) {
            // Quota exceeded or storage blocked; keep in-memory state as source of truth.
        }
    }
    // --- Pub/Sub for change notifications (optional) -------------------------
    var listeners = new Set();
    function notify() {
        listeners.forEach(function (fn) {
            try {
                fn(state);
            }
            catch (_) { }
        });
    }
    // Keep other tabs/windows in sync.
    if (hasStorage && global.addEventListener) {
        global.addEventListener('storage', function (e) {
            if (e.key !== STORAGE_KEY)
                return;
            state = safeParse(e.newValue);
            notify();
        });
    }
    // --- Public API ----------------------------------------------------------
    var api = {
        get: function (key, fallback) {
            return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : (arguments.length > 1 ? fallback !== null && fallback !== void 0 ? fallback : null : null);
        },
        set: function (key, value) {
            if (Object.prototype.hasOwnProperty.call(state, key) && state[key] === value)
                return;
            state[key] = value;
            persist(state);
            notify();
        },
        remove: function (key) {
            if (!Object.prototype.hasOwnProperty.call(state, key))
                return;
            delete state[key];
            persist(state);
            notify();
        },
        clear: function () {
            if (Object.keys(state).length === 0)
                return;
            state = {};
            persist(state);
            notify();
        },
        keys: function () { return Object.keys(state); },
        all: function () { return Object.assign({}, state); },
        read: function () { return Object.assign({}, state); },
        replace: function (next) {
            state = Object(next) === next ? Object.assign({}, next) : {};
            persist(state);
            notify();
        },
        merge: function (patch) {
            if (Object(patch) !== patch)
                return;
            var changed = false;
            for (var k in patch) {
                if (Object.prototype.hasOwnProperty.call(patch, k) && state[k] !== patch[k]) {
                    state[k] = patch[k];
                    changed = true;
                }
            }
            if (changed) {
                persist(state);
                notify();
            }
        },
        write: function (patch) { this.merge(patch); },
        subscribe: function (fn) {
            if (typeof fn !== 'function')
                return function () { };
            listeners.add(fn);
            try {
                fn(state);
            }
            catch (_) { }
            return function () { listeners.delete(fn); };
        }
    };
    global.AppState = api;
    var sharedStateHelpers = {
        readState: function () { return api.read(); },
        writeState: function (patch) { api.write(patch); },
        mergeState: function (patch) { api.merge(patch); },
        replaceState: function (next) { api.replace(next); },
        clearState: function () { api.clear(); },
        getStateValue: function (key, fallback) { return api.get(key, fallback); },
        setStateValue: function (key, value) { api.set(key, value); },
        removeStateValue: function (key) { api.remove(key); },
        subscribeState: function (fn) { return api.subscribe(fn); }
    };
    Object.keys(sharedStateHelpers).forEach(function (key) {
        global[key] = sharedStateHelpers[key];
    });
})(window);
