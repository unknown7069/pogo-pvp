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
  const oppRecentBar = $('opponent-hp-recent');
  const oppText = $('opponent-hp-text');
  const playerBar = $('player-hp');
  const playerRecentBar = $('player-hp-recent');
  const playerText = $('player-hp-text');
  const oppEnBar = $('opponent-energy');
  const playerEnBar = $('player-energy');
  const playerAttackBuffText = $('player-attack-buff');
  const playerDefenceBuffText = $('player-defence-buff');
  const playerSpeedBuffText = $('player-speed-buff');
  const opponentAttackBuffText = $('opponent-attack-buff');
  const opponentDefenceBuffText = $('opponent-defence-buff');
  const opponentSpeedBuffText = $('opponent-speed-buff');

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

  // ---------------------------
  // Type effectiveness (Pokemon GO-style)
  // ---------------------------
  // Uses 1.6x for super-effective and 0.625x for not-very-effective.
  // True neutral cancellation: weakness × resistance = 1.0.
  const SE_MULT = 1.6;
  const NV_MULT = 0.625;
  const IMM_MULT = NV_MULT * NV_MULT; // GO treats immunities as extra-strong resists (~0.390625)
  const STAB_MULT = 1.2; // Same-Type Attack Bonus in GO

  // Attack type -> lists of defending types for effects
  const TYPE_CHART = Object.freeze({
    normal:   { weak: ['rock', 'steel'], immune: ['ghost'] },
    fire:     { strong: ['grass','ice','bug','steel'], weak: ['fire','water','rock','dragon'] },
    water:    { strong: ['fire','ground','rock'], weak: ['water','grass','dragon'] },
    electric: { strong: ['water','flying'], weak: ['electric','grass','dragon'], immune: ['ground'] },
    grass:    { strong: ['water','ground','rock'], weak: ['fire','grass','poison','flying','bug','dragon','steel'] },
    ice:      { strong: ['grass','ground','flying','dragon'], weak: ['fire','water','ice','steel'] },
    fighting: { strong: ['normal','rock','steel','ice','dark'], weak: ['flying','poison','psychic','bug','fairy'], immune: ['ghost'] },
    poison:   { strong: ['grass','fairy'], weak: ['poison','ground','rock','ghost'], immune: ['steel'] },
    ground:   { strong: ['fire','electric','poison','rock','steel'], weak: ['grass','bug'], immune: ['flying'] },
    flying:   { strong: ['grass','fighting','bug'], weak: ['electric','rock','steel'] },
    psychic:  { strong: ['fighting','poison'], weak: ['psychic','steel'], immune: ['dark'] },
    bug:      { strong: ['grass','psychic','dark'], weak: ['fire','fighting','poison','flying','ghost','steel','fairy'] },
    rock:     { strong: ['fire','ice','flying','bug'], weak: ['fighting','ground','steel'] },
    ghost:    { strong: ['ghost','psychic'], weak: ['dark'], immune: ['normal'] },
    dragon:   { strong: ['dragon'], weak: ['steel'], immune: ['fairy'] },
    dark:     { strong: ['ghost','psychic'], weak: ['fighting','dark','fairy'] },
    steel:    { strong: ['rock','ice','fairy'], weak: ['fire','water','electric','steel'] },
    fairy:    { strong: ['fighting','dragon','dark'], weak: ['fire','poison','steel'] },
  });

  function typeMultiplier(attackType, defendTypes) {
    const atk = String(attackType || '').toLowerCase();
    const defs = Array.isArray(defendTypes) ? defendTypes : [];
    const chart = TYPE_CHART[atk];
    if (!atk || !chart || defs.length === 0) return 1;

    let seCount = 0;   // number of super-effective matches
    let nvCount = 0;   // number of not-very-effective matches
    let immCount = 0;  // number of immunity matches

    for (const dtRaw of defs) {
      const dt = String(dtRaw || '').toLowerCase();
      if (chart.strong && chart.strong.includes(dt)) seCount += 1;
      else if (chart.weak && chart.weak.includes(dt)) nvCount += 1;
      else if (chart.immune && chart.immune.includes(dt)) immCount += 1;
    }

    // Otherwise apply multiplicative stacking like GO
    let mult = 1;
    if (seCount > 0) mult *= Math.pow(SE_MULT, seCount);
    if (nvCount > 0) mult *= Math.pow(NV_MULT, nvCount);
    if (immCount > 0) mult *= Math.pow(IMM_MULT, immCount);
    return mult;
  }

  function stabMultiplier(moveType, attackerTypes) {
    const m = String(moveType || '').toLowerCase();
    const at = Array.isArray(attackerTypes) ? attackerTypes.map(t => String(t||'').toLowerCase()) : [];
    if (!m || at.length === 0) return 1;
    return at.includes(m) ? STAB_MULT : 1;
  }

  function fastFromId(id) {
    const m = FAST_BY_ID && FAST_BY_ID[id];
    if (!m) return { name: 'Fast', dmg: 0, energyGain: 0, attackRate: 0, type: 'normal' };
    const attackRate = Number(m.attackRate || 0); // in seconds
    return { name: m.name, dmg: Number(m.power||0), energyGain: Number(m.energyGain||0), attackRate, type: m.type };
  }
  function chargedFromId(id) {
    const m = CHARGED_BY_ID && CHARGED_BY_ID[id];
    if (!m) return { name: 'Charged', energy: 50, dmg: 80, coolDownMs: 1500, type: 'normal' };
    const coolDownUnits = Number(m.coolDownTime || 1);
    const coolDownMs = coolDownUnits * 500; // 500ms units
    return { name: m.name, energy: Number(m.energyCost||0), dmg: Number(m.power||0), coolDownMs, type: m.type, specialEffects: m.specialEffects };
  }

  // ---------------------------
  // Pokemon factories
  // ---------------------------
  function sanitizeLevelValue(value, fallback) {
    const base = typeof fallback === 'number' ? fallback : 20;
    let n = Number(value);
    if (Number.isNaN(n)) n = base;
    n = Math.max(1, Math.min(n, 50));
    return Math.round(n * 2) / 2;
  }

  function sanitizeCollectionEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const uid = typeof entry.uid === 'string' && entry.uid ? entry.uid : null;
    const id = Number(entry.id);
    const level = sanitizeLevelValue(entry.level, 20);
    if (!uid || Number.isNaN(id) || Number.isNaN(level)) return null;
    const normalized = {
      uid,
      id,
      level,
      name: typeof entry.name === 'string' ? entry.name : null,
    };
    if (entry.shiny != null) normalized.shiny = entry.shiny;
    if (entry.ivHp != null) normalized.ivHp = entry.ivHp;
    if (entry.ivAttack != null) normalized.ivAttack = entry.ivAttack;
    if (entry.ivDefense != null) normalized.ivDefense = entry.ivDefense;
    if (entry.ivs && typeof entry.ivs === 'object') {
      normalized.ivs = {
        hp: entry.ivs.hp,
        attack: entry.ivs.attack,
        defense: entry.ivs.defense,
      };
    }
    return normalized;
  }

  function makePokemonFromId(id, levelOverride, overrides) {
    const key = Number(id);
    const level = sanitizeLevelValue(levelOverride, 20);
    let mon = null;
    if (PD.getPokemonById) {
      try { mon = PD.getPokemonById(key, overrides || undefined); } catch (_) {}
    }
    if (!mon && PD.byId && PD.byId.get) {
      mon = PD.byId.get(key);
    }
    if (!mon) {
      const maxHP = 1;
      return {
        id: key || 0,
        name: 'Pokemon',
        types: ['normal'],
        level,
        maxHP,
        hp: maxHP,
        energy: 0,
        energyRate: 1,
        cp: 500,
        stats: { hp: maxHP, attack: 50, defense: 50, speed: 50 },
        fast: fastFromId('quick_attack'),
        charged: [],
        attackBuff: 0,
        defenseBuff: 0,
        speedBuff: 0,
        shiny: false,
      };
    }
    let stats = null;
    try {
      stats = PD.getGoStatsById ? PD.getGoStatsById(mon.id, level) : null;
    } catch (_) {}
    if (!stats || typeof stats !== 'object') {
      stats = { hp: 100, attack: 50, defense: 50, speed: 50 };
    }
    const maxHP = Math.max(1, Number(stats.hp || 100));
    const fastId = Array.isArray(mon.fastMoves) && mon.fastMoves[0];
    const chargedIds = Array.isArray(mon.chargedMoves) ? mon.chargedMoves : [];
    const charged = chargedIds.slice(0,3).map(chargedFromId);
    let cp = 10;
    try {
      if (PD.calcGoCp) cp = PD.calcGoCp(stats);
    } catch (_) {}
    return {
      id: mon.id,
      name: mon.name,
      types: Array.isArray(mon.types) ? mon.types : [],
      level,
      maxHP,
      hp: maxHP,
      energy: 0,
      cp,
      stats: stats,
      energyRate: (Number(stats.speed || 100) / 100),
      fast: fastFromId(fastId),
      charged: charged,
      attackBuff: 0,
      defenseBuff: 0,
      speedBuff: 0,
      shiny: !!mon.shiny,
    };
  }

  // ---------------------------
  // Battle state
  // ---------------------------
  // Read team and battle selection from centralized AppState; if missing, return to start
  const store = window.AppState || null;

  function readState() {
    if (store && typeof store.read === 'function') return store.read();
    if (store && typeof store.all === 'function') return store.all();
    return {};
  }

  function writeState(patch) {
    if (!patch || Object(patch) !== patch) return;
    if (store && typeof store.write === 'function') { store.write(patch); return; }
    if (store && typeof store.merge === 'function') { store.merge(patch); }
  }

  function setStateValue(key, value) {
    if (!key) return;
    if (store && typeof store.set === 'function') { store.set(key, value); return; }
    const patch = {};
    patch[key] = value;
    writeState(patch);
  }

  function removeStateValue(key) {
    if (!key) return;
    if (store && typeof store.remove === 'function') { store.remove(key); return; }
    const patch = {};
    patch[key] = undefined;
    writeState(patch);
  }

  function getStateValue(key, fallback) {
    if (store && typeof store.get === 'function') return store.get(key, fallback);
    const current = readState();
    return Object.prototype.hasOwnProperty.call(current, key)
      ? current[key]
      : (arguments.length > 1 ? fallback : null);
  }
  const __state = readState();
  const selectedTeamMembers = Array.isArray(__state.selectedTeamMembers) ? __state.selectedTeamMembers : null;
  const selectedTeamUids = Array.isArray(__state.selectedTeamUids) ? __state.selectedTeamUids : null;
  const selectedTeamIds = Array.isArray(__state.selectedTeamIds) ? __state.selectedTeamIds : null;
  const selectedTeamNamesLegacy = Array.isArray(__state.selectedTeam) ? __state.selectedTeam : null;
  const selectedBattle = (__state.selectedBattle && typeof __state.selectedBattle.index === 'number' && __state.selectedBattle.label)
    ? __state.selectedBattle
    : null;
  const hasModernSelection = (selectedTeamMembers && selectedTeamMembers.length) || (selectedTeamUids && selectedTeamUids.length);
  const hasLegacyIds = selectedTeamIds && selectedTeamIds.length;
  const hasLegacyNames = selectedTeamNamesLegacy && selectedTeamNamesLegacy.length;
  if ((!hasModernSelection && !hasLegacyIds && !hasLegacyNames) || !selectedBattle) {
    // Required info missing; send player back to start screen
    window.location.replace('index.html');
    return;
  }

  const opponentIdx = Number(selectedBattle.index || 0);

  const playerCollectionRaw = Array.isArray(__state.playerPokemon) ? __state.playerPokemon : [];
  const playerCollection = playerCollectionRaw.map(sanitizeCollectionEntry).filter(Boolean);
  const entriesByUid = new Map();
  for (let i = 0; i < playerCollection.length; i++) {
    entriesByUid.set(playerCollection[i].uid, playerCollection[i]);
  }

  function deriveTeamEntries() {
    const result = [];
    const used = new Set();
    if (selectedTeamMembers) {
      for (let i = 0; i < selectedTeamMembers.length && result.length < 3; i++) {
        const member = selectedTeamMembers[i];
        if (!member) continue;
        const uid = typeof member.uid === 'string' ? member.uid : null;
        if (uid && entriesByUid.has(uid) && !used.has(uid)) {
          result.push(entriesByUid.get(uid));
          used.add(uid);
        } else if (member.id != null) {
          const id = Number(member.id);
          if (!Number.isNaN(id)) {
            for (let j = 0; j < playerCollection.length; j++) {
              const entry = playerCollection[j];
              if (entry.id === id && !used.has(entry.uid)) {
                result.push(entry);
                used.add(entry.uid);
                break;
              }
            }
          }
        }
      }
    }
    if (selectedTeamUids) {
      for (let i = 0; i < selectedTeamUids.length && result.length < 3; i++) {
        const uid = typeof selectedTeamUids[i] === 'string' ? selectedTeamUids[i] : null;
        if (uid && entriesByUid.has(uid) && !used.has(uid)) {
          result.push(entriesByUid.get(uid));
          used.add(uid);
        }
      }
    }
    if (selectedTeamIds) {
      for (let i = 0; i < selectedTeamIds.length && result.length < 3; i++) {
        const id = Number(selectedTeamIds[i]);
        if (Number.isNaN(id)) continue;
        for (let j = 0; j < playerCollection.length; j++) {
          const entry = playerCollection[j];
          if (entry.id === id && !used.has(entry.uid)) {
            result.push(entry);
            used.add(entry.uid);
            break;
          }
        }
      }
    }
    return result;
  }

  function createTeamMember(entry) {
    const level = entry && entry.level != null ? entry.level : 20;
    const id = entry && entry.id != null ? entry.id : 0;
    const poke = makePokemonFromId(id, level, entry);
    return {
      id: poke.id,
      uid: entry && entry.uid ? entry.uid : null,
      level,
      name: entry && entry.name ? entry.name : poke.name,
      pokemon: poke,
      fainted: false,
    };
  }

  // Build player's team from selection (uids) with fallbacks for legacy ids/names
  let playerTeam = [];
  let teamIds = [];
  let teamUids = [];

  const derivedEntries = deriveTeamEntries();
  if (derivedEntries.length) {
    playerTeam = derivedEntries.slice(0, 3).map(createTeamMember);
  } else if (hasLegacyIds) {
    const legacyIds = selectedTeamIds.map(Number).filter((n) => !Number.isNaN(n)).slice(0, 3);
    playerTeam = legacyIds.map((id) => createTeamMember({ id, level: 20, uid: null }));
  } else if (hasLegacyNames) {
    const fallback = (ALL_SPECIES.length ? ALL_SPECIES : [{id:1,name:'Pokemon'},{id:4,name:'Pokemon'},{id:7,name:'Pokemon'}]);
    const legacyIds = selectedTeamNamesLegacy.map((_, i) => fallback[i % fallback.length].id).slice(0, 3);
    playerTeam = legacyIds.map((id) => createTeamMember({ id, level: 20, uid: null }));
  }

  if (!playerTeam.length) {
    window.location.replace('index.html');
    return;
  }

  teamIds = playerTeam.map((member) => member.id);
  teamUids = playerTeam.map((member) => member.uid).filter((uid) => typeof uid === 'string' && uid);

  let activePlayerIndex = 0;
  let player = playerTeam[activePlayerIndex].pokemon;
  // Build opponent's team from species list, rotating by stage index
  const pool = ALL_SPECIES.length ? ALL_SPECIES : [{id:1,name:'Pokemon'}];
  const opponentTeams = [
    [3, 6, 9],
    [],
    [],
    [],
    [],
    [],
  ]
  const oppIds = opponentTeams[opponentIdx];
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
        uid: m.uid || null,
        id: m.id,
        name: m.name,
        level: m.level,
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
      setStateValue(PERSIST_KEY, snapshotBattleState());
    } catch (_) { /* ignore storage errors */ }
  }

  function restoreBattleStateIfPresent() {
    try {
      const saved = getStateValue(PERSIST_KEY);
      if (!saved || typeof saved !== 'object') return false;
      if (Number(saved.stageIndex) !== Number(opponentIdx)) return false;
      // Validate team matches
      const savedUids = (saved.playerTeam || []).map(p => (p && typeof p.uid === 'string') ? p.uid : null).filter(Boolean);
      let sameTeam = false;
      if (teamUids.length && savedUids.length === teamUids.length && savedUids.every((uid, i) => uid === teamUids[i])) {
        sameTeam = true;
      } else {
        const savedIds = (saved.playerTeam || []).map(p => p.id);
        sameTeam = Array.isArray(savedIds) && savedIds.length === teamIds.length && savedIds.every((n, i) => Number(n) === Number(teamIds[i]));
      }
      if (!sameTeam) return false;
      // Apply player team hp/energy/fainted
      (saved.playerTeam || []).forEach((s, i) => {
        const m = playerTeam[i];
        if (!m) return;
        m.fainted = !!s.fainted;
        m.pokemon.hp = clamp(Number(s.hp || m.pokemon.hp), 0, m.pokemon.maxHP);
        // Ensure integer energy when restoring
        m.pokemon.energy = Math.floor(clamp(Number(s.energy || 0), 0, 100));
      });
      // Apply opponent team
      (saved.opponentTeam || []).forEach((s, i) => {
        const m = opponentTeam[i];
        if (!m) return;
        m.fainted = !!s.fainted;
        m.pokemon.hp = clamp(Number(s.hp || m.pokemon.hp), 0, m.pokemon.maxHP);
        // Ensure integer energy when restoring
        m.pokemon.energy = Math.floor(clamp(Number(s.energy || 0), 0, 100));
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
        removeStateValue(PERSIST_KEY);
      }
    } catch (_) { /* ignore */ }
  })();

  // Attempt to hydrate state on load (only if not cleared above)
  restoreBattleStateIfPresent();

  const state = {
    active: false,
    controlsDisabled: true,
    timers: { global: null, switchCountdown: null, switchAuto: null },
    tick: 0,
    schedule: {
      player: { fastTicks: 2, lockUntilTick: 0, pendingChargedIndex: null },
      opponent: { fastTicks: 2, lockUntilTick: 0, pendingChargedIndex: null },
    },
  };

  // ---------------------------
  // UI setup
  // ---------------------------
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  // Track previous HP percentages for recent-damage overlay
  let prevPlayerHpPct = null;
  let prevOpponentHpPct = null;
  const RECENT_DAMAGE_DELAY_MS = 250; // delay before white overlay trails to current
  const recentDamageTimers = { player: null, opponent: null };

  function updateHpUI() {
    const pPct = Math.max(0, Math.round((player.hp / player.maxHP) * 100));
    const oPct = Math.max(0, Math.round((opponent.hp / opponent.maxHP) * 100));
    if (playerText) playerText.textContent = `${Math.max(0, Math.round(player.hp))}/${player.maxHP}`;
    if (oppText) oppText.textContent = `${Math.max(0, Math.round(opponent.hp))}/${opponent.maxHP}`;

    // Initialize previous values on first run
    if (prevPlayerHpPct == null) prevPlayerHpPct = pPct;
    if (prevOpponentHpPct == null) prevOpponentHpPct = oPct;

    // Apply recent-damage overlay: set to previous %, then shrink to current %
    if (playerRecentBar) {
      if (pPct < prevPlayerHpPct) {
        playerRecentBar.style.setProperty('--hp-recent', prevPlayerHpPct + '%');
        if (recentDamageTimers.player) { clearTimeout(recentDamageTimers.player); recentDamageTimers.player = null; }
        // Shrink after a short delay for a more pronounced trailing effect
        requestAnimationFrame(() => {
          recentDamageTimers.player = setTimeout(() => {
            playerRecentBar.style.setProperty('--hp-recent', pPct + '%');
            recentDamageTimers.player = null;
          }, RECENT_DAMAGE_DELAY_MS);
        });
      } else {
        // On heal or unchanged, snap recent to current and clear any pending timer
        if (recentDamageTimers.player) { clearTimeout(recentDamageTimers.player); recentDamageTimers.player = null; }
        playerRecentBar.style.setProperty('--hp-recent', pPct + '%');
      }
    }
    if (oppRecentBar) {
      if (oPct < prevOpponentHpPct) {
        oppRecentBar.style.setProperty('--hp-recent', prevOpponentHpPct + '%');
        if (recentDamageTimers.opponent) { clearTimeout(recentDamageTimers.opponent); recentDamageTimers.opponent = null; }
        requestAnimationFrame(() => {
          recentDamageTimers.opponent = setTimeout(() => {
            oppRecentBar.style.setProperty('--hp-recent', oPct + '%');
            recentDamageTimers.opponent = null;
          }, RECENT_DAMAGE_DELAY_MS);
        });
      } else {
        if (recentDamageTimers.opponent) { clearTimeout(recentDamageTimers.opponent); recentDamageTimers.opponent = null; }
        oppRecentBar.style.setProperty('--hp-recent', oPct + '%');
      }
    }

    // Update actual HP bars
    setHp(playerBar, pPct);
    setHp(oppBar, oPct);

    // Save current as previous for next update
    prevPlayerHpPct = pPct;
    prevOpponentHpPct = oPct;
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
  const oppSpriteImg = document.getElementById('opponent-sprite-img');
  const playerSpriteImg = document.getElementById('player-sprite-img');

  // Build PokemonDB sprite URLs from centralized helper
  const oppEffectSlot = document.getElementById('opponent-effect-slot');
  const playerEffectSlot = document.getElementById('player-effect-slot');

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
    // Update sprites
    // TODO - handle shiny option
    const oppUrl = PD.getBattleSpriteUrl(opponent.name, 'opponent', opponent.shiny);
    const playerUrl = PD.getBattleSpriteUrl(player.name, 'player', player.shiny);
    if (oppSpriteImg) {
      oppSpriteImg.src = oppUrl;
      oppSpriteImg.alt = opponent.name;
    } else if (oppSpriteEl) {
      // Fallback: create img if missing
      const img = document.createElement('img');
      img.id = 'opponent-sprite-img';
      img.alt = opponent.name;
      img.src = oppUrl;
      oppSpriteEl.textContent = '';
      oppSpriteEl.appendChild(img);
    }
    if (playerSpriteImg) {
      playerSpriteImg.src = playerUrl;
      playerSpriteImg.alt = player.name;
    } else if (playerSpriteEl) {
      const img = document.createElement('img');
      img.id = 'player-sprite-img';
      img.alt = player.name;
      img.src = playerUrl;
      playerSpriteEl.textContent = '';
      playerSpriteEl.appendChild(img);
    }
  }

  function updateEnergyUI() {
    const pPct = Math.max(0, Math.round(player.energy)); // energy is 0-100
    const oPct = Math.max(0, Math.round(opponent.energy));
    if (playerEnBar) setEn(playerEnBar, pPct);
    if (oppEnBar) setEn(oppEnBar, oPct);
  }

  function getAttackBuff(target) {
    return 1 + Math.pow(target.attackBuff/10, 0.6);
  }

  function getDefenseBuff(target) {
    return 1 + Math.pow(target.defenseBuff/10, 0.6);
  }

  function getSpeedBuff(target) {
    return 1 + Math.pow(target.speedBuff/10, 0.6);
  }

  function applyMoveBuff(user, target, move) {
    // Apply buff/debuff stages from move to user or opponent
    // Split specialEffects by comma
    // specialEffects "sA+10" means user Attack +10 stage
    if (!move || !move.specialEffects) return;
    const parts = String(move.specialEffects || '').split(',').map(s => s.trim());
    parts.forEach(part => {
      const m = part.match(/^([su])([ADSH])([+-]\d+)$/i);
      const who = m[1].toLowerCase();
      const stat = m[2].toLowerCase();
      const change = Number(m[3]);
      const targetMon = who === 's' ? user : target;
      if (!targetMon) return;
      if (stat === 'a') {
        console.log('Applying attack buff', change, 'to', who, targetMon.name);
        targetMon.attackBuff += change;
        flashEffectText(who === 's' ? 'player' : 'opponent', `A${change > 0 ? '+' : ''}${change}`);
      } else if (stat === 'd') {
        console.log('Applying defense buff', change, 'to', who, targetMon.name);
        targetMon.defenseBuff += change;
        flashEffectText(who === 's' ? 'player' : 'opponent', `D${change > 0 ? '+' : ''}${change}`);
      } else if (stat === 's') {
        console.log('Applying speed buff', change, 'to', who, targetMon.name);
        targetMon.speedBuff += change;
        flashEffectText(who === 's' ? 'player' : 'opponent', `S${change > 0 ? '+' : ''}${change}`);
      } else if (stat === 'h') {
        console.log('Applying heal', change, 'to', who, targetMon.name);
        // Heal by % of max HP
        const healPct = Math.max(0, Math.min(change * 10, 100));
        const healAmt = Math.max(1, Math.round((healPct / 100) * targetMon.maxHP));
        targetMon.hp = Math.min(targetMon.maxHP, targetMon.hp + healAmt);
        flashEffectText(who === 's' ? 'player' : 'opponent', `+${healAmt} HP`);
        updateHpUI();
      } else {
        console.warn('Unknown stat in special effect:', stat);
      }
    });
  }

  function updateBuffsUI() {
    // player attack
    if (player.attackBuff >= 1) {
      playerAttackBuffText.textContent = 'A+' + player.attackBuff;
      playerAttackBuffText.style.color = '#2ecc71';
    } else if (player.attackBuff <= -1) {
      playerAttackBuffText.textContent = 'A-' + player.attackBuff;
      playerAttackBuffText.style.color = '#e74c3c';
    } else {
      playerAttackBuffText.textContent = '';
      playerAttackBuffText.hidden = true;
    }
    // player defense
    if (player.defenseBuff >= 1) {
      playerDefenceBuffText.textContent = 'D+' + player.defenseBuff;
      playerDefenceBuffText.style.color = '#2ecc71';
    } else if (player.defenseBuff <= -1) {
      playerDefenceBuffText.textContent = 'D-' + player.defenseBuff;
      playerDefenceBuffText.style.color = '#e74c3c';
    } else {
      playerDefenceBuffText.textContent = '';
      playerDefenceBuffText.hidden = true;
    }
    // player speed
    if (player.speedBuff >= 1) {
      playerSpeedBuffText.textContent = 'S+' + player.speedBuff;
      playerSpeedBuffText.style.color = '#2ecc71';
    } else if (player.speedBuff <= -1) {
      playerSpeedBuffText.textContent = 'S-' + player.speedBuff;
      playerSpeedBuffText.style.color = '#e74c3c';
    } else {
      playerSpeedBuffText.textContent = '';
      playerSpeedBuffText.hidden = true;
    }
    // opponent attack
    if (opponent.attackBuff >= 1) {
      opponentAttackBuffText.textContent = 'A+' + opponent.attackBuff;
      opponentAttackBuffText.style.color = '#2ecc71';
    } else if (opponent.attackBuff <= -1) {
      opponentAttackBuffText.textContent = 'A-' + opponent.attackBuff;
      opponentAttackBuffText.style.color = '#e74c3c';
    } else {
      opponentAttackBuffText.textContent = '';
      opponentAttackBuffText.hidden = true;
    }
    // opponent defense
    if (opponent.defenseBuff >= 1) {
      opponentDefenceBuffText.textContent = 'D+' + opponent.defenseBuff;
      opponentDefenceBuffText.style.color = '#2ecc71';
    } else if (opponent.defenseBuff <= -1) {
      opponentDefenceBuffText.textContent = 'D-' + opponent.defenseBuff;
      opponentDefenceBuffText.style.color = '#e74c3c';
    } else {
      opponentDefenceBuffText.textContent = '';
      opponentDefenceBuffText.hidden = true;
    }
    // opponent speed
    if (opponent.speedBuff >= 1) {
      opponentSpeedBuffText.textContent = 'S+' + opponent.speedBuff;
      opponentSpeedBuffText.style.color = '#2ecc71';
    } else if (opponent.speedBuff <= -1) {
      opponentSpeedBuffText.textContent = 'S-' + opponent.speedBuff;
      opponentSpeedBuffText.style.color = '#e74c3c';
    } else {
      opponentSpeedBuffText.textContent = '';
      opponentSpeedBuffText.hidden = true;
    }
  }

  function updateBuffs() {
    // Reduce buffs by 1 stage 
    if (player.attackBuff > 0) player.attackBuff -= 1;
    else if (player.attackBuff < 0) player.attackBuff += 1;
    if (player.defenseBuff > 0) player.defenseBuff -= 1;
    else if (player.defenseBuff < 0) player.defenseBuff += 1;
    if (player.speedBuff > 0) player.speedBuff -= 1;
    else if (player.speedBuff < 0) player.speedBuff += 1;
    if (opponent.attackBuff > 0) opponent.attackBuff -= 1;
    else if (opponent.attackBuff < 0) opponent.attackBuff += 1;
    if (opponent.defenseBuff > 0) opponent.defenseBuff -= 1;
    else if (opponent.defenseBuff < 0) opponent.defenseBuff += 1;
    if (opponent.speedBuff > 0) opponent.speedBuff -= 1;
    else if (opponent.speedBuff < 0) opponent.speedBuff += 1;
  }

  // Flash floating text above sprites
  function flashEffectText(side, text) {
    const host = side === 'player' ? playerSpriteEl : oppSpriteEl;
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'effect-text';
    el.textContent = String(text || '');
    host.appendChild(el);
    // Force reflow then trigger fade to ensure transition
    requestAnimationFrame(() => { void el.offsetWidth; el.classList.add('fade'); });
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 500);
  }

  function labelForCharged(move){ return `${move.name} (${move.energy})`; }

  function refreshMoveButtons() {
    moveButtons.forEach((btn, i) => {
      const move = player.charged[i];
      const container = btn.parentElement;
      const labelEl = container && container.querySelector('.move-label');
      if (!move) {
        // No charged move in this slot: hide the button and clear the label
        if (btn) {
          btn.style.display = 'none';
          btn.disabled = true;
        }
        if (labelEl) labelEl.textContent = '';
        return;
      }
      // Ensure visible when there is a move
      if (btn) btn.style.display = '';
      // Update label element under the button
      if (labelEl) labelEl.textContent = labelForCharged(move);
      // Enable when battle active, controls enabled, no charge already queued, and enough energy
      const isQueued = state.schedule && state.schedule.player && state.schedule.player.pendingChargedIndex != null;
      const canUse = state.active && !state.controlsDisabled && !isQueued && (player.energy >= move.energy);
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
  // Battle mechanics (0.5s global tick, simultaneous resolution)
  // ---------------------------
  const ENERGY_CAP = 100;
  const TICK_MS = 500;

  function grantEnergy(p, amount) {
    // Keep energy as an integer: clamp to [0, ENERGY_CAP] then floor
    const next = clamp(Number(p.energy || 0) + Number(amount || 0) + 1, 0, ENERGY_CAP);
    p.energy = Math.floor(next);
  }

  function spendEnergy(p, cost) {
    // Keep energy as an integer: clamp to [0, ENERGY_CAP] then floor
    const next = clamp(Number(p.energy || 0) - Number(cost || 0), 0, ENERGY_CAP);
    p.energy = Math.floor(next);
  }

  function fastTicksFor(move) {
    // Map attackRate in seconds to 0.5s ticks: 0.5s => 1 tick, 1s => 2 ticks, etc.
    const units = Math.max(0.5, Number(move.attackRate || 1));
    return Math.max(1, Math.round(units * 2));
  }

  function chargedCooldownTicksFor(move) {
    // coolDownMs was built from coolDownTime (in seconds) * 500; recover and map to 0.5s ticks
    const units = Math.max(0, Number(move.coolDownMs || 0) / 500); // seconds
    return Math.max(0, Math.round(units * 2));
  }

  function initSchedules() {
    state.tick = 0;
    state.schedule.player.fastTicks = fastTicksFor(player.fast);
    state.schedule.opponent.fastTicks = fastTicksFor(opponent.fast);
    state.schedule.player.lockUntilTick = 0;
    state.schedule.opponent.lockUntilTick = 0;
    state.schedule.player.pendingChargedIndex = null;
    state.schedule.opponent.pendingChargedIndex = null;
  }

  function queueCharge(side, index) {
    if (!state.active) return;
    const sched = state.schedule[side];
    if (!sched) return;
    if (sched.pendingChargedIndex != null) return;
    const attacker = side === 'player' ? player : opponent;
    const move = attacker.charged[index];
    if (!move) return;
    if (attacker.energy < move.energy) return;
    // Queue to execute on next tick
    sched.pendingChargedIndex = index;
    refreshMoveButtons();
  }

  function maybeQueueOpponentCharge() {
    if (!state.active) return;
    const s = state.schedule.opponent;
    if (!s || s.pendingChargedIndex != null) return;
    const options = opponent.charged
      .map((m, i) => ({ m, i }))
      .filter(x => opponent.energy >= x.m.energy);
    if (!options.length) return;
    options.sort((a, b) => b.m.dmg - a.m.dmg);
    s.pendingChargedIndex = options[0].i;
  }

  function onTick() {
    if (!state.active) return;
    state.tick += 1;

    // AI can plan a charged attack for the next tick when energy allows
    maybeQueueOpponentCharge();

    const pSched = state.schedule.player;
    const oSched = state.schedule.opponent;
    let playerAction = null; // { kind: 'fast'|'charged', move, index? }
    let opponentAction = null;

    if (state.tick >= pSched.lockUntilTick) {
      if (pSched.pendingChargedIndex != null) {
        const i = pSched.pendingChargedIndex;
        const m = player.charged[i];
        if (m && player.energy >= m.energy) {
          playerAction = { kind: 'charged', move: m, index: i };
        } else {
          pSched.pendingChargedIndex = null;
        }
      }
      // Gate fast moves strictly by global tick modulo their attackRate period in ticks
      if (!playerAction) {
        const period = Math.max(1, Number(pSched.fastTicks || fastTicksFor(player.fast)));
        if (state.tick % period === 0) {
          playerAction = { kind: 'fast', move: player.fast };
        }
      }
    }

    if (state.tick >= oSched.lockUntilTick) {
      if (oSched.pendingChargedIndex != null) {
        const i = oSched.pendingChargedIndex;
        const m = opponent.charged[i];
        if (m && opponent.energy >= m.energy) {
          opponentAction = { kind: 'charged', move: m, index: i };
        } else {
          oSched.pendingChargedIndex = null;
        }
      }
      // Gate fast moves strictly by global tick modulo their attackRate period in ticks
      if (!opponentAction) {
        const period = Math.max(1, Number(oSched.fastTicks || fastTicksFor(opponent.fast)));
        if (state.tick % period === 0) {
          opponentAction = { kind: 'fast', move: opponent.fast };
        }
      }
    }

    // Accumulate simultaneous effects
    let dmgToPlayer = 0;
    let dmgToOpponent = 0;
    let pEnergyDelta = 0;
    let oEnergyDelta = 0;

    let playerSE = false;
    let opponentSE = false;
    let playerNVE = false; // not very effective
    let opponentNVE = false;

    // Trigger fast-attack lunge animations immediately when a fast attack is queued
    if (playerAction && playerAction.kind === 'fast') {
      try { triggerLunge('player'); } catch (_) {}
    }
    if (opponentAction && opponentAction.kind === 'fast') {
      try { triggerLunge('opponent'); } catch (_) {}
    }

    if (playerAction) {
      const base = Number(playerAction.move.dmg * player.stats.attack * getAttackBuff(player) / (opponent.stats.defense * getDefenseBuff(opponent)) || 0);
      const mult = typeMultiplier(playerAction.move.type, opponent.types);
      playerSE = mult > 1;
      playerNVE = mult < 1;
      const stab = stabMultiplier(playerAction.move.type, player.types);
      dmgToOpponent += Math.floor(0.5 * base * mult * stab);

      if (playerAction.kind === 'charged') {
        pEnergyDelta -= Number(playerAction.move.energy || 0);
        applyMoveBuff(player, opponent, playerAction.move);
      } else {
        // Apply speed-based energy rate scaling for fast moves, rounded down to integer
        pEnergyDelta += Math.floor(Number(playerAction.move.energyGain || 0) * Number(player.energyRate || 1)) * getSpeedBuff(player);
      }
    }
    if (opponentAction) {
      const base = Number(opponentAction.move.dmg * opponent.stats.attack * getAttackBuff(opponent) / (player.stats.defense * getDefenseBuff(player)) || 0);
      const mult = typeMultiplier(opponentAction.move.type, player.types);
      opponentSE = mult > 1;
      opponentNVE = mult < 1;
      const stab = stabMultiplier(opponentAction.move.type, opponent.types);
      dmgToPlayer += Math.floor(0.5 * base * mult * stab);

      if (opponentAction.kind === 'charged') {
        oEnergyDelta -= Number(opponentAction.move.energy || 0);
        applyMoveBuff(opponent, player, opponentAction.move);
      } else {
        // Apply speed-based energy rate scaling for fast moves, rounded down to integer
        oEnergyDelta += Math.floor(Number(opponentAction.move.energyGain || 0) * Number(opponent.energyRate || 1)) * getSpeedBuff(opponent);
      }
    }

    // Apply energy changes
    if (pEnergyDelta < 0) spendEnergy(player, -pEnergyDelta); else if (pEnergyDelta > 0) grantEnergy(player, pEnergyDelta);
    if (oEnergyDelta < 0) spendEnergy(opponent, -oEnergyDelta); else if (oEnergyDelta > 0) grantEnergy(opponent, oEnergyDelta);

    // Update schedules after actions
    if (playerAction) {
      if (playerAction.kind === 'charged') {
        const cd = chargedCooldownTicksFor(playerAction.move);
        pSched.lockUntilTick = state.tick + cd;
        pSched.pendingChargedIndex = null;
      }
    }
    if (opponentAction) {
      if (opponentAction.kind === 'charged') {
        const cd = chargedCooldownTicksFor(opponentAction.move);
        oSched.lockUntilTick = state.tick + cd;
        oSched.pendingChargedIndex = null;
      }
    }

    // Apply HP changes simultaneously
    if (dmgToPlayer > 0 || dmgToOpponent > 0) {
      player.hp = clamp(player.hp - dmgToPlayer, 0, player.maxHP);
      opponent.hp = clamp(opponent.hp - dmgToOpponent, 0, opponent.maxHP);
      updateHpUI();
      updateEnergyUI();
      persistBattleState();
      // Show effectiveness text immediately when applicable
      if (playerAction && dmgToOpponent > 0) {
        if (playerSE) {
          flashEffectText('opponent', 'Super Effective!');
        } else if (playerNVE) {
          flashEffectText('opponent', 'Not very effective...');
        }
      }
      if (opponentAction && dmgToPlayer > 0) {
        if (opponentSE) {
          flashEffectText('player', 'Super Effective!');
        } else if (opponentNVE) {
          flashEffectText('player', 'Not very effective...');
        }
      }
    }

    // Handle stat changes - only every second tick (1s) to reduce spam
    if (state.tick % 2 === 0) {
      updateBuffs();
      updateBuffsUI();
    }

    // TODO - Handle manual switches 

    // Outcome checks
    const playerFainted = player.hp <= 0;
    const opponentFainted = opponent.hp <= 0;
    if (opponentFainted) {
      handleOpponentFaint();
      return;
    }
    if (playerFainted) {
      handlePlayerFaint();
      return;
    }

    refreshMoveButtons();
  }

  // Small nudge animation towards the center for fast attacks
  // Duration scales with the active Pokemon's fast move attackRate
  function triggerLunge(side) {
    const img = side === 'player' ? playerSpriteImg : oppSpriteImg;
    if (!img) return;
    const actor = side === 'player' ? player : opponent;
    const rateSec = (actor && actor.fast && Number(actor.fast.attackRate)) || 0.5; // seconds per attack
    // Map attack period to animation duration as a fraction of the period.
    // 0.5s -> ~175ms, 1.0s -> ~350ms, 1.5s -> ~525ms, 2.0s -> ~700ms
    const durationMs = Math.max(160, Math.round(rateSec * 350));
    try { img.style.setProperty('--lunge-duration', `${durationMs}ms`); } catch (_) {}
    const cls = side === 'player' ? 'lunge-player' : 'lunge-opponent';
    // Restart animation reliably
    img.classList.remove(cls);
    void img.offsetWidth; // force reflow
    img.classList.add(cls);
    // Cleanup at end to allow retriggering
    const onEnd = () => { img.classList.remove(cls); };
    img.addEventListener('animationend', onEnd, { once: true });
  }

  function endBattle(reason) {
    state.active = false;
    setControlsDisabled(true);
    if (state.timers.global) { clearInterval(state.timers.global); state.timers.global = null; }
  }

  function concludeBattle(outcome) {
    // Stop all loops and record result, then navigate to summary
    endBattle(outcome);
    const result = {
      outcome, // 'win' | 'lose' | 'forfeit' | 'tie'
      opponent: (selectedBattle && selectedBattle.label) || 'Opponent',
      stageIndex: Number((selectedBattle && selectedBattle.index) || 0),
      teamIds: Array.isArray(teamIds) ? teamIds.slice() : [],
      teamNames: Array.isArray(playerTeam) ? playerTeam.map(m => m.name) : [],
      timestamp: Date.now(),
    };
    try {
      setStateValue('lastBattleResult', result);
      removeStateValue(PERSIST_KEY);
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
    initSchedules();
    if (state.timers.global) { clearInterval(state.timers.global); }
    state.timers.global = setInterval(onTick, TICK_MS);
  }

  // Wire player charge buttons
  moveButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      queueCharge('player', i);
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
    if (state.timers.global) { clearInterval(state.timers.global); state.timers.global = null; }
  }

  function startAllLoops() {
    if (!state.active) return;
    initSchedules();
    if (state.timers.global) { clearInterval(state.timers.global); }
    state.timers.global = setInterval(onTick, TICK_MS);
  }

  function performSwitch(nextIndex) {
    if (nextIndex === activePlayerIndex) return;
    if (nextIndex < 0 || nextIndex >= playerTeam.length) return;
    if (playerTeam[nextIndex].fainted) return;
    // TODO - animate current mon disappearing, a ball being thrown, and new mon entering by having the sprite grow from small to full size
    // Use the following URLS for ball sprites 
    // https://bulbapedia.bulbagarden.net/wiki/File:Pok%C3%A9_Ball_battle_V.png
    // https://bulbapedia.bulbagarden.net/wiki/File:Premier_Ball_battle_V.png
    // https://bulbapedia.bulbagarden.net/wiki/File:Great_Ball_battle_V.png
    // https://bulbapedia.bulbagarden.net/wiki/File:Ultra_Ball_battle_V.png
    // https://bulbapedia.bulbagarden.net/wiki/File:Master_Ball_battle_V.png

    // Close overlay and clear timers if any
    if (switchOverlay) switchOverlay.classList.remove('show');
    if (state.timers.switchCountdown) { clearInterval(state.timers.switchCountdown); state.timers.switchCountdown = null; }
    if (state.timers.switchAuto) { clearTimeout(state.timers.switchAuto); state.timers.switchAuto = null; }
    if (switchOptionsEl) switchOptionsEl.textContent = '';

    activePlayerIndex = nextIndex;
    player = playerTeam[activePlayerIndex].pokemon;
    // Reset per-switch state
    // Reset recent damage overlay baseline for player to avoid cross-Pokémon artifacts
    prevPlayerHpPct = Math.max(0, Math.round((player.hp / player.maxHP) * 100));
    if (recentDamageTimers.player) { clearTimeout(recentDamageTimers.player); recentDamageTimers.player = null; }
    if (playerRecentBar) playerRecentBar.style.setProperty('--hp-recent', prevPlayerHpPct + '%');
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
    // Reset per-switch state
    // Reset recent damage overlay baseline for opponent
    prevOpponentHpPct = Math.max(0, Math.round((opponent.hp / opponent.maxHP) * 100));
    if (recentDamageTimers.opponent) { clearTimeout(recentDamageTimers.opponent); recentDamageTimers.opponent = null; }
    if (oppRecentBar) oppRecentBar.style.setProperty('--hp-recent', prevOpponentHpPct + '%');
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
          setStateValue('rocketUnlocked', capped);
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






