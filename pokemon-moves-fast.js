(function(global){
  // Fast moves with full metadata. id is a string.
  const FAST_MOVES = Object.freeze([
    { id: 'quick_attack',  name: 'Quick Attack',  power: 5, energyGain: 5, attackRate: 0.5, type: 'normal',  rank: 1 },
    { id: 'tackle',  name: 'Tackle',  power: 5, energyGain: 5, attackRate: 1, type: 'normal',  rank: 1 },
    { id: 'scratch',       name: 'Scratch',       power: 6, energyGain: 5, attackRate: 1, type: 'normal',   rank: 1 },
    { id: 'dragon_breath', name: 'Dragon Breath', power: 7, energyGain: 9, attackRate: 1, type: 'dragon',  rank: 1 },
    { id: 'rock_smash',    name: 'Rock Smash',    power: 12, energyGain: 7, attackRate: 1.5, type: 'fighting', rank: 1 },
    { id: 'low_kick',      name: 'Low Kick',      power: 7, energyGain: 8, attackRate: 1, type: 'fighting', rank: 1 },
    { id: 'pound',         name: 'Pound',         power: 7, energyGain: 5, attackRate: 1, type: 'normal',   rank: 1 },
    { id: 'scratch',       name: 'Scratch',       power: 6, energyGain: 5, attackRate: 1, type: 'normal',   rank: 1 },
    { id: 'bullet_punch',  name: 'Bullet Punch',  power: 7, energyGain: 7, attackRate: 1, type: 'steel',    rank: 1 },
    { id: 'metal_claw',    name: 'Metal Claw',    power: 7, energyGain: 7, attackRate: 1, type: 'steel',    rank: 1 },
    { id: 'vine_whip',     name: 'Vine Whip',     power: 8, energyGain: 7, attackRate: 1, type: 'grass',   rank: 1 },
    { id: 'razor_leaf',    name: 'Razor Leaf',    power: 15, energyGain: 7, attackRate: 2, type: 'grass',   rank: 1 },
    { id: 'ember',         name: 'Ember',         power: 7, energyGain: 7, attackRate: 2, type: 'fire',    rank: 1 },
    { id: 'fire_spin',     name: 'Fire Spin',     power: 4, energyGain: 11, attackRate: 1, type: 'fire',    rank: 1 },
    { id: 'flame_charge',  name: 'Flame Charge',  power: 8, energyGain: 6, attackRate: 0.5, type: 'fire',    rank: 1 },
    { id: 'water_gun',     name: 'Water Gun',     power: 7, energyGain: 8, attackRate: 1, type: 'water',   rank: 1 },
    { id: 'aqua_jet',      name: 'Aqua Jet',      power: 4, energyGain: 6, attackRate: 0.5, type: 'water',   rank: 1 },
    { id: 'splash',        name: 'Splash',        power: 0, energyGain: 5, attackRate: 1, type: 'water',    rank: 1 },
    { id: 'lick',          name: 'Lick',          power: 6, energyGain: 9, attackRate: 0.5, type: 'ghost',  rank: 1 },
    { id: 'thunder_shock', name: 'Thunder Shock', power: 5, energyGain: 9, attackRate: 1, type: 'electric', rank: 1 },
    { id: 'spark',         name: 'Spark',         power: 6, energyGain: 8, attackRate: 1, type: 'electric', rank: 1 },
    { id: 'rock_throw',    name: 'Rock Throw',    power: 9, energyGain: 7, attackRate: 1, type: 'rock',     rank: 1 },
    { id: 'fairy_wind',    name: 'Fairy Wind',    power: 5, energyGain: 9, attackRate: 1, type: 'fairy',   rank: 1 },
    { id: 'disarming_voice', name: 'Disarming Voice', power: 6, energyGain: 8, attackRate: 1, type: 'fairy', rank: 1 },
    { id: 'feint_attack',  name: 'Feint Attack',  power: 6, energyGain: 8, attackRate: 1, type: 'dark',     rank: 1 },
    { id: 'bite',          name: 'Bite',          power: 6, energyGain: 8, attackRate: 1, type: 'dark',     rank: 1 },
    { id: 'peck',          name: 'Peck',          power: 7, energyGain: 6, attackRate: 1, type: 'flying',   rank: 1 },
    { id: 'wing_attack',   name: 'Wing Attack',   power: 8, energyGain: 8, attackRate: 1, type: 'flying',   rank: 1 },
    { id: 'confusion',     name: 'Confusion',     power: 16, energyGain: 6, attackRate: 1.5, type: 'psychic', rank: 1 },
    { id: 'ice_shard',     name: 'Ice Shard',     power: 9, energyGain: 7, attackRate: 1, type: 'ice',      rank: 1 },
    { id: 'poweder_snow',   name: 'Powder Snow',   power: 4, energyGain: 9, attackRate: 1, type: 'ice',      rank: 1 },
    { id: 'poison_sting',  name: 'Poison Sting',  power: 5, energyGain: 9, attackRate: 1, type: 'poison',   rank: 1 },
    { id: 'mud_shot',      name: 'Mud Shot',      power: 5, energyGain: 9, attackRate: 1, type: 'ground',   rank: 1 },
    { id: 'bug_bite',      name: 'Bug Bite',      power: 6, energyGain: 8, attackRate: 1, type: 'bug',      rank: 1 },
    { id: 'fury_cutter',   name: 'Fury Cutter',   power: 3, energyGain: 5, attackRate: 2, type: 'bug',      rank: 1 },
    // Better moves (rank 2)
    // Better moves (rank 3)
  ]);
  const FAST_MOVES_BY_ID = Object.freeze(Object.fromEntries(FAST_MOVES.map(m => [m.id, m])));
  const FAST_MOVE_IDS = FAST_MOVES.map(m => m.id);

  global.PokemonFastMoves = {
    FAST_MOVES,
    FAST_MOVES_BY_ID,
    FAST_MOVE_IDS,
  };
})(window);
