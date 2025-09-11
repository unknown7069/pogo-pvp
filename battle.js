// Battle logic with energy bar UI
(function(){
  // ---------------------------
  // Helpers and DOM references
  // ---------------------------
  function setHp(barEl, pct) {
    barEl.style.setProperty('--hp', pct + '%');
    const color = pct > 50 ? '#2ecc71' : pct > 20 ? '#f1c40f' : '#e74c3c';
    barEl.style.background = `linear-gradient(90deg, ${color}, ${color})`;
  }
  function setEn(barEl, pct) {
    barEl.style.setProperty('--en', pct + '%');
  }

  const $ = (id) => document.getElementById(id);
  const oppBar = $('opponent-hp');
  const oppText = $('opponent-hp-text');
  const playerBar = $('player-hp');
  const playerText = $('player-hp-text');
  const oppEnBar = $('opponent-energy');
  const playerEnBar = $('player-energy');

  const moveButtons = Array.from(document.querySelectorAll('.move-btn'));

  // Forfeit/back button: overlay confirm dialog
  const forfeitBtn = $('forfeitBtn');
  const overlay = $('forfeitOverlay');
  const cancelForfeit = $('cancelForfeit');
  const confirmForfeit = $('confirmForfeit');

  function openOverlay() { overlay.classList.add('show'); }
  function closeOverlay() { overlay.classList.remove('show'); }
  function doForfeit() {
    concludeBattle('forfeit');
  }

  if (forfeitBtn) forfeitBtn.addEventListener('click', openOverlay);
  if (cancelForfeit) cancelForfeit.addEventListener('click', closeOverlay);
  if (confirmForfeit) confirmForfeit.addEventListener('click', doForfeit);

  // Countdown overlay
  const cdOverlay = $('countdownOverlay');
  const cdText = $('countdownText');
  // End fade overlay
  const fadeOverlay = $('fadeOverlay');
  function fadeToBlack(durationMs){
    if (!fadeOverlay) return;
    if (durationMs && Number(durationMs) > 0) {
      fadeOverlay.style.transition = `opacity ${Number(durationMs)}ms ease`;
    }
    fadeOverlay.classList.add('show');
  }

  // ---------------------------
  // Real moves and Pokémon data
  // ---------------------------
  const PD = window.PokemonData || {};
  const FAST_BY_ID = PD.FAST_MOVES_BY_ID || {};
  const CHARGED_BY_ID = PD.CHARGED_MOVES_BY_ID || {};
  const ALL_SPECIES = Array.isArray(PD.all) ? PD.all : [];

  function fastFromId(id) {
    const m = FAST_BY_ID && FAST_BY_ID[id];
    if (!m) return { name: 'Fast', dmg: 5, energyGain: 8, rateMs: 1000, type: 'normal' };
    const rateMs = Number(m.attackRate || 1) * 500; // interpret units as 500ms
    return { name: m.name, dmg: Number(m.power||0), energyGain: Number(m.energyGain||0), rateMs, type: m.type };
  }
  function chargedFromId(id) {
    const m = CHARGED_BY_ID && CHARGED_BY_ID[id];
    if (!m) return { name: 'Charged', energy: 50, dmg: 80, chargeUpMs: 1500, type: 'normal' };
    const chargeUpMs = Number(m.chargeUpTime || 1) * 500; // 500ms units
    return { name: m.name, energy: Number(m.energyCost||0), dmg: Number(m.power||0), chargeUpMs, type: m.type };
  }

  // ---------------------------
  // Pokemon factories
  // ---------------------------
  function cpFromStats(stats) {
    const a = Number(stats.attack||0), d = Number(stats.defense||0), h = Number(stats.hp||0);
    return Math.max(10, Math.round((a + d) * 2 + h * 0.5));
  }

  function makePokemonFromId(id) {
    const mon = (PD.byId && PD.byId.get) ? PD.byId.get(Number(id)) : null;
    if (!mon) {
      // Fallback dummy
      const maxHP = 100;
      return {
        id: Number(id)||0,
        name: 'Pokemon',
        types: ['normal'],
        maxHP,
        hp: maxHP,
        energy: 0,
        cp: 500,
        fast: fastFromId('quick_attack'),
        charged: [ chargedFromId('body_slam'), chargedFromId('rock_slide'), chargedFromId('aqua_tail') ],
      };
    }
    const stats = PD.getGoStatsById ? PD.getGoStatsById(mon.id) : { hp: 100, attack: 50, defense: 50 };
    const maxHP = Math.max(1, Number(stats.hp||100));
    const fastId = Array.isArray(mon.fastMoves) && mon.fastMoves[0];
    const chargedIds = Array.isArray(mon.chargedMoves) ? mon.chargedMoves : [];
    const charged = chargedIds.slice(0,3).map(chargedFromId);
    return {
      id: mon.id,
      name: mon.name,
      types: Array.isArray(mon.types) ? mon.types : [],
      maxHP,
      hp: maxHP,
      energy: 0,
      cp: cpFromStats(stats),
      fast: fastFromId(fastId || 'quick_attack'),
      charged: charged.length ? charged : [ chargedFromId('body_slam') ],
    };
  }

  // ---------------------------
  // Battle state
  // ---------------------------
  // Read team and battle selection from localStorage; if missing, return to start
  const STORAGE_KEY = 'pogo-pvp-state';
  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }
  function writeState(patch) {
    try {
      const cur = readState();
      const next = Object.assign({}, cur, patch);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) { /* ignore */ }
  }

  const __state = readState();
  const selectedTeamIds = Array.isArray(__state.selectedTeamIds) ? __state.selectedTeamIds : null;
  const selectedTeamNamesLegacy = Array.isArray(__state.selectedTeam) ? __state.selectedTeam : null;
  const selectedBattle = (__state.selectedBattle && typeof __state.selectedBattle.index === 'number' && __state.selectedBattle.label)
    ? __state.selectedBattle
    : null;
  if ((!selectedTeamIds || selectedTeamIds.length === 0) && (!selectedTeamNamesLegacy || selectedTeamNamesLegacy.length === 0) || !selectedBattle) {
    // Required info missing; send player back to start screen
    window.location.replace('index.html');
    return;
  }

  const opponentIdx = Number(selectedBattle.index || 0);

  // Build player's team from IDs if available; else legacy fallback
  let playerTeam = [];
  let teamIds = [];
  if (selectedTeamIds && selectedTeamIds.length) {
    teamIds = selectedTeamIds.map(Number).slice(0,3);
    playerTeam = teamIds.map((id) => {
      const poke = makePokemonFromId(id);
      return { id, name: poke.name, pokemon: poke, fainted: false };
    });
  } else {
    // Legacy fallback: map names to first N species in PD
    const fallback = (ALL_SPECIES.length ? ALL_SPECIES : [{id:1,name:'Pokemon'},{id:4,name:'Pokemon'},{id:7,name:'Pokemon'}]);
    teamIds = selectedTeamNamesLegacy.map((_, i) => fallback[i % fallback.length].id);
    playerTeam = teamIds.map((id) => {
      const poke = makePokemonFromId(id);
      return { id, name: poke.name, pokemon: poke, fainted: false };
    });
  }

  let activePlayerIndex = 0;
  let player = playerTeam[activePlayerIndex].pokemon;
  // Build opponent's team from species list, rotating by stage index
  const pool = ALL_SPECIES.length ? ALL_SPECIES : [{id:1,name:'Pokemon'}];
  const oppIds = [0,1,2].map(i => pool[(opponentIdx + i) % pool.length].id);
  const opponentTeam = oppIds.map((id) => ({ id, pokemon: makePokemonFromId(id), fainted: false }));

  let activeOpponentIndex = 0;
  let opponent = opponentTeam[activeOpponentIndex].pokemon;

  // Persist/restore battle state (HP/Energy/active indexes) so switching preserves HP
  const PERSIST_KEY = 'battleState';

  function snapshotBattleState() {
    return {
      stageIndex: opponentIdx,
      opponentLabel: selectedBattle && selectedBattle.label,
      activePlayerIndex,
      activeOpponentIndex,
      playerTeam: playerTeam.map(m => ({
        id: m.id,
        name: m.name,
        hp: m.pokemon.hp,
        maxHP: m.pokemon.maxHP,
        energy: m.pokemon.energy,
        fainted: !!m.fainted,
      })),
      opponentTeam: opponentTeam.map(m => ({
        id: m.id,
        hp: m.pokemon.hp,
        maxHP: m.pokemon.maxHP,
        energy: m.pokemon.energy,
        fainted: !!m.fainted,
      })),
      timestamp: Date.now(),
    };
  }

  function persistBattleState() {
    try {
      const cur = readState();
      cur[PERSIST_KEY] = snapshotBattleState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (_) { /* ignore storage errors */ }
  }

  function restoreBattleStateIfPresent() {
    try {
      const saved = readState()[PERSIST_KEY];
      if (!saved || typeof saved !== 'object') return false;
      if (Number(saved.stageIndex) !== Number(opponentIdx)) return false;
      // Validate team matches
      const savedIds = (saved.playerTeam || []).map(p => p.id);
      const sameTeam = Array.isArray(savedIds) && savedIds.length === teamIds.length && savedIds.every((n, i) => Number(n) === Number(teamIds[i]));
      if (!sameTeam) return false;
      // Apply player team hp/energy/fainted
      (saved.playerTeam || []).forEach((s, i) => {
        const m = playerTeam[i];
        if (!m) return;
        m.fainted = !!s.fainted;
        m.pokemon.hp = clamp(Number(s.hp || m.pokemon.hp), 0, m.pokemon.maxHP);
        m.pokemon.energy = clamp(Number(s.energy || 0), 0, 100);
      });
      // Apply opponent team
      (saved.opponentTeam || []).forEach((s, i) => {
        const m = opponentTeam[i];
        if (!m) return;
        m.fainted = !!s.fainted;
        m.pokemon.hp = clamp(Number(s.hp || m.pokemon.hp), 0, m.pokemon.maxHP);
        m.pokemon.energy = clamp(Number(s.energy || 0), 0, 100);
      });
      // Restore active indices
      if (typeof saved.activePlayerIndex === 'number') activePlayerIndex = Math.max(0, Math.min(saved.activePlayerIndex, playerTeam.length - 1));
      if (typeof saved.activeOpponentIndex === 'number') activeOpponentIndex = Math.max(0, Math.min(saved.activeOpponentIndex, opponentTeam.length - 1));
      // Re-point active references
      player = playerTeam[activePlayerIndex].pokemon;
      opponent = opponentTeam[activeOpponentIndex].pokemon;
      return true;
    } catch (_) {
      return false;
    }
  }

  // On first navigation to this page, reset any prior saved battle state
  (function resetStateOnFirstLoad(){
    try {
      const navEntries = (performance && performance.getEntriesByType) ? performance.getEntriesByType('navigation') : null;
      const nav = navEntries && navEntries[0];
      const isNavigate = nav ? nav.type === 'navigate' : (performance && performance.navigation ? performance.navigation.type === performance.navigation.TYPE_NAVIGATE : true);
      if (isNavigate) {
        const cur = readState();
        if (cur && cur[PERSIST_KEY]) {
          delete cur[PERSIST_KEY];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
        }
      }
    } catch (_) { /* ignore */ }
  })();

  // Attempt to hydrate state on load (only if not cleared above)
  restoreBattleStateIfPresent();

  const state = {
    active: false,
    controlsDisabled: true,
    charging: { player: false, opponent: false },
    timers: { playerFast: null, opponentFast: null, opponentAI: null, switchCountdown: null, switchAuto: null },
  };

  // ---------------------------
  // UI setup
  // ---------------------------
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  function updateHpUI() {
    const pPct = Math.max(0, Math.round((player.hp / player.maxHP) * 100));
    const oPct = Math.max(0, Math.round((opponent.hp / opponent.maxHP) * 100));
    if (playerText) playerText.textContent = `${Math.max(0, Math.round(player.hp))}/${player.maxHP}`;
    if (oppText) oppText.textContent = `${Math.max(0, Math.round(opponent.hp))}/${opponent.maxHP}`;
    setHp(playerBar, pPct);
    setHp(oppBar, oPct);
  }

  // Header: name, types, CP
  const oppNameEl = document.getElementById('opponent-name');
  const oppTypesEl = document.getElementById('opponent-types');
  const oppCpEl = document.getElementById('opponent-cp');
  const playerNameEl = document.getElementById('player-name');
  const playerTypesEl = document.getElementById('player-types');
  const playerCpEl = document.getElementById('player-cp');
  const oppSpriteEl = document.querySelector('.sprite.opponent');
  const playerSpriteEl = document.querySelector('.sprite.player');

  function renderTypes(container, types) {
    if (!container) return;
    container.innerHTML = '';
    (types || []).forEach(t => {
      const dot = document.createElement('span');
      dot.className = `type-dot t-${t}`;
      dot.title = t.toUpperCase();
      container.appendChild(dot);
    });
  }

  function updateHeaderUI() {
    if (oppNameEl) oppNameEl.textContent = opponent.name;
    if (oppCpEl) oppCpEl.textContent = `CP ${opponent.cp}`;
    renderTypes(oppTypesEl, opponent.types);
    if (playerNameEl) playerNameEl.textContent = player.name;
    if (playerCpEl) playerCpEl.textContent = `CP ${player.cp}`;
    renderTypes(playerTypesEl, player.types);
    if (oppSpriteEl) oppSpriteEl.textContent = (opponent.name || 'OPP').slice(0,4).toUpperCase();
    if (playerSpriteEl) playerSpriteEl.textContent = (player.name || 'YOU').slice(0,4).toUpperCase();
  }

  function updateEnergyUI() {
    const pPct = Math.max(0, Math.round(player.energy)); // energy is 0-100
    const oPct = Math.max(0, Math.round(opponent.energy));
    if (playerEnBar) setEn(playerEnBar, pPct);
    if (oppEnBar) setEn(oppEnBar, oPct);
  }

  function labelForCharged(move){ return `${move.name} (${move.energy})`; }

  function refreshMoveButtons() {
    moveButtons.forEach((btn, i) => {
      const move = player.charged[i];
      if (!move) return;
      // Update label element under the button
      const labelEl = btn.parentElement && btn.parentElement.querySelector('.move-label');
      if (labelEl) labelEl.textContent = labelForCharged(move);
      // Enable only if battle active, not globally disabled, not charging, and enough energy
      const canUse = state.active && !state.controlsDisabled && !state.charging.player && (player.energy >= move.energy);
      btn.disabled = !canUse;
    });
  }

  function setControlsDisabled(disabled) {
    state.controlsDisabled = disabled;
    // Forfeit reflects global lock
    if (forfeitBtn) forfeitBtn.disabled = disabled;
    refreshMoveButtons();
  }

  // ---------------------------
  // Battle mechanics
  // ---------------------------
  const ENERGY_CAP = 100;

  function applyDamage(target, amount) {
    if (!state.active) return;
    target.hp = clamp(target.hp - amount, 0, target.maxHP);
    updateHpUI();
    persistBattleState();
    if (target.hp <= 0) {
      if (target === opponent) {
        // Opponent faint: attempt to switch, otherwise you win
        handleOpponentFaint();
      } else {
        // Player faint => prompt for next Pokémon
        handlePlayerFaint();
      }
    }
  }

  function grantEnergy(p, amount) {
    p.energy = clamp(p.energy + amount, 0, ENERGY_CAP);
    updateEnergyUI();
    persistBattleState();
  }

  function spendEnergy(p, cost) {
    p.energy = clamp(p.energy - cost, 0, ENERGY_CAP);
    updateEnergyUI();
    persistBattleState();
  }

  function fastTick(attacker, defender, side) {
    if (!state.active) return;
    if (state.charging[side]) return; // pause during charge-up
    applyDamage(defender, attacker.fast.dmg);
    grantEnergy(attacker, attacker.fast.energyGain);
    refreshMoveButtons();
  }

  function startFastLoop(side) {
    const self = side === 'player' ? player : opponent;
    const foe = side === 'player' ? opponent : player;
    const rate = self.fast.rateMs;
    clearInterval(state.timers[side+'Fast']);
    state.timers[side+'Fast'] = setInterval(() => fastTick(self, foe, side), rate);
  }

  function stopFastLoop(side) {
    clearInterval(state.timers[side+'Fast']);
    state.timers[side+'Fast'] = null;
  }

  function useChargeMove(side, index) {
    if (!state.active) return;
    const attacker = side === 'player' ? player : opponent;
    const defender = side === 'player' ? opponent : player;
    const move = attacker.charged[index];
    if (!move) return;
    if (attacker.energy < move.energy) return;
    // Spend energy up-front and pause fast attacks for this side
    spendEnergy(attacker, move.energy);
    state.charging[side] = true;
    stopFastLoop(side);
    refreshMoveButtons();
    // Resolve after chargeUp
    setTimeout(() => {
      if (!state.active) return;
      applyDamage(defender, move.dmg);
      state.charging[side] = false;
      // Resume autos
      startFastLoop(side);
      refreshMoveButtons();
    }, move.chargeUpMs);
  }

  function opponentAIThink() {
    if (!state.active) return;
    if (state.charging.opponent) return;
    // Try to use the strongest affordable move
    const options = opponent.charged
      .map((m, i) => ({ m, i }))
      .filter(x => opponent.energy >= x.m.energy);
    if (options.length === 0) return;
    options.sort((a,b) => b.m.dmg - a.m.dmg);
    const choice = options[0];
    useChargeMove('opponent', choice.i);
  }

  function startOpponentAI() {
    clearInterval(state.timers.opponentAI);
    // Check frequently if AI can throw
    state.timers.opponentAI = setInterval(opponentAIThink, 250);
  }

  function endBattle(reason) {
    state.active = false;
    setControlsDisabled(true);
    stopFastLoop('player');
    stopFastLoop('opponent');
    clearInterval(state.timers.opponentAI);
    state.timers.opponentAI = null;
  }

  function concludeBattle(outcome) {
    // Stop all loops and record result, then navigate to summary
    endBattle(outcome);
    const result = {
      outcome, // 'win' | 'lose' | 'forfeit'
      opponent: (selectedBattle && selectedBattle.label) || 'Opponent',
      stageIndex: Number((selectedBattle && selectedBattle.index) || 0),
      teamIds: Array.isArray(teamIds) ? teamIds.slice() : [],
      teamNames: Array.isArray(playerTeam) ? playerTeam.map(m => m.name) : [],
      timestamp: Date.now(),
    };
    try {
      const cur = readState();
      cur.lastBattleResult = result;
      delete cur[PERSIST_KEY];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (_) { /* ignore storage errors */ }
    // Trigger fade and let finish animation show briefly
    fadeToBlack(500);
    setTimeout(() => { window.location.href = 'battle-summary.html'; }, 650);
  }

  function showResult(kind) {
    // Simple visual feedback
    const anim = kind === 'win' ? 'flashWin 600ms' : 'flashLose 600ms';
    document.body.style.animation = anim;
    setTimeout(() => { document.body.style.animation = ''; }, 700);
  }

  function startBattle() {
    state.active = true;
    setControlsDisabled(false);
    updateHpUI();
    updateEnergyUI();
    refreshMoveButtons();
    startFastLoop('player');
    startFastLoop('opponent');
    startOpponentAI();
  }

  // Wire player charge buttons
  moveButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      useChargeMove('player', i);
    });
  });

  // Initialize labels and bars
  refreshMoveButtons();
  updateHpUI();
  updateHeaderUI();
  updateEnergyUI();

  // 3-second countdown preventing interaction, then start battle
  function startCountdown() {
    setControlsDisabled(true);
    if (cdOverlay) cdOverlay.classList.add('show');
    let n = 3;
    if (cdText) {
      cdText.textContent = n;
      cdText.classList.remove('pop'); void cdText.offsetWidth; cdText.classList.add('pop');
    }
    const timer = setInterval(() => {
      n -= 1;
      if (n > 0) {
        if (cdText) {
          cdText.textContent = n;
          cdText.classList.remove('pop'); void cdText.offsetWidth; cdText.classList.add('pop');
        }
      } else {
        clearInterval(timer);
        if (cdOverlay) cdOverlay.classList.remove('show');
        // Set up move labels now that we know the moves
        refreshMoveButtons();
        startBattle();
      }
    }, 1000);
  }

  // -----------
  // Switch flow
  // -----------
  const switchOverlay = $('switchOverlay');
  const switchOptionsEl = $('switchOptions');
  const switchCountdownEl = $('switchCountdown');

  function availableSwitches() {
    const list = [];
    for (let i = 0; i < playerTeam.length; i++) {
      if (i === activePlayerIndex) continue;
      const m = playerTeam[i];
      if (!m.fainted) list.push({ index: i, name: m.name });
    }
    return list;
  }

  function stopAllLoops() {
    stopFastLoop('player');
    stopFastLoop('opponent');
    clearInterval(state.timers.opponentAI);
    state.timers.opponentAI = null;
  }

  function startAllLoops() {
    startFastLoop('player');
    startFastLoop('opponent');
    startOpponentAI();
  }

  function performSwitch(nextIndex) {
    // Close overlay and clear timers if any
    if (switchOverlay) switchOverlay.classList.remove('show');
    if (state.timers.switchCountdown) { clearInterval(state.timers.switchCountdown); state.timers.switchCountdown = null; }
    if (state.timers.switchAuto) { clearTimeout(state.timers.switchAuto); state.timers.switchAuto = null; }
    if (switchOptionsEl) switchOptionsEl.textContent = '';

    activePlayerIndex = nextIndex;
    player = playerTeam[activePlayerIndex].pokemon;
    // Reset per-switch flags
    state.charging.player = false;
    // Update UI
    updateHeaderUI();
    updateHpUI();
    updateEnergyUI();
    refreshMoveButtons();
    persistBattleState();

    // Resume battle
    state.active = true;
    setControlsDisabled(false);
    startAllLoops();
  }

  function openSwitchOverlay(options) {
    if (!switchOverlay || !switchOptionsEl) return;
    switchOptionsEl.textContent = '';
    // Build buttons
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'switch-btn';
      btn.textContent = opt.name;
      btn.addEventListener('click', () => {
        performSwitch(opt.index);
      });
      switchOptionsEl.appendChild(btn);
    });
    if (switchCountdownEl) switchCountdownEl.textContent = '5';
    switchOverlay.classList.add('show');

    // Countdown display
    let n = 5;
    state.timers.switchCountdown = setInterval(() => {
      n -= 1;
      if (switchCountdownEl) switchCountdownEl.textContent = String(Math.max(0, n));
      if (n <= 0) {
        clearInterval(state.timers.switchCountdown);
        state.timers.switchCountdown = null;
      }
    }, 1000);
    // Auto-pick first option after 5s
    state.timers.switchAuto = setTimeout(() => {
      performSwitch(options[0].index);
    }, 5000);
  }

  function handlePlayerFaint() {
    // Mark current as fainted
    if (playerTeam[activePlayerIndex]) playerTeam[activePlayerIndex].fainted = true;
    // Pause battle and lock controls
    state.active = false;
    setControlsDisabled(true);
    stopAllLoops();
    refreshMoveButtons();
    persistBattleState();

    const opts = availableSwitches();
    if (opts.length === 0) {
      // No Pokémon left
      showResult('lose');
      concludeBattle('lose');
      return;
    }
    if (opts.length === 1) {
      // Auto switch immediately
      performSwitch(opts[0].index);
      return;
    }
    // Show overlay with 5s auto-pick
    openSwitchOverlay(opts);
  }

  function availableOppSwitches() {
    const list = [];
    for (let i = 0; i < opponentTeam.length; i++) {
      if (i === activeOpponentIndex) continue;
      const m = opponentTeam[i];
      if (!m.fainted) list.push({ index: i });
    }
    return list;
  }

  function performOpponentSwitch(nextIndex) {
    activeOpponentIndex = nextIndex;
    opponent = opponentTeam[activeOpponentIndex].pokemon;
    state.charging.opponent = false;
    updateHeaderUI();
    updateHpUI();
    updateEnergyUI();
    refreshMoveButtons();
    persistBattleState();
  }

  function handleOpponentFaint() {
    if (opponentTeam[activeOpponentIndex]) opponentTeam[activeOpponentIndex].fainted = true;
    // Pause battle during switch / end evaluation
    state.active = false;
    setControlsDisabled(true);
    stopAllLoops();
    persistBattleState();

    const opts = availableOppSwitches();
    if (opts.length === 0) {
      // No Pokémon left on opponent => win battle
      showResult('win');
      try {
        const cur = readState();
        const idx = Number((cur.selectedBattle && cur.selectedBattle.index) || opponentIdx || 0);
        const prev = Number(cur.rocketUnlocked || 1) || 1;
        const next = Math.max(prev, idx + 2);
        const capped = Math.min(next, 6);
        if (capped !== prev) {
          cur.rocketUnlocked = capped;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
        }
      } catch (_) { /* ignore storage errors */ }
      concludeBattle('win');
      return;
    }

    // Switch to the first available opponent mon immediately
    performOpponentSwitch(opts[0].index);
    // Resume battle
    state.active = true;
    setControlsDisabled(false);
    startAllLoops();
  }

  // We have valid state if we reached here; start countdown
  startCountdown();
})();
