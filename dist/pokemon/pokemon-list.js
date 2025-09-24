(function () {
    const store = (window.AppState || null);
    const PD = (window.PokemonData || {});
    const grid = document.getElementById('pokemonGrid');
    const countEl = document.getElementById('pokemonCount');
    if (!grid)
        return;
    const SHOW_SPRITES = true;
    const readState = (typeof window.readState === 'function')
        ? window.readState
        : function () {
            if (store && typeof store.read === 'function')
                return store.read();
            if (store && typeof store.all === 'function')
                return store.all();
            try {
                const raw = window.localStorage ? window.localStorage.getItem('pogo-pvp-state') : null;
                return raw ? JSON.parse(raw) : {};
            }
            catch (_) {
                return {};
            }
        };
    const writeState = (typeof window.writeState === 'function')
        ? window.writeState
        : function (patch) {
            if (!patch || Object(patch) !== patch)
                return;
            if (store && typeof store.write === 'function') {
                store.write(patch);
                return;
            }
            if (store && typeof store.merge === 'function') {
                store.merge(patch);
                return;
            }
            if (store && typeof store.set === 'function') {
                Object.keys(patch).forEach((key) => store.set(key, patch[key]));
                return;
            }
            try {
                const next = Object.assign({}, readState(), patch);
                if (window.localStorage) {
                    window.localStorage.setItem('pogo-pvp-state', JSON.stringify(next));
                }
            }
            catch (_) { }
        };
    const subscribeState = (typeof window.subscribeState === 'function')
        ? window.subscribeState
        : (store && typeof store.subscribe === 'function' ? store.subscribe.bind(store) : null);
    function sanitizeEntry(entry) {
        if (!entry || typeof entry !== 'object')
            return null;
        const source = entry;
        const uid = typeof source.uid === 'string' && source.uid ? source.uid : null;
        const id = Number(source.id);
        const level = Number(source.level);
        if (!uid || Number.isNaN(id) || Number.isNaN(level))
            return null;
        const normalized = {
            uid,
            id,
            level,
            name: typeof source.name === 'string' ? source.name : null,
            createdAt: Number.isFinite(source.createdAt) ? Number(source.createdAt) : undefined,
        };
        if (source.shiny != null)
            normalized.shiny = source.shiny;
        if (source.ivHp != null)
            normalized.ivHp = Number(source.ivHp);
        if (source.ivAttack != null)
            normalized.ivAttack = Number(source.ivAttack);
        if (source.ivDefense != null)
            normalized.ivDefense = Number(source.ivDefense);
        if (source.ivs && typeof source.ivs === 'object') {
            const ivs = source.ivs;
            normalized.ivs = {
                hp: ivs.hp,
                attack: ivs.attack,
                defense: ivs.defense,
            };
        }
        return normalized;
    }
    function getCollection(state) {
        const src = state && typeof state === 'object' && Array.isArray(state.playerPokemon)
            ? state.playerPokemon
            : [];
        const clean = [];
        for (let i = 0; i < src.length; i++) {
            const entry = sanitizeEntry(src[i]);
            if (entry)
                clean.push(entry);
        }
        return clean;
    }
    function collectionEquals(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            const x = a[i];
            const y = b[i];
            if (!x || !y)
                return false;
            if (x.uid !== y.uid || x.id !== y.id || x.level !== y.level)
                return false;
            const xShiny = x.shiny == null ? '' : x.shiny;
            const yShiny = y.shiny == null ? '' : y.shiny;
            if (String(xShiny) !== String(yShiny))
                return false;
            if (String(x.ivHp == null ? '' : x.ivHp) !== String(y.ivHp == null ? '' : y.ivHp))
                return false;
            if (String(x.ivAttack == null ? '' : x.ivAttack) !== String(y.ivAttack == null ? '' : y.ivAttack))
                return false;
            if (String(x.ivDefense == null ? '' : x.ivDefense) !== String(y.ivDefense == null ? '' : y.ivDefense))
                return false;
            const xi = x.ivs ? [x.ivs.hp == null ? '' : x.ivs.hp, x.ivs.attack == null ? '' : x.ivs.attack, x.ivs.defense == null ? '' : x.ivs.defense].join('|') : '';
            const yi = y.ivs ? [y.ivs.hp == null ? '' : y.ivs.hp, y.ivs.attack == null ? '' : y.ivs.attack, y.ivs.defense == null ? '' : y.ivs.defense].join('|') : '';
            if (String(xi) !== String(yi))
                return false;
        }
        return true;
    }
    function formatLevel(level) {
        const rounded = Math.round(level);
        if (Math.abs(level - rounded) < 0.01)
            return String(rounded);
        return level.toFixed(1).replace(/0+$/, '').replace(/\.$/, '');
    }
    function getMonById(source) {
        const entry = source && typeof source === 'object' ? source : null;
        const key = entry ? Number(entry.id) : Number(source);
        if (!Number.isFinite(key))
            return { id: key, name: 'Pokemon', types: ['normal'], fastMoves: [], chargedMoves: [] };
        if (PD.getPokemonById) {
            try {
                const found = PD.getPokemonById(key, entry);
                if (found)
                    return found;
            }
            catch (_) { }
        }
        if (PD.byId && typeof PD.byId.get === 'function') {
            const viaMap = PD.byId.get(key);
            if (viaMap)
                return viaMap;
        }
        return { id: key, name: 'Pokemon', types: ['normal'], fastMoves: [], chargedMoves: [] };
    }
    function computeCp(id, level) {
        try {
            if (PD.getGoStatsById) {
                const stats = PD.getGoStatsById(id, level);
                if (stats && PD.calcGoCp) {
                    return Math.max(10, Math.round(PD.calcGoCp(stats)));
                }
            }
        }
        catch (_) { /* ignore */ }
        return 10;
    }
    function getSpriteUrl(mon) {
        const name = (mon && mon.name) || 'Pokemon';
        const shiny = !!(mon && mon.shiny);
        if (PD.getBattleSpriteUrl) {
            try {
                const url = PD.getBattleSpriteUrl(name, 'opponent', shiny);
                if (url)
                    return url;
            }
            catch (_) { }
        }
        if (PD.getForwardSpriteUrl) {
            try {
                const url = PD.getForwardSpriteUrl(name);
                if (url)
                    return url;
            }
            catch (_) { }
        }
        return '';
    }
    function updateCount(count) {
        if (countEl)
            countEl.textContent = `Pokemon ${count}`;
    }
    function renderGrid(collection) {
        grid.textContent = '';
        updateCount(collection.length);
        if (!collection.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No Pokemon saved yet.';
            grid.appendChild(empty);
            return;
        }
        const frag = document.createDocumentFragment();
        collection.forEach((entry) => {
            var _a, _b, _c;
            const mon = getMonById(entry);
            const card = document.createElement('div');
            card.className = 'pokemon-card';
            const btn = document.createElement('button');
            btn.className = 'pokemon-btn';
            btn.type = 'button';
            btn.dataset.id = String(entry.id);
            btn.dataset.uid = entry.uid || undefined;
            btn.dataset.level = String(entry.level);
            btn.dataset.name = mon.name || 'Pokemon';
            btn.setAttribute('aria-label', `${mon.name || 'Pokemon'} level ${formatLevel(entry.level)}`);
            const cp = computeCp(entry.id, (_a = entry.level) !== null && _a !== void 0 ? _a : 0);
            const cpEl = document.createElement('div');
            cpEl.className = 'cp';
            cpEl.textContent = `Lvl ${formatLevel((_b = entry.level) !== null && _b !== void 0 ? _b : 0)} | CP ${cp}`;
            const nameEl = document.createElement('div');
            nameEl.className = 'name';
            nameEl.textContent = mon.name || 'Pokemon';
            if (SHOW_SPRITES) {
                const spriteUrl = getSpriteUrl(mon);
                if (spriteUrl) {
                    const spriteWrap = document.createElement('div');
                    spriteWrap.className = 'sprite-wrap';
                    spriteWrap.style.backgroundImage = `url('${spriteUrl}')`;
                    btn.appendChild(spriteWrap);
                }
            }
            card.appendChild(btn);
            card.appendChild(cpEl);
            card.appendChild(nameEl);
            card.title = `${mon.name || 'Pokemon'} (Lvl ${formatLevel((_c = entry.level) !== null && _c !== void 0 ? _c : 0)})`;
            frag.appendChild(card);
        });
        grid.appendChild(frag);
    }
    const initialState = readState();
    let collection = getCollection(initialState);
    renderGrid(collection);
    if (typeof subscribeState === 'function') {
        subscribeState((stateSnapshot) => {
            const next = getCollection(stateSnapshot);
            if (!collectionEquals(collection, next)) {
                collection = next;
                renderGrid(collection);
            }
            else {
                updateCount(collection.length);
            }
        });
    }
    grid.addEventListener('click', (event) => {
        const target = event.target;
        const btn = target ? target.closest('.pokemon-btn') : null;
        if (!btn)
            return;
        const id = Number(btn.dataset.id || 0);
        if (!id)
            return;
        const level = Number(btn.dataset.level || 0) || 20;
        const view = { id, name: btn.dataset.name || null, level };
        const uid = btn.dataset.uid;
        if (uid)
            view.uid = uid;
        writeState({ viewPokemon: view });
        window.location.href = 'pokemon-detail.html';
    });
    const page = document.querySelector('.phone.phone-column');
    if (page && window.UI && typeof window.UI.attachDragScroll === 'function') {
        window.UI.attachDragScroll(page);
    }
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn)
        closeBtn.addEventListener('click', () => {
            window.location.href = 'rocket-select.html';
        });
})();
