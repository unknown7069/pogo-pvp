(function (global) {
  function readState() {
    var store = global.AppState || null;
    if (store && typeof store.read === 'function') return store.read();
    if (store && typeof store.all === 'function') return store.all();
    try {
      var raw = global.localStorage ? global.localStorage.getItem('pogo-pvp-state') : null;
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function writeState(patch) {
    if (!patch || Object(patch) !== patch) return;
    var store = global.AppState || null;
    if (store && typeof store.write === 'function') { store.write(patch); return; }
    if (store && typeof store.merge === 'function') { store.merge(patch); return; }
    if (store && typeof store.set === 'function') {
      Object.keys(patch).forEach(function (key) { store.set(key, patch[key]); });
      return;
    }
    try {
      var next = Object.assign({}, readState(), patch);
      if (global.localStorage) global.localStorage.setItem('pogo-pvp-state', JSON.stringify(next));
    } catch (_) {}
  }

  function sanitizeLevel(value, fallback) {
    var base = typeof fallback === 'number' ? fallback : 20;
    var n = Number(value);
    if (Number.isNaN(n)) n = base;
    n = Math.max(1, Math.min(n, 50));
    return Math.round(n * 2) / 2;
  }

  function toInt(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.floor(n);
  }

  function clampInt(value, min, max) {
    var v = toInt(value, min);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function ensureUniqueUid(list, base) {
    var uid = base;
    var suffix = 1;
    while (list.some(function (item) { return item && item.uid === uid; })) {
      uid = base + '_' + (suffix++);
    }
    return uid;
  }

  function createPokemon(spec) {
    if (!spec || Object(spec) !== spec) return null;
    var id = Number(spec.id);
    if (!Number.isFinite(id)) return null;
    var level = sanitizeLevel(spec.level, 1);
    var name = spec.name != null ? String(spec.name) : null;
    var state = readState();
    var list = Array.isArray(state.playerPokemon) ? state.playerPokemon.slice() : [];
    var timestamp = Number.isFinite(spec.createdAt) ? Number(spec.createdAt) : Date.now();
    var providedUid = typeof spec.uid === 'string' && spec.uid ? spec.uid : null;
    var uidBase = providedUid || ('pk_' + timestamp.toString(36) + Math.random().toString(36).slice(2, 8));
    var uid = list.some(function (item) { return item && item.uid === uidBase; }) ? ensureUniqueUid(list, uidBase) : uidBase;
    var shiny = spec.shiny != null ? clampInt(spec.shiny, 0, 1) : (randomInt(1, 512) === 1 ? 1 : 0);
    var ivHp = spec.ivHp != null ? clampInt(spec.ivHp, 0, 15) : randomInt(0, 15);
    var ivAttack = spec.ivAttack != null ? clampInt(spec.ivAttack, 0, 15) : randomInt(0, 15);
    var ivDefense = spec.ivDefense != null ? clampInt(spec.ivDefense, 0, 15) : randomInt(0, 15);
    var entry = {
      uid: uid,
      id: id,
      level: level,
      name: name,
      createdAt: timestamp,
      shiny: shiny,
      ivHp: ivHp,
      ivAttack: ivAttack,
      ivDefense: ivDefense
    };
    list.push(entry);
    writeState({ playerPokemon: list });
    return entry;
  }

  global.PlayerCollection = global.PlayerCollection || {};
  global.PlayerCollection.createPokemon = createPokemon;
})(window);
