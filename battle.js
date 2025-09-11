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
  // Moves data (demo balance)
  // ---------------------------
  const FAST_POOL = ['Quick Attack','Dragon Breath','Shadow Claw','Counter','Vine Whip'];
  const CHARGED_POOL = ['Aqua Tail','Body Slam','Rock Slide','Shadow Ball','Hydro Cannon','Hydro Pump'];

  const MOVES = {
    fast: {
      'Quick Attack': { name:'Quick Attack', dmg:5, energyGain:8, rateMs:800, type:'normal' },
      'Dragon Breath': { name:'Dragon Breath', dmg:4, energyGain:9, rateMs:500, type:'dragon' },
      'Shadow Claw': { name:'Shadow Claw', dmg:6, energyGain:8, rateMs:700, type:'ghost' },
      'Counter': { name:'Counter', dmg:7, energyGain:8, rateMs:900, type:'fighting' },
      'Vine Whip': { name:'Vine Whip', dmg:5, energyGain:7, rateMs:600, type:'grass' },
    },
    charged: {
      'Aqua Tail': { name:'Aqua Tail', energy:35, dmg:50, chargeUpMs:1300, type:'water' },
      'Body Slam': { name:'Body Slam', energy:35, dmg:60, chargeUpMs:1000, type:'normal' },
      'Rock Slide': { name:'Rock Slide', energy:45, dmg:75, chargeUpMs:1500, type:'rock' },
      'Shadow Ball': { name:'Shadow Ball', energy:55, dmg:100, chargeUpMs:1700, type:'ghost' },
      'Hydro Cannon': { name:'Hydro Cannon', energy:50, dmg:90, chargeUpMs:1600, type:'water' },
      'Hydro Pump': { name:'Hydro Pump', energy:75, dmg:130, chargeUpMs:2400, type:'water' },
    }
  };

  const TYPES_LIST = [
    ['normal'], ['fire'], ['water'], ['electric'], ['grass'], ['ice'],
    ['fighting'], ['poison'], ['ground'], ['flying'], ['psychic'], ['bug'],
    ['rock'], ['ghost'], ['dragon'], ['dark'], ['steel'], ['fairy'],
    ['water','flying'], ['grass','poison'], ['ground','rock'], ['fire','fighting']
  ];

  // ---------------------------
  // Pokemon factories
  // ---------------------------
  function parseIndexFromName(name) {
    const m = /([0-9]+)/.exec(String(name||''));
    if (!m) return 0;
    const n = Math.max(1, parseInt(m[1], 10));
    return (n - 1); // 0-based
  }

  function pickFast(idx) {
    const key = FAST_POOL[idx % FAST_POOL.length];
    return MOVES.fast[key];
  }
  function pickCharged(idx, offset) {
    const key = CHARGED_POOL[(idx + offset) % CHARGED_POOL.length];
    return MOVES.charged[key];
  }

  function makePokemon(seedIndex, nameLabel) {
    const idx = Number(seedIndex||0);
    const types = TYPES_LIST[idx % TYPES_LIST.length];
    const maxHP = 100; // keep UI simple
    return {
      name: nameLabel || `Pokemon ${idx+1}`,
      types,
      maxHP,
      hp: maxHP,
      energy: 0,
      fast: pickFast(idx),
      charged: [ pickCharged(idx,1), pickCharged(idx,2), pickCharged(idx,3) ],
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
  const selectedTeam = Array.isArray(__state.selectedTeam) ? __state.selectedTeam : null;
  const selectedBattle = (__state.selectedBattle && typeof __state.selectedBattle.index === 'number' && __state.selectedBattle.label)
    ? __state.selectedBattle
    : null;
  if (!selectedTeam || selectedTeam.length === 0 || !selectedBattle) {
    // Required info missing; send player back to start screen
    window.location.replace('index.html');
    return;
  }

  const opponentIdx = Number(selectedBattle.index || 0);

  function calcCp(idx){ return 200 + ((idx * 37) % 2500); }

  // Build player's team (up to 3), instantiate each Pokémon once
  const teamNames = selectedTeam;
  const playerTeam = teamNames.map((name) => {
    const idx = parseIndexFromName(name);
    const poke = makePokemon(idx, name);
    poke.cp = calcCp(idx);
    return { name, idx, pokemon: poke, fainted: false };
  });

  let activePlayerIndex = 0;
  let player = playerTeam[activePlayerIndex].pokemon;
  // Build opponent's team (3 mons) based on selected stage index
  const oppLabel = selectedBattle.label;
  const oppSeeds = [opponentIdx, opponentIdx + 1, opponentIdx + 2];
  const opponentTeam = oppSeeds.map((seed, i) => {
    const poke = makePokemon(seed, oppLabel + ' ' + (i + 1));
    poke.cp = calcCp(seed);
    return { idx: seed, pokemon: poke, fainted: false };
  });

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
        name: m.name,
        idx: m.idx,
        hp: m.pokemon.hp,
        maxHP: m.pokemon.maxHP,
        energy: m.pokemon.energy,
        fainted: !!m.fainted,
      })),
      opponentTeam: opponentTeam.map(m => ({
        idx: m.idx,
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
      const savedNames = (saved.playerTeam || []).map(p => p.name);
      const sameTeam = Array.isArray(savedNames) && savedNames.length === teamNames.length && savedNames.every((n, i) => n === teamNames[i]);
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

  // Attempt to hydrate state on load
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
      team: (Array.isArray(teamNames) ? teamNames : []),
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
