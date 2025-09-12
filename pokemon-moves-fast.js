(function(global){
  // Fast moves with full metadata. id is a string.
  const FAST_MOVES = Object.freeze([
    { id: 'quick_attack',  name: 'Quick Attack',  power: 6, energyGain: 8, attackRate: 0.5, type: 'normal',  rank: 1 },
    { id: 'dragon_breath', name: 'Dragon Breath', power: 7, energyGain: 9, attackRate: 1, type: 'dragon',  rank: 1 },
    { id: 'shadow_claw',   name: 'Shadow Claw',   power: 10, energyGain: 8, attackRate: 1.5, type: 'ghost',   rank: 1 },
    { id: 'counter',       name: 'Counter',       power: 6, energyGain: 8, attackRate: 2, type: 'fighting', rank: 1 },
    { id: 'vine_whip',     name: 'Vine Whip',     power: 8, energyGain: 7, attackRate: 1, type: 'grass',   rank: 1 },
    { id: 'ember',         name: 'Ember',         power: 7, energyGain: 7, attackRate: 2, type: 'fire',    rank: 1 },
    { id: 'water_gun',     name: 'Water Gun',     power: 7, energyGain: 8, attackRate: 1, type: 'water',   rank: 1 },
    { id: 'lick',          name: 'Lick',          power: 6, energyGain: 9, attackRate: 0.5, type: 'ghost',  rank: 1 },
    { id: 'thunder_shock', name: 'Thunder Shock', power: 5, energyGain: 9, attackRate: 1, type: 'electric', rank: 1 },
    { id: 'rock_throw',    name: 'Rock Throw',    power: 9, energyGain: 7, attackRate: 1, type: 'rock',     rank: 1 },
    { id: 'charm',         name: 'Charm',         power: 10, energyGain: 6, attackRate: 1.5, type: 'fairy',  rank: 1 },
    { id: 'wing_attack',   name: 'Wing Attack',   power: 8, energyGain: 8, attackRate: 1, type: 'flying',   rank: 1 },
    { id: 'confusion',     name: 'Confusion',     power: 16, energyGain: 6, attackRate: 1.5, type: 'psychic', rank: 1 },
    { id: 'ice_shard',     name: 'Ice Shard',     power: 9, energyGain: 7, attackRate: 1, type: 'ice',      rank: 1 },
    { id: 'poison_sting',  name: 'Poison Sting',  power: 5, energyGain: 9, attackRate: 1, type: 'poison',   rank: 1 },
    { id: 'mud_shot',      name: 'Mud Shot',      power: 5, energyGain: 9, attackRate: 1, type: 'ground',   rank: 1 },
    { id: 'bug_bite',      name: 'Bug Bite',      power: 6, energyGain: 8, attackRate: 1, type: 'bug',      rank: 1 },
  ]);
  const FAST_MOVES_BY_ID = Object.freeze(Object.fromEntries(FAST_MOVES.map(m => [m.id, m])));
  const FAST_MOVE_IDS = FAST_MOVES.map(m => m.id);

  global.PokemonFastMoves = {
    FAST_MOVES,
    FAST_MOVES_BY_ID,
    FAST_MOVE_IDS,
  };
})(window);
