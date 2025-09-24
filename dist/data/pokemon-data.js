(function (global) {
    // Pokemon data aggregator
    // Exposes: window.PokemonData with { all, byId, getPokemonById, move lists, types, stats }
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const MovesFast = (_a = global.PokemonFastMoves) !== null && _a !== void 0 ? _a : null;
    const MovesCharged = (_b = global.PokemonChargedMoves) !== null && _b !== void 0 ? _b : null;
    const TYPES = (_c = global.PokemonTypes) !== null && _c !== void 0 ? _c : [];
    const SPECIES = ((_d = global.PokemonSpecies) !== null && _d !== void 0 ? _d : {});
    const Stats = (_e = global.PokemonStats) !== null && _e !== void 0 ? _e : null;
    // Build catalogue from species map
    const canonical = Object.values(SPECIES);
    const all = canonical.slice();
    const byId = new Map(all.map((p) => [p.id, p]));
    // Species sorted by max cp desc
    const calcCp = (_f = Stats === null || Stats === void 0 ? void 0 : Stats.calcGoCp) !== null && _f !== void 0 ? _f : null;
    all.sort((a, b) => {
        const aMaxCp = calcCp && a.baseStats ? calcCp(a.baseStats) : 0;
        const bMaxCp = calcCp && b.baseStats ? calcCp(b.baseStats) : 0;
        return bMaxCp - aMaxCp;
    });
    function clampIv(value) {
        const n = Number(value);
        if (!Number.isFinite(n))
            return null;
        if (n <= 0)
            return 0;
        if (n >= 15)
            return 15;
        return Math.round(n);
    }
    function normalizeShiny(value) {
        if (value === true)
            return 1;
        if (value === false)
            return 0;
        const n = Number(value);
        if (Number.isFinite(n))
            return n === 1 ? 1 : 0;
        return value ? 1 : 0;
    }
    function applyCollectionOverrides(mon, overrides) {
        if (!overrides || Object(overrides) !== overrides)
            return mon;
        const copy = Object.assign({}, mon);
        if (overrides.shiny != null) {
            copy.shiny = normalizeShiny(overrides.shiny);
        }
        let sourceIvs = null;
        if (overrides.ivs && Object(overrides.ivs) === overrides.ivs) {
            sourceIvs = overrides.ivs;
        }
        const hpIv = clampIv(sourceIvs ? sourceIvs.hp : overrides.ivHp);
        const atkIv = clampIv(sourceIvs ? sourceIvs.attack : overrides.ivAttack);
        const defIv = clampIv(sourceIvs ? sourceIvs.defense : overrides.ivDefense);
        if (hpIv != null || atkIv != null || defIv != null) {
            const baseIvs = (mon.ivs && Object(mon.ivs) === mon.ivs) ? mon.ivs : {};
            copy.ivs = Object.assign({}, baseIvs);
            if (hpIv != null)
                copy.ivs.hp = hpIv;
            if (atkIv != null)
                copy.ivs.attack = atkIv;
            if (defIv != null)
                copy.ivs.defense = defIv;
        }
        return copy;
    }
    function getPokemonById(id, overrides) {
        const key = Number(id);
        if (!Number.isFinite(key))
            return null;
        const mon = byId.get(key) || null;
        if (!mon)
            return null;
        return overrides ? applyCollectionOverrides(mon, overrides) : mon;
    }
    function getGoStatsById(id, level) {
        const mon = getPokemonById(id);
        if (!mon)
            return null;
        const bs = mon.baseStats;
        return {
            hp: (Stats === null || Stats === void 0 ? void 0 : Stats.calcGoHp) ? Stats.calcGoHp(bs, level) : 10,
            attack: (Stats === null || Stats === void 0 ? void 0 : Stats.calcGoAttack) ? Stats.calcGoAttack(bs, level) : 10,
            defense: (Stats === null || Stats === void 0 ? void 0 : Stats.calcGoDefense) ? Stats.calcGoDefense(bs, level) : 10,
            speed: (Stats === null || Stats === void 0 ? void 0 : Stats.calcGoSpeed) ? Stats.calcGoSpeed(bs, level) : 10,
        };
    }
    // Slugify a Pokemon species name to match pokemondb naming.
    function slugifyName(name) {
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
    function getForwardSpriteUrl(monOrName) {
        const name = typeof monOrName === 'string' ? monOrName : (monOrName === null || monOrName === void 0 ? void 0 : monOrName.name) || '';
        const slug = slugifyName(name);
        return `https://img.pokemondb.net/sprites/black-white/normal/${slug}.png`;
    }
    // Build animated battle sprite URL (front/back) for Gen5 style.
    function getBattleSpriteUrl(name, side, isShiny) {
        const slug = slugifyName(name);
        if (!slug)
            return '';
        const direction = String(side) === 'player' ? 'back-' : '';
        const style = isShiny ? 'shiny' : 'normal';
        return `https://img.pokemondb.net/sprites/black-white/anim/${direction}${style}/${slug}.gif`;
    }
    const FAST_MOVE_IDS = (_g = MovesFast === null || MovesFast === void 0 ? void 0 : MovesFast.FAST_MOVE_IDS) !== null && _g !== void 0 ? _g : [];
    const CHARGED_MOVE_IDS = (_h = MovesCharged === null || MovesCharged === void 0 ? void 0 : MovesCharged.CHARGED_MOVE_IDS) !== null && _h !== void 0 ? _h : [];
    const FAST_MOVES = (_j = MovesFast === null || MovesFast === void 0 ? void 0 : MovesFast.FAST_MOVES) !== null && _j !== void 0 ? _j : [];
    const FAST_MOVES_BY_ID = (_k = MovesFast === null || MovesFast === void 0 ? void 0 : MovesFast.FAST_MOVES_BY_ID) !== null && _k !== void 0 ? _k : {};
    const CHARGED_MOVES = (_l = MovesCharged === null || MovesCharged === void 0 ? void 0 : MovesCharged.CHARGED_MOVES) !== null && _l !== void 0 ? _l : [];
    const CHARGED_MOVES_BY_ID = (_m = MovesCharged === null || MovesCharged === void 0 ? void 0 : MovesCharged.CHARGED_MOVES_BY_ID) !== null && _m !== void 0 ? _m : {};
    const pokemonData = {
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
        calcGoHp: Stats === null || Stats === void 0 ? void 0 : Stats.calcGoHp,
        calcGoAttack: Stats === null || Stats === void 0 ? void 0 : Stats.calcGoAttack,
        calcGoDefense: Stats === null || Stats === void 0 ? void 0 : Stats.calcGoDefense,
        calcGoSpeed: Stats === null || Stats === void 0 ? void 0 : Stats.calcGoSpeed,
        calcCpMultiplier: Stats === null || Stats === void 0 ? void 0 : Stats.calcCpMultiplier,
        calcGoCp: Stats === null || Stats === void 0 ? void 0 : Stats.calcGoCp,
        getGoStatsById,
    };
    global.PokemonData = pokemonData;
})(window);
