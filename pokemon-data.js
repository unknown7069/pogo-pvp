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

  function getPokemonById(id) {
    const key = Number(id);
    return byId.get(key) || null;
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
    const s = String(name || '').toLowerCase().trim();
    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Build a forward-facing static sprite URL (PNG).
  function getForwardSpriteUrl(monOrName) {
    const name = typeof monOrName === 'string' ? monOrName : (monOrName && monOrName.name) || '';
    const slug = slugifyName(name);
    return `https://img.pokemondb.net/sprites/black-white/normal/${slug}.png`;
  }

  // Build animated battle sprite URL (front/back) for Gen5 style.
  function getBattleSpriteUrl(monOrName, side) {
    const name = typeof monOrName === 'string' ? monOrName : (monOrName && monOrName.name) || '';
    const slug = slugifyName(name);
    if (String(side) === 'player') {
      return `https://img.pokemondb.net/sprites/black-white/anim/back-normal/${slug}.gif`;
    }
    return `https://img.pokemondb.net/sprites/black-white/anim/normal/${slug}.gif`;
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
