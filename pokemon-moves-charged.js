(function(global){
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
    { id: 'earthquake',   name: 'Earthquake',   power: 120, energyCost: 65, coolDownTime: 2, specialEffects: 'none', type: 'ground', rank: 3 },
    { id: 'superpower',   name: 'Superpower',   power: 85, energyCost: 40, coolDownTime: 1, specialEffects: 'none', type: 'fighting', rank: 2 },
  ]);
  const CHARGED_MOVES_BY_ID = Object.freeze(Object.fromEntries(CHARGED_MOVES.map(m => [m.id, m])));
  const CHARGED_MOVE_IDS = CHARGED_MOVES.map(m => m.id);

  global.PokemonChargedMoves = {
    CHARGED_MOVES,
    CHARGED_MOVES_BY_ID,
    CHARGED_MOVE_IDS,
  };
})(window);

