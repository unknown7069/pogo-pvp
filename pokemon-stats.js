(function(global){
  // GO Stat conversion helpers (placeholder formulas)
  // Each takes a main-series baseStats object and returns a numeric value.
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

  global.PokemonStats = {
    calcGoHp,
    calcGoAttack,
    calcGoDefense,
    calcGoSpeed,
  };
})(window);

