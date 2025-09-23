(function(global){
  // GO Stat conversion helpers (placeholder formulas)
  // Each takes a main-series baseStats object and returns a numeric value.
  function calcGoHp(baseStats, level) {
    if (!baseStats) return 10;
    const hp = Number(baseStats.hp || 10);
    const mult = calcCpMultiplier(level);
    return Math.round((40 + hp * 1.8) * mult);
  }

  function calcGoAttack(baseStats, level) {
    if (!baseStats) return 10;
    const atk = Number(baseStats.attack || 10);
    const spa = Number(baseStats.spAttack || 10);
    const mult = calcCpMultiplier(level);
    const base = (10 + Math.max(atk, spa) * 7/8 + Math.min(atk, spa) * 1/8) * 2;
    return Math.round(base * mult);
  }

  function calcGoDefense(baseStats, level) {
    if (!baseStats) return 10;
    const def = Number(baseStats.defense || 10);
    const spd = Number(baseStats.spDefense || 10);
    const mult = calcCpMultiplier(level);
    const base = (10 + Math.max(def, spd) * 5/8 + Math.min(def, spd) * 3/8) * 2;
    return Math.round(base * mult);
  }

  function calcGoSpeed(baseStats, level) {
    if (!baseStats) return 10;
    const spe = Number(baseStats.speed || 10);
    const mult = calcCpMultiplier(level);
    const base = (40 + spe) * 1.1;
    return Math.round(base * mult);
  }

  // Static CP multipliers by level (sourced from GamePress)
  // Levels span 1.0 to 50.0 in 0.5 increments.
  const CP_MULTIPLIER_BY_LEVEL = Object.freeze({
    1: 0.094,
    1.5: 0.135137432,
    2: 0.16639787,
    2.5: 0.192650919,
    3: 0.21573247,
    3.5: 0.2365726613,
    4: 0.25572005,
    4.5: 0.2735303812,
    5: 0.29024988,
    5.5: 0.3060573775,
    6: 0.3210876,
    6.5: 0.3354450362,
    7: 0.34921268,
    7.5: 0.3624577511,
    8: 0.3752356,
    8.5: 0.387592416,
    9: 0.39956728,
    9.5: 0.4111935514,
    10: 0.4225,
    10.5: 0.4329264091,
    11: 0.44310755,
    11.5: 0.4530599591,
    12: 0.46279839,
    12.5: 0.472336083,
    13: 0.48168495,
    13.5: 0.4908558,
    14: 0.49985844,
    14.5: 0.508701765,
    15: 0.51739395,
    15.5: 0.525942511,
    16: 0.53435433,
    16.5: 0.542635767,
    17: 0.55079269,
    17.5: 0.558830576,
    18: 0.56675452,
    18.5: 0.574569153,
    19: 0.58227891,
    19.5: 0.589887917,
    20: 0.5974,
    20.5: 0.604818814,
    21: 0.61215729,
    21.5: 0.619404122,
    22: 0.62656713,
    22.5: 0.633649143,
    23: 0.64065295,
    23.5: 0.647580966,
    24: 0.65443563,
    24.5: 0.661219252,
    25: 0.667934,
    25.5: 0.674581895,
    26: 0.68116492,
    26.5: 0.687684904,
    27: 0.69414365,
    27.5: 0.70054287,
    28: 0.7068842,
    28.5: 0.713169109,
    29: 0.7193991,
    29.5: 0.725575614,
    30: 0.7317,
    30.5: 0.734741009,
    31: 0.73776948,
    31.5: 0.740785574,
    32: 0.74378943,
    32.5: 0.746781211,
    33: 0.74976104,
    33.5: 0.752729087,
    34: 0.75568551,
    34.5: 0.758630378,
    35: 0.76156384,
    35.5: 0.764486065,
    36: 0.76739717,
    36.5: 0.770297266,
    37: 0.7731865,
    37.5: 0.776064962,
    38: 0.77893275,
    38.5: 0.7817900548,
    39: 0.784637,
    39.5: 0.787473578,
    40: 0.7903,
    40.5: 0.792803968,
    41: 0.79530001,
    41.5: 0.797803922,
    42: 0.8003,
    42.5: 0.802803911,
    43: 0.8053,
    43.5: 0.807803863,
    44: 0.81029999,
    44.5: 0.812803734,
    45: 0.81529999,
    45.5: 0.817803693,
    46: 0.82029999,
    46.5: 0.822803673,
    47: 0.82529999,
    47.5: 0.827803644,
    48: 0.83029999,
    48.5: 0.83279999,
    49: 0.83529999,
    49.5: 0.83779999,
    50: 0.84029999,
  });

  function calcCpMultiplier(level) {
    const Lraw = Number(level || 0);
    // Clamp to [1, 50] and snap to nearest 0.5
    const L = Math.max(1, Math.min(50, Lraw));
    const snapped = Math.round(L * 2) / 2;
    const key = String(snapped);
    if (Object.prototype.hasOwnProperty.call(CP_MULTIPLIER_BY_LEVEL, key)) {
      return CP_MULTIPLIER_BY_LEVEL[key];
    }
    return 0;
  }

  // CP calculation from GO stats with level multiplier
  // Subtract 20 from each stat to lower the CP for low-stat Pokémon.
  // Use pow to increase the gap between low and high stat Pokémon.
  function calcGoCp(stats) {
    if (!stats) return 10;
    function normalize(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return 1;
      const adjusted = n - 20;
      return adjusted > 1 ? adjusted : 1;
    }
    const a = normalize(stats.attack);
    const d = normalize(stats.defense);
    const h = normalize(stats.hp);
    const s = normalize(stats.speed);
    const product = a * d * h * s;
    const base = Math.sqrt(product) / 5 + 10;
    return Math.round(Math.max(10, base));
  }

  global.PokemonStats = {
    calcGoHp,
    calcGoAttack,
    calcGoDefense,
    calcGoSpeed,
    calcCpMultiplier,
    calcGoCp,
  };
})(window);
