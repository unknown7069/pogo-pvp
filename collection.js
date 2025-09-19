(function (global) {
  var STORAGE_KEY = 'pogo-pvp-state';

  var readState = (typeof global.readState === 'function')
    ? global.readState
    : function () {
      try {
        var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
        return raw ? JSON.parse(raw) : {};
      } catch (_) {
        return {};
      }
    };

  var writeState = (typeof global.writeState === 'function')
    ? global.writeState
    : function (patch) {
      if (!patch || Object(patch) !== patch) return;
      try {
        var next = Object.assign({}, readState(), patch);
        if (global.localStorage) {
          global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch (_) {}
    };

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

  function releasePokemon(uid) {
    if (typeof uid !== 'string' || !uid) return false;
    var state = readState();
    var list = Array.isArray(state.playerPokemon) ? state.playerPokemon.slice() : [];
    var index = list.findIndex(function (item) { return item && item.uid === uid; });
    if (index === -1) return false;
    list.splice(index, 1);
    var patch = { playerPokemon: list };
    if (state && state.viewPokemon && state.viewPokemon.uid === uid) {
      var nextView = Object.assign({}, state.viewPokemon);
      delete nextView.uid;
      patch.viewPokemon = nextView;
    }
    writeState(patch);
    return true;
  }

  global.PlayerCollection = global.PlayerCollection || {};
  global.PlayerCollection.createPokemon = createPokemon;
  global.PlayerCollection.releasePokemon = releasePokemon;
})(window);
