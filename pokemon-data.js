(function(global){
  // Pokemon data module
  // Exposes: window.PokemonData with { all, byId, getPokemonById }

  // Fast moves with full metadata. id is a string.
  const FAST_MOVES = Object.freeze([
    { id: 'quick_attack',  name: 'Quick Attack',  power: 6, energyGain: 8, attackRate: 0.5, type: 'normal',  rank: 1 },
    { id: 'dragon_breath', name: 'Dragon Breath', power: 7, energyGain: 9, attackRate: 1, type: 'dragon',  rank: 1 },
    { id: 'shadow_claw',   name: 'Shadow Claw',   power: 10, energyGain: 8, attackRate: 1.5, type: 'ghost',   rank: 1 },
    { id: 'counter',       name: 'Counter',       power: 6, energyGain: 8, attackRate: 2, type: 'fighting', rank: 1 },
    { id: 'vine_whip',     name: 'Vine Whip',     power: 8, energyGain: 7, attackRate: 1, type: 'grass',   rank: 1 },
    { id: 'ember',         name: 'Ember',         power: 7, energyGain: 7, attackRate: 2, type: 'fire',    rank: 1 },
    { id: 'water_gun',     name: 'Water Gun',     power: 7, energyGain: 8, attackRate: 1, type: 'water',   rank: 1 },
  ]);
  const FAST_MOVES_BY_ID = Object.freeze(Object.fromEntries(FAST_MOVES.map(m => [m.id, m])));
  const FAST_MOVE_IDS = FAST_MOVES.map(m => m.id);

  // Charged moves with full metadata. id is a string.
  // NOTE: coolDownTime is expressed in units of 1000ms 
  const CHARGED_MOVES = Object.freeze([
    { id: 'aqua_tail',    name: 'Aqua Tail',    power: 50, energyCost: 35, coolDownTime: 1, specialEffects: 'none', type: 'water',  rank: 1 },
    { id: 'body_slam',    name: 'Body Slam',    power: 60, energyCost: 35, coolDownTime: 1, specialEffects: 'none', type: 'normal', rank: 2 },
    { id: 'rock_slide',   name: 'Rock Slide',   power: 75, energyCost: 45, coolDownTime: 1.5, specialEffects: 'none', type: 'rock',   rank: 2 },
    { id: 'shadow_ball',  name: 'Shadow Ball',  power: 100, energyCost: 55, coolDownTime: 1.5, specialEffects: 'none', type: 'ghost',  rank: 3 },
    { id: 'hydro_cannon', name: 'Hydro Cannon', power: 90, energyCost: 50, coolDownTime: 1.5, specialEffects: 'none', type: 'water',  rank: 3 },
    { id: 'hydro_pump',   name: 'Hydro Pump',   power: 130, energyCost: 75, coolDownTime: 2.5, specialEffects: 'none', type: 'water',  rank: 3 },
    { id: 'flamethrower', name: 'Flamethrower', power: 90, energyCost: 55, coolDownTime: 1.5, specialEffects: 'none', type: 'fire',   rank: 3 },
    { id: 'sludge_bomb',  name: 'Sludge Bomb',  power: 80, energyCost: 50, coolDownTime: 1.5, specialEffects: 'none', type: 'poison', rank: 2 },
    { id: 'power_whip',   name: 'Power Whip',   power: 90, energyCost: 50, coolDownTime: 1.5, specialEffects: 'none', type: 'grass',  rank: 3 },
    { id: 'water_pulse',  name: 'Water Pulse',  power: 70, energyCost: 60, coolDownTime: 2, specialEffects: 'none', type: 'water',  rank: 1 },
  ]);
  const CHARGED_MOVES_BY_ID = Object.freeze(Object.fromEntries(CHARGED_MOVES.map(m => [m.id, m])));
  const CHARGED_MOVE_IDS = CHARGED_MOVES.map(m => m.id);

  // Canonical Pokémon type list
  const TYPES = Object.freeze([
    'normal','fire','water','electric','grass','ice',
    'fighting','poison','ground','flying','psychic','bug',
    'rock','ghost','dragon','dark','steel','fairy',
  ]);

  const SPECIES = {
    1: {
      id: 1,
      name: 'Bulbasaur',
      types: ['grass','poison'],
      baseStats: { hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
      fastMoves: ['vine_whip'],
      chargedMoves: ['sludge_bomb','power_whip'],
    },
    4: {
      id: 4,
      name: 'Charmander',
      types: ['fire'],
      baseStats: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
      fastMoves: ['ember'],
      chargedMoves: ['flamethrower','rock_slide'],
    },
    7: {
      id: 7,
      name: 'Squirtle',
      types: ['water'],
      baseStats: { hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
      fastMoves: ['water_gun'],
      chargedMoves: ['water_pulse','hydro_pump'],
    },
  };

  // Build catalogue: canonical starters only
  const canonical = Object.values(SPECIES);
  const all = canonical;
  const byId = new Map(all.map(p => [p.id, p]));

  function getPokemonById(id) {
    const key = Number(id);
    return byId.get(key) || null;
  }

  // --- GO Stat conversion helpers (placeholder formulas) ---
  // Each takes a main-series baseStats object and returns a numeric value.
  // You can tweak these formulas later for your balance model.
  function calcGoHp(baseStats) {
    if (!baseStats) return 10;
    const hp = Number(baseStats.hp || 10);
    return Math.round(50 + hp * 1.75);
  }

  function calcGoAttack(baseStats) {
    if (!baseStats) return 10;
    const atk = Number(baseStats.attack || 10);
    const spa = Number(baseStats.spAttack || 10);
    return Math.round(25 + (Math.max(atk, spa) * 7/8 + Math.min(atk, spa) * 1/8) * 2);
  }

  function calcGoDefense(baseStats) {
    if (!baseStats) return 10;
    const def = Number(baseStats.defense || 10);
    const spd = Number(baseStats.spDefense || 10);
    return Math.round(25 + (Math.max(def, spd) * 5/8 + Math.min(def, spd) * 3/8) * 2);
  }

  function calcGoSpeed(baseStats) {
    if (!baseStats) return 10;
    const spe = Number(baseStats.speed || 10);
    // Placeholder: lightly scaled speed
    return Math.round(100 + spe * 1.2);
  }

  function getGoStatsById(id) {
    const mon = getPokemonById(id);
    if (!mon) return null;
    const bs = mon.baseStats;
    return {
      hp: calcGoHp(bs),
      attack: calcGoAttack(bs),
      defense: calcGoDefense(bs),
      speed: calcGoSpeed(bs),
    };
  }


  global.PokemonData = {
    all,
    byId,
    getPokemonById,
    // Expose move id lists so other modules can correlate
    FAST_MOVE_IDS,
    CHARGED_MOVE_IDS,
    FAST_MOVES,
    FAST_MOVES_BY_ID,
    CHARGED_MOVES,
    CHARGED_MOVES_BY_ID,
    TYPES,
    // GO stat helpers
    calcGoHp,
    calcGoAttack,
    calcGoDefense,
    calcGoSpeed,
    getGoStatsById,
  };
})(window);
