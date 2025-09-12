(function(global){
  // Species catalog (subset for this build)
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
    143: {
      id: 143,
      name: 'Snorlax',
      types: ['normal'],
      // Main-series base stats
      baseStats: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
      // Use existing move definitions in this build
      fastMoves: ['lick'],
      chargedMoves: ['body_slam','earthquake','superpower'],
    },
  };

  global.PokemonSpecies = SPECIES;
})(window);

