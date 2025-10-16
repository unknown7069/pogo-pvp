(function (global) {
    // NOTE: coolDownTime is expressed in units of 1000ms
    // NOTE: chargeUpTime is a pre-fire delay shared by all charged moves
    // Example specialEffects: 'sA+10,sD-10,tS-10'
    // s=self, t=opponent 
    // A=attack, D=defense, S=speed, H=hp 
    // Note: Status effects would be too complicated. Instead reimagine them as:
    // - If a move would poison - it should reduce the opponent's defense
    // - If a move would burn - it should reduce the opponent's attack
    // - If a move would paralyze - it should reduce the opponent's speed
    // - If a move would freeze - it should reduce the opponent's attack and speed
    // - If a move would sleep - it should reduce the opponent's attack, defense and speed
    const CHARGED_MOVES = Object.freeze([
        { id: 'body_slam', name: 'Body Slam', power: 60, energyCost: 35, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'normal', rank: 1 },
        { id: 'extreme_speed', name: 'Extreme Speed', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'normal', rank: 1 },
        { id: 'explosion', name: 'Explosion', power: 250, energyCost: 100, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'normal', rank: 2 },
        { id: 'hyper_beam', name: 'Hyper Beam', power: 150, energyCost: 80, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'normal', rank: 2 },
        { id: 'giga_impact', name: 'Giga Impact', power: 150, energyCost: 80, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'normal', rank: 2 },
        { id: 'last_resort', name: 'Last Resort', power: 90, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'normal', rank: 2 },
        { id: 'recover', name: 'Recover', power: 0, energyCost: 50, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: 'sH+5', type: 'normal', rank: 1 },
        { id: 'sword_dance', name: 'Sword Dance', power: 0, energyCost: 35, chargeUpTime: 1, coolDownTime: 1, specialEffects: 'sA+10', type: 'normal', rank: 1 },
        // water
        { id: 'aqua_tail', name: 'Aqua Tail', power: 50, energyCost: 35, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'water', rank: 1 },
        { id: 'surf', name: 'Surf', power: 65, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'water', rank: 1 },
        { id: 'water_pulse', name: 'Water Pulse', power: 70, energyCost: 60, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'water', rank: 1 },
        { id: 'hydro_pump', name: 'Hydro Pump', power: 130, energyCost: 70, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'water', rank: 2 },
        // fire
        { id: 'flamethrower', name: 'Flamethrower', power: 90, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fire', rank: 1 },
        { id: 'fire_blast', name: 'Fire Blast', power: 140, energyCost: 70, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'fire', rank: 2 },
        { id: 'overheat', name: 'Overheat', power: 160, energyCost: 80, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'fire', rank: 2 },
        // grass
        { id: 'power_whip', name: 'Power Whip', power: 90, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'grass', rank: 1 },
        { id: 'energy_ball', name: 'Energy Ball', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'grass', rank: 1 },
        { id: 'solar_beam', name: 'Solar Beam', power: 180, energyCost: 80, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'grass', rank: 2 },
        // poison 
        { id: 'sludge_bomb', name: 'Sludge Bomb', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'poison', rank: 1 },
        { id: 'cross_poison', name: 'Cross Poison', power: 70, energyCost: 45, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'poison', rank: 1 },
        // electric
        { id: 'thunder_punch', name: 'Thunder Punch', power: 55, energyCost: 40, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'electric', rank: 1 },
        { id: 'wild_charge', name: 'Wild Charge', power: 100, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'electric', rank: 1 },
        { id: 'thunder', name: 'Thunder', power: 120, energyCost: 65, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'electric', rank: 2 },
        { id: 'zap_cannon', name: 'Zap Cannon', power: 140, energyCost: 75, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'electric', rank: 2 },
        // fairy
        { id: 'play_rough', name: 'Play Rough', power: 90, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fairy', rank: 1 },
        { id: 'moonblast', name: 'Moonblast', power: 95, energyCost: 60, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fairy', rank: 2 },
        { id: 'dazzling_gleam', name: 'Dazzling Gleam', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fairy', rank: 2 },
        // flying
        { id: 'aerial_ace', name: 'Aerial Ace', power: 55, energyCost: 45, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'flying', rank: 1 },
        { id: 'fly', name: 'Fly', power: 90, energyCost: 60, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'flying', rank: 1 },
        { id: 'brave_bird', name: 'Brave Bird', power: 120, energyCost: 55, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'flying', rank: 2 },
        { id: 'hurricane', name: 'Hurricane', power: 110, energyCost: 70, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'flying', rank: 2 },
        // fighting
        { id: 'superpower', name: 'Superpower', power: 85, energyCost: 40, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fighting', rank: 1 },
        { id: 'high_jump_kick', name: 'High Jump Kick', power: 130, energyCost: 60, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'fighting', rank: 2 },
        { id: 'close_combat', name: 'Close Combat', power: 100, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'fighting', rank: 2 },
        // psychic
        { id: 'psychic', name: 'Psychic', power: 90, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'psychic', rank: 1 },
        { id: 'future_sight', name: 'Future Sight', power: 120, energyCost: 70, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'psychic', rank: 2 },
        { id: 'calm_mind', name: 'Calm Mind', power: 0, energyCost: 50, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: 'sA+6,sD+6', type: 'psychic', rank: 1 },
        { id: 'rest', name: 'Rest', power: 0, energyCost: 50, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: 'sH+10,sA-10', type: 'psychic', rank: 1 },
        // ghost
        { id: 'shadow_ball', name: 'Shadow Ball', power: 100, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'ghost', rank: 1 },
        { id: 'ominus_wind', name: 'Ominous Wind', power: 60, energyCost: 45, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'ghost', rank: 1 },
        // ice 
        { id: 'ice_beam', name: 'Ice Beam', power: 90, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'ice', rank: 1 },
        { id: 'blizzard', name: 'Blizzard', power: 130, energyCost: 70, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'ice', rank: 2 },
        { id: 'sheer_cold', name: 'Sheer Cold', power: 150, energyCost: 80, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'ice', rank: 3 },
        // dragon
        { id: 'dragon_pulse', name: 'Dragon Pulse', power: 85, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'dragon', rank: 1 },
        { id: 'dragon_claw', name: 'Dragon Claw', power: 60, energyCost: 35, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'dragon', rank: 1 },
        { id: 'outrage', name: 'Outrage', power: 110, energyCost: 65, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'dragon', rank: 2 },
        // bug
        { id: 'x_scissor', name: 'X-Scissor', power: 65, energyCost: 40, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'bug', rank: 1 },
        { id: 'megahorn', name: 'Megahorn', power: 120, energyCost: 65, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'bug', rank: 2 },
        // ground 
        { id: 'dig', name: 'Dig', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 2, specialEffects: '', type: 'ground', rank: 1 },
        { id: 'earthquake', name: 'Earthquake', power: 120, energyCost: 65, chargeUpTime: 1, coolDownTime: 1.5, specialEffects: '', type: 'ground', rank: 2 },
        { id: 'fissure', name: 'Fissure', power: 150, energyCost: 75, chargeUpTime: 1, coolDownTime: 2.5, specialEffects: '', type: 'ground', rank: 3 },
        // rock
        { id: 'rock_slide', name: 'Rock Slide', power: 75, energyCost: 45, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'rock', rank: 1 },
        { id: 'stone_edge', name: 'Stone Edge', power: 100, energyCost: 60, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'rock', rank: 2 },
        // steel
        { id: 'iron_tail', name: 'Iron Tail', power: 100, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'steel', rank: 1 },
        { id: 'flash_cannon', name: 'Flash Cannon', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'steel', rank: 1 },
        { id: 'meteor_mash', name: 'Meteor Mash', power: 90, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'steel', rank: 2 },
        { id: 'gyro_ball', name: 'Gyro Ball', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'steel', rank: 2 },
        // dark 
        { id: 'foul_play', name: 'Foul Play', power: 90, energyCost: 55, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'dark', rank: 1 },
        { id: 'dark_pulse', name: 'Dark Pulse', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'dark', rank: 1 },
        { id: 'crunch', name: 'Crunch', power: 80, energyCost: 50, chargeUpTime: 1, coolDownTime: 1, specialEffects: '', type: 'dark', rank: 1 },
    ]);
    const CHARGED_MOVES_BY_ID = Object.freeze(Object.fromEntries(CHARGED_MOVES.map(m => [m.id, m])));
    const CHARGED_MOVE_IDS = CHARGED_MOVES.map(m => m.id);
    global.PokemonChargedMoves = {
        CHARGED_MOVES,
        CHARGED_MOVES_BY_ID,
        CHARGED_MOVE_IDS,
    };
})(window);
