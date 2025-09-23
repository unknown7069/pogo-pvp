(function(global){
  // Pokemon data aggregator
  // Exposes: window.PokemonData with { all, byId, getPokemonById, move lists, types, stats }

  const MovesFast = global.PokemonFastMoves || {};
  const MovesCharged = global.PokemonChargedMoves || {};
  const TYPES = global.PokemonTypes || [];
  const SPECIES = global.PokemonSpecies || {};
  const Stats = global.PokemonStats || {};

  // Build catalogue from species map
  const canonical = Object.values(SPECIES);
  const all = canonical;
  const byId = new Map(all.map(p => [p.id, p]));

  // Species sorted by max cp desc
  all.sort((a, b) => {
    const aMaxCp = Stats.calcGoCp && a.baseStats ? Stats.calcGoCp(a.baseStats) : 0;
    const bMaxCp = Stats.calcGoCp && b.baseStats ? Stats.calcGoCp(b.baseStats) : 0;
    return bMaxCp - aMaxCp;
  });

  function clampIv(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return null;
    n = Math.round(n);
    if (n < 0) n = 0;
    if (n > 15) n = 15;
    return n;
  }

  function normalizeShiny(value) {
    if (value === true) return 1;
    if (value === false) return 0;
    var n = Number(value);
    if (Number.isFinite(n)) return n === 1 ? 1 : 0;
    return value ? 1 : 0;
  }

  function applyCollectionOverrides(mon, overrides) {
    if (!overrides || Object(overrides) !== overrides) return mon;
    var copy = Object.assign({}, mon);
    if (overrides.shiny != null) {
      copy.shiny = normalizeShiny(overrides.shiny);
    }
    var sourceIvs = null;
    if (overrides.ivs && Object(overrides.ivs) === overrides.ivs) {
      sourceIvs = overrides.ivs;
    }
    var hpIv = clampIv(sourceIvs ? sourceIvs.hp : overrides.ivHp);
    var atkIv = clampIv(sourceIvs ? sourceIvs.attack : overrides.ivAttack);
    var defIv = clampIv(sourceIvs ? sourceIvs.defense : overrides.ivDefense);
    if (hpIv != null || atkIv != null || defIv != null) {
      var baseIvs = (mon.ivs && Object(mon.ivs) === mon.ivs) ? mon.ivs : {};
      copy.ivs = Object.assign({}, baseIvs);
      if (hpIv != null) copy.ivs.hp = hpIv;
      if (atkIv != null) copy.ivs.attack = atkIv;
      if (defIv != null) copy.ivs.defense = defIv;
    }
    return copy;
  }


  function getPokemonById(id, overrides) {
    const key = Number(id);
    const mon = byId.get(key) || null;
    if (!mon) return null;
    return overrides ? applyCollectionOverrides(mon, overrides) : mon;
  }

  function getGoStatsById(id, level) {
    const mon = getPokemonById(id);
    if (!mon) return null;
    const bs = mon.baseStats;
    return {
      hp: Stats.calcGoHp ? Stats.calcGoHp(bs, level) : 10,
      attack: Stats.calcGoAttack ? Stats.calcGoAttack(bs, level) : 10,
      defense: Stats.calcGoDefense ? Stats.calcGoDefense(bs, level) : 10,
      speed: Stats.calcGoSpeed ? Stats.calcGoSpeed(bs, level) : 10,
    };
  }

  // Slugify a Pokémon species name to match pokemondb naming.
  function slugifyName(name) {
    let s = String(name || '').toLowerCase().trim();
    // replace ♀ with -f, ♂ with -m 
    s = s.replace('♀', '-f').replace('♂', '-m');
    // replace . with - 
    s = s.replace(/\./g, '-');
    // replace "'" with empty
    s = s.replace(/'/g, '');

    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function getForwardSpriteUrl(monOrName) {
    const name = typeof monOrName === 'string' ? monOrName : (monOrName && monOrName.name) || '';
    const slug = slugifyName(name);
    return `https://img.pokemondb.net/sprites/black-white/normal/${slug}.png`;
  }

  // Build animated battle sprite URL (front/back) for Gen5 style.
  function getBattleSpriteUrl(name, side, isShiny) {
    const slug = slugifyName(name);
    if (!slug) return '';
    const direction = String(side) === 'player' ? 'back-' : '';
    const style = isShiny ? 'shiny' : 'normal';
    return `https://img.pokemondb.net/sprites/black-white/anim/${direction}${style}/${slug}.gif`;
  }

  global.PokemonData = {
    all,
    byId,
    getPokemonById,
    slugifyName,
    getForwardSpriteUrl,
    getBattleSpriteUrl,
    // Moves
    FAST_MOVE_IDS: MovesFast.FAST_MOVE_IDS || [],
    CHARGED_MOVE_IDS: MovesCharged.CHARGED_MOVE_IDS || [],
    FAST_MOVES: MovesFast.FAST_MOVES || [],
    FAST_MOVES_BY_ID: MovesFast.FAST_MOVES_BY_ID || {},
    CHARGED_MOVES: MovesCharged.CHARGED_MOVES || [],
    CHARGED_MOVES_BY_ID: MovesCharged.CHARGED_MOVES_BY_ID || {},
    // Types
    TYPES,
    // GO stat helpers
    calcGoHp: Stats.calcGoHp,
    calcGoAttack: Stats.calcGoAttack,
    calcGoDefense: Stats.calcGoDefense,
    calcGoSpeed: Stats.calcGoSpeed,
    calcCpMultiplier: Stats.calcCpMultiplier,
    calcGoCp: Stats.calcGoCp,
    getGoStatsById,
  };
})(window);
