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

  function getGoStatsById(id) {
    const mon = getPokemonById(id);
    if (!mon) return null;
    const bs = mon.baseStats;
    return {
      hp: Stats.calcGoHp ? Stats.calcGoHp(bs) : 10,
      attack: Stats.calcGoAttack ? Stats.calcGoAttack(bs) : 10,
      defense: Stats.calcGoDefense ? Stats.calcGoDefense(bs) : 10,
      speed: Stats.calcGoSpeed ? Stats.calcGoSpeed(bs) : 10,
    };
  }

  global.PokemonData = {
    all,
    byId,
    getPokemonById,
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
