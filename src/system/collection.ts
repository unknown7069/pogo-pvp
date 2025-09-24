(function (global: Window & typeof window) {
  var STORAGE_KEY = 'pogo-pvp-state';

  var readState: () => Record<string, unknown> = (typeof global.readState === 'function')
    ? global.readState
    : function () {
      try {
        var raw = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
        return raw ? JSON.parse(raw) : {};
      } catch (_) {
        return {};
      }
    };

  var writeState: (patch: Record<string, unknown>) => void = (typeof global.writeState === 'function')
    ? global.writeState
    : function (patch: Record<string, unknown>) {
      if (!patch || Object(patch) !== patch) return;
      try {
        var next = Object.assign({}, readState(), patch);
        if (global.localStorage) {
          global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch (_) {}
    };

  function sanitizeLevel(value: unknown, fallback: number) {
    var base = typeof fallback === 'number' ? fallback : 20;
    var n = Number(value);
    if (Number.isNaN(n)) n = base;
    n = Math.max(1, Math.min(n, 50));
    return Math.round(n * 2) / 2;
  }

  function toInt(value: unknown, fallback: number) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.floor(n);
  }

  function clampInt(value: unknown, min: number, max: number) {
    var v = toInt(value, min);
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }

  function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function ensureUniqueUid(list: PokemonCollectionEntry[], base: string) {
    var uid = base;
    var suffix = 1;
    while (list.some(function (item) { return item && item.uid === uid; })) {
      uid = base + '_' + (suffix++);
    }
    return uid;
  }

  function createPokemon(spec: PokemonCollectionEntry) {
    if (!spec || Object(spec) !== spec) return null;
    var id = Number(spec.id);
    if (!Number.isFinite(id)) return null;
    var level = sanitizeLevel(spec.level, 1);
    var name = spec.name != null ? String(spec.name) : null;
    var state = readState();
    var list = Array.isArray(state.playerPokemon) ? (state.playerPokemon as PokemonCollectionEntry[]).slice() : [];
    var timestamp = Number.isFinite(spec.createdAt) ? Number(spec.createdAt) : Date.now();
    var providedUid = typeof spec.uid === 'string' && spec.uid ? spec.uid : null;
    var uidBase = providedUid || ('pk_' + timestamp.toString(36) + Math.random().toString(36).slice(2, 8));
    var uid = list.some(function (item) { return item && item.uid === uidBase; }) ? ensureUniqueUid(list, uidBase) : uidBase;
    var shiny = spec.shiny != null ? clampInt(spec.shiny, 0, 1) : (randomInt(1, 512) === 1 ? 1 : 0);
    var ivHp = spec.ivHp != null ? clampInt(spec.ivHp, 0, 15) : randomInt(0, 15);
    var ivAttack = spec.ivAttack != null ? clampInt(spec.ivAttack, 0, 15) : randomInt(0, 15);
    var ivDefense = spec.ivDefense != null ? clampInt(spec.ivDefense, 0, 15) : randomInt(0, 15);
    var entry: PokemonCollectionEntry = {
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

  function releasePokemon(uid: string) {
    if (typeof uid !== 'string' || !uid) return false;
    var state = readState();
    var list = Array.isArray(state.playerPokemon) ? (state.playerPokemon as PokemonCollectionEntry[]).slice() : [];
    var index = list.findIndex(function (item) { return item && item.uid === uid; });
    if (index === -1) return false;
    list.splice(index, 1);
    var patch: Record<string, unknown> = { playerPokemon: list };
    if (state && (state as any).viewPokemon && (state as any).viewPokemon.uid === uid) {
      var nextView = Object.assign({}, (state as any).viewPokemon);
      delete nextView.uid;
      patch.viewPokemon = nextView;
    }
    writeState(patch);
    return true;
  }

  var existing = (global.PlayerCollection || {}) as Partial<PlayerCollectionApi>;
  global.PlayerCollection = Object.assign({}, existing, {
    createPokemon: createPokemon,
    releasePokemon: releasePokemon,
  });
})(window);
