
(function(){
    const PD = window.PokemonData || {};
    const grid = document.getElementById('pokemonGrid');
    const list = Array.isArray(PD.all) && PD.all.length ? PD.all : [];
    // Toggle sprite rendering in the grid
    const SHOW_SPRITES = true;

    // Header count: unlocked/total (unlocked currently unimplemented; default 0)
    const countEl = document.getElementById('pokemonCount');
    const unlocked = (window.AppState && typeof AppState.get === 'function')
    ? (Number(AppState.get('unlockedCount', 0)) || 0)
    : 0;
    if (countEl) countEl.textContent = `Pokemon ${unlocked}/${list.length}`;

function renderGrid() {
grid.innerHTML = '';
list.forEach((mon) => {
    const card = document.createElement('div');
    card.className = 'pokemon-card';

    const btn = document.createElement('button');
    btn.className = 'pokemon-btn';
    btn.type = 'button';
    btn.dataset.id = String(mon.id);
    btn.dataset.name = mon.name;

    // Compute CP from GO stats (default level)
    let cp = 10;
    const level = 50;
    try {
    const stats = PD.getGoStatsById ? PD.getGoStatsById(mon.id, level) : null;
    cp = PD.calcGoCp && stats ? PD.calcGoCp(stats) : 10;
    } catch (_) { /* ignore */ }

    // Get sprite URL from central helper
    const imgUrl = PD.getForwardSpriteUrl ? PD.getForwardSpriteUrl(mon) : '';

    // Top: CP (overlay inside container)
    const cpEl = document.createElement('div');
    cpEl.className = 'cp';
    cpEl.textContent = `CP ${cp}`;

    // Bottom: name (overlay inside container)
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = mon.name;

    if (SHOW_SPRITES && imgUrl) {
    const spriteWrap = document.createElement('div');
    spriteWrap.className = 'sprite-wrap';
    spriteWrap.style.backgroundImage = `url('${imgUrl}')`;
    btn.appendChild(spriteWrap);
    }

    // Compose container: button + overlays
    card.appendChild(btn);
    card.appendChild(cpEl);
    card.appendChild(nameEl);
    grid.appendChild(card);
});
}

// Drag-to-scroll on the full page to match detail view
const page = document.querySelector('.phone.phone-column');
if (page && window.UI && typeof window.UI.attachDragScroll === 'function') {
window.UI.attachDragScroll(page);
}

renderGrid();

// Navigate to detail on click (store selected id)
grid.addEventListener('click', (e) => {
const btn = e.target.closest('.pokemon-btn');
if (!btn) return;
const id = Number(btn.dataset.id || 0);
const name = btn.dataset.name || '';
if (window.AppState) {
    if (typeof AppState.write === 'function') AppState.write({ viewPokemon: { id, name } });
    else if (typeof AppState.merge === 'function') AppState.merge({ viewPokemon: { id, name } });
    else if (typeof AppState.set === 'function') AppState.set('viewPokemon', { id, name });
}
window.location.href = 'pokemon-detail.html';
});

// Bottom close
const closeBtn = document.getElementById('closeBtn');
if (closeBtn) closeBtn.addEventListener('click', () => {
if (document.referrer) {
    history.back();
} else {
    window.location.href = 'rocket-select.html';
}
});
})();