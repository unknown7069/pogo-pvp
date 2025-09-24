(function (global: Window & typeof window) {
  // Pokemon data aggregator
  // Exposes: window.PokemonData with { all, byId, getPokemonById, move lists, types, stats }

  const MovesFast = global.PokemonFastMoves ?? null;
  const MovesCharged = global.PokemonChargedMoves ?? null;
  const TYPES = global.PokemonTypes ?? [];
  const SPECIES = (global.PokemonSpecies ?? {}) as Record<number, PokemonSpeciesData>;
  const Stats = global.PokemonStats ?? null;

  // Build catalogue from species map
  const canonical = Object.values(SPECIES) as PokemonSpeciesData[];
  const all = canonical.slice();
  const byId = new Map<number, PokemonSpeciesData>(all.map((p) => [p.id, p]));

  // Species sorted by max cp desc
  const calcCp = Stats?.calcGoCp ?? null;
  all.sort((a, b) => {
    const aMaxCp = calcCp && a.baseStats ? calcCp(a.baseStats) : 0;
    const bMaxCp = calcCp && b.baseStats ? calcCp(b.baseStats) : 0;
    return bMaxCp - aMaxCp;
  });

  function clampIv(value: unknown): number | null {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return 0;
    if (n >= 15) return 15;
    return Math.round(n);
  }

  function normalizeShiny(value: unknown): 0 | 1 {
    if (value === true) return 1;
    if (value === false) return 0;
    const n = Number(value);
    if (Number.isFinite(n)) return n === 1 ? 1 : 0;
    return value ? 1 : 0;
  }

  function applyCollectionOverrides(mon: any, overrides?: PokemonCollectionEntry | null) {
    if (!overrides || Object(overrides) !== overrides) return mon;
    const copy: any = Object.assign({}, mon);
    if (overrides.shiny != null) {
      copy.shiny = normalizeShiny(overrides.shiny);
    }
    let sourceIvs: PokemonCollectionEntry['ivs'] | null = null;
    if (overrides.ivs && Object(overrides.ivs) === overrides.ivs) {
      sourceIvs = overrides.ivs;
    }
    const hpIv = clampIv(sourceIvs ? sourceIvs.hp : overrides.ivHp);
    const atkIv = clampIv(sourceIvs ? sourceIvs.attack : overrides.ivAttack);
    const defIv = clampIv(sourceIvs ? sourceIvs.defense : overrides.ivDefense);
    if (hpIv != null || atkIv != null || defIv != null) {
      const baseIvs = (mon.ivs && Object(mon.ivs) === mon.ivs) ? mon.ivs : {};
      copy.ivs = Object.assign({}, baseIvs);
      if (hpIv != null) copy.ivs.hp = hpIv;
      if (atkIv != null) copy.ivs.attack = atkIv;
      if (defIv != null) copy.ivs.defense = defIv;
    }
    return copy;
  }

  function getPokemonById(id: number | string, overrides?: PokemonCollectionEntry | null) {
    const key = Number(id);
    if (!Number.isFinite(key)) return null;
    const mon = byId.get(key) || null;
    if (!mon) return null;
    return overrides ? applyCollectionOverrides(mon, overrides) : mon;
  }

  function getGoStatsById(id: number | string, level: number) {
    const mon = getPokemonById(id);
    if (!mon) return null;
    const bs = mon.baseStats;
    return {
      hp: Stats?.calcGoHp ? Stats.calcGoHp(bs, level) : 10,
      attack: Stats?.calcGoAttack ? Stats.calcGoAttack(bs, level) : 10,
      defense: Stats?.calcGoDefense ? Stats.calcGoDefense(bs, level) : 10,
      speed: Stats?.calcGoSpeed ? Stats.calcGoSpeed(bs, level) : 10,
    };
  }

  // Slugify a Pokemon species name to match pokemondb naming.
  function slugifyName(name: string) {
    let s = String(name || '').toLowerCase().trim();
    // replace ? with -f, ? with -m
    s = s = s.replace('\u2640', '-f').replace('\u2642', '-m');
    // replace . with -
    s = s.replace(/\./g, '-');
    // replace "'" with empty
    s = s.replace(/'/g, '');

    return s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function getForwardSpriteUrl(monOrName: string | PokemonSpeciesData) {
    const name = typeof monOrName === 'string' ? monOrName : monOrName?.name || '';
    const slug = slugifyName(name);
    return `https://img.pokemondb.net/sprites/black-white/normal/${slug}.png`;
  }

  // Build animated battle sprite URL (front/back) for Gen5 style.
  function getBattleSpriteUrl(name: string, side: 'player' | 'opponent', isShiny?: unknown) {
    const slug = slugifyName(name);
    if (!slug) return '';
    const direction = String(side) === 'player' ? 'back-' : '';
    const style = isShiny ? 'shiny' : 'normal';
    return `https://img.pokemondb.net/sprites/black-white/anim/${direction}${style}/${slug}.gif`;
  }

  const FAST_MOVE_IDS = MovesFast?.FAST_MOVE_IDS ?? [];
  const CHARGED_MOVE_IDS = MovesCharged?.CHARGED_MOVE_IDS ?? [];
  const FAST_MOVES = MovesFast?.FAST_MOVES ?? [];
  const FAST_MOVES_BY_ID = MovesFast?.FAST_MOVES_BY_ID ?? {};
  const CHARGED_MOVES = MovesCharged?.CHARGED_MOVES ?? [];
  const CHARGED_MOVES_BY_ID = MovesCharged?.CHARGED_MOVES_BY_ID ?? {};

  const pokemonData: PokemonDataStore = {
    all,
    byId,
    getPokemonById,
    slugifyName,
    getForwardSpriteUrl,
    getBattleSpriteUrl,
    FAST_MOVE_IDS,
    CHARGED_MOVE_IDS,
    FAST_MOVES,
    FAST_MOVES_BY_ID,
    CHARGED_MOVES,
    CHARGED_MOVES_BY_ID,
    TYPES,
    calcGoHp: Stats?.calcGoHp,
    calcGoAttack: Stats?.calcGoAttack,
    calcGoDefense: Stats?.calcGoDefense,
    calcGoSpeed: Stats?.calcGoSpeed,
    calcCpMultiplier: Stats?.calcCpMultiplier,
    calcGoCp: Stats?.calcGoCp,
    getGoStatsById,
  };

  global.PokemonData = pokemonData;
})(window);

