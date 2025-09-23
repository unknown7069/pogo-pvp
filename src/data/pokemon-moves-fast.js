(function(global){
  // Fast moves with full metadata. id is a string.
  const FAST_MOVES = Object.freeze([
    { id: 'quick_attack',  name: 'Quick Attack',  power: 3, energyGain: 2, attackRate: 0.5, type: 'normal',  rank: 1 },
    { id: 'tackle',        name: 'Tackle',        power: 5, energyGain: 5, attackRate: 1, type: 'normal',  rank: 1 },
    { id: 'scratch',       name: 'Scratch',       power: 6, energyGain: 4, attackRate: 1, type: 'normal',   rank: 1 },
    { id: 'pound',         name: 'Pound',         power: 7, energyGain: 3, attackRate: 1, type: 'normal',   rank: 1 },
    { id: 'lock_on',       name: 'Lock On',       power: 1, energyGain: 21, attackRate: 2, type: 'normal',   rank: 1 },
    // dragon
    { id: 'dragon_breath', name: 'Dragon Breath', power: 7, energyGain: 3, attackRate: 1, type: 'dragon',  rank: 1 },
    { id: 'dragon_tail',   name: 'Dragon Tail',   power: 15, energyGain: 7, attackRate: 2, type: 'dragon',  rank: 1 },
    // fighting
    { id: 'rock_smash',    name: 'Rock Smash',    power: 12, energyGain: 7, attackRate: 1.5, type: 'fighting', rank: 1 },
    { id: 'low_kick',      name: 'Low Kick',      power: 7, energyGain: 8, attackRate: 1, type: 'fighting', rank: 1 },
    // steel
    { id: 'bullet_punch',  name: 'Bullet Punch',  power: 7, energyGain: 7, attackRate: 1, type: 'steel',    rank: 1 },
    { id: 'metal_claw',    name: 'Metal Claw',    power: 7, energyGain: 7, attackRate: 1, type: 'steel',    rank: 1 },
    // grass
    { id: 'vine_whip',     name: 'Vine Whip',     power: 8, energyGain: 7, attackRate: 1, type: 'grass',   rank: 1 },
    { id: 'razor_leaf',    name: 'Razor Leaf',    power: 15, energyGain: 7, attackRate: 2, type: 'grass',   rank: 1 },
    // fire
    { id: 'ember',         name: 'Ember',         power: 6, energyGain: 4, attackRate: 1, type: 'fire',    rank: 1 },
    { id: 'fire_spin',     name: 'Fire Spin',     power: 4, energyGain: 11, attackRate: 1.5, type: 'fire',    rank: 1 },
    { id: 'flame_charge',  name: 'Flame Charge',  power: 3, energyGain: 2, attackRate: 0.5, type: 'fire',    rank: 1 },
    // water
    { id: 'water_gun',     name: 'Water Gun',     power: 5, energyGain: 5, attackRate: 1, type: 'water',   rank: 1 },
    { id: 'aqua_jet',      name: 'Aqua Jet',      power: 2, energyGain: 3, attackRate: 0.5, type: 'water',   rank: 1 },
    { id: 'splash',        name: 'Splash',        power: 0, energyGain: 5, attackRate: 1, type: 'water',    rank: 0 },
    // electric
    { id: 'thunder_shock', name: 'Thunder Shock', power: 5, energyGain: 5, attackRate: 1, type: 'electric', rank: 1 },
    { id: 'spark',         name: 'Spark',         power: 4, energyGain: 1, attackRate: 0.5, type: 'electric', rank: 1 },
    // ghost 
    { id: 'lick',          name: 'Lick',          power: 2, energyGain: 3, attackRate: 0.5, type: 'ghost',  rank: 1 },
    // fairy
    { id: 'fairy_wind',    name: 'Fairy Wind',    power: 5, energyGain: 5, attackRate: 1, type: 'fairy',   rank: 1 },
    { id: 'disarming_voice', name: 'Disarming Voice', power: 13, energyGain: 8, attackRate: 2, type: 'fairy', rank: 1 },
    // dark
    { id: 'feint_attack',  name: 'Feint Attack',  power: 6, energyGain: 10, attackRate: 1.5, type: 'dark',     rank: 1 },
    { id: 'bite',          name: 'Bite',          power: 8, energyGain: 2, attackRate: 1, type: 'dark',     rank: 1 },
    // flying
    { id: 'peck',          name: 'Peck',          power: 6, energyGain: 4, attackRate: 1, type: 'flying',   rank: 1 },
    { id: 'wing_attack',   name: 'Wing Attack',   power: 8, energyGain: 8, attackRate: 1.5, type: 'flying',   rank: 1 },
    // psychic
    { id: 'confusion',     name: 'Confusion',     power: 16, energyGain: 6, attackRate: 2, type: 'psychic', rank: 1 },
    { id: 'psycho_cut',    name: 'Psycho Cut',    power: 6, energyGain: 4, attackRate: 1, type: 'psychic', rank: 1 },
    { id: 'zen_headbutt',  name: 'Zen Headbutt',  power: 12, energyGain: 4, attackRate: 1.5, type: 'psychic', rank: 1 },
    { id: 'psywave',       name: 'Psywave',       power: 5, energyGain: 5, attackRate: 1, type: 'psychic', rank: 1 },
    // ice
    { id: 'ice_shard',     name: 'Ice Shard',     power: 7, energyGain: 3, attackRate: 1, type: 'ice',      rank: 1 },
    { id: 'powder_snow',   name: 'Powder Snow',   power: 3, energyGain: 7, attackRate: 1, type: 'ice',      rank: 1 },
    // poison
    { id: 'poison_sting',  name: 'Poison Sting',  power: 5, energyGain: 5, attackRate: 1, type: 'poison',   rank: 1 },
    // ground
    { id: 'mud_shot',      name: 'Mud Shot',      power: 5, energyGain: 5, attackRate: 1, type: 'ground',   rank: 1 },
    // rock
    { id: 'rock_throw',    name: 'Rock Throw',    power: 9, energyGain: 12, attackRate: 2, type: 'rock',     rank: 1 },
    // bug
    { id: 'bug_bite',      name: 'Bug Bite',      power: 6, energyGain: 4, attackRate: 1, type: 'bug',      rank: 1 },
    { id: 'fury_cutter',   name: 'Fury Cutter',   power: 3, energyGain: 2, attackRate: 0.5, type: 'bug',      rank: 1 },
  ]);
  const FAST_MOVES_BY_ID = Object.freeze(Object.fromEntries(FAST_MOVES.map(m => [m.id, m])));
  const FAST_MOVE_IDS = FAST_MOVES.map(m => m.id);

  global.PokemonFastMoves = {
    FAST_MOVES,
    FAST_MOVES_BY_ID,
    FAST_MOVE_IDS,
  };
})(window);
