interface MoveBuffConfig {
  target?: 'self' | 'opponent';
  chance?: number;
  attack?: number;
  defense?: number;
  speed?: number;
}

interface MoveData {
  id: string;
  name: string;
  type: string;
  power?: number;
  energy?: number;
  energyGain?: number;
  duration?: number;
  attackRate?: number;
  coolDownTime?: number;
  energyCost?: number;
  specialEffects?: string;
  buffs?: Record<string, unknown>;
  rank?: number;
  buff?: MoveBuffConfig;
  chargeUpTime?: number;
}

interface PokemonBaseStats {
  hp?: number;
  attack?: number;
  defense?: number;
  spAttack?: number;
  spDefense?: number;
  speed?: number;
}

interface PokemonSpeciesData {
  id: number;
  name: string;
  types?: string[];
  baseStats?: PokemonBaseStats;
  attack?: number;
  defense?: number;
  stamina?: number;
  fastMoves?: string[];
  chargedMoves?: string[];
  levelCap?: number;
}

interface PokemonCollectionEntry {
  uid?: string | null;
  id: number;
  name?: string | null;
  level?: number;
  shiny?: boolean | number | null;
  ivHp?: number;
  ivAttack?: number;
  ivDefense?: number;
  ivs?: {
    hp?: number;
    attack?: number;
    defense?: number;
  };
  fastMoveId?: string;
  chargedMoveIds?: string[];
  secondChargedMoveId?: string;
  createdAt?: number;
  overrides?: Record<string, unknown>;
}

interface PokemonGoStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface PokemonStatsModule {
  calcGoHp?: (baseStats: PokemonBaseStats | undefined, level: number) => number;
  calcGoAttack?: (baseStats: PokemonBaseStats | undefined, level: number) => number;
  calcGoDefense?: (baseStats: PokemonBaseStats | undefined, level: number) => number;
  calcGoSpeed?: (baseStats: PokemonBaseStats | undefined, level: number) => number;
  calcGoCp?: (stats: Partial<PokemonGoStats>) => number;
  calcCpMultiplier?: (level: number) => number;
  getCpMultiplier?: (level: number) => number;
}

interface PokemonFastMovesModule {
  FAST_MOVES: ReadonlyArray<MoveData>;
  FAST_MOVES_BY_ID: Record<string, MoveData>;
  FAST_MOVE_IDS: string[];
}

interface PokemonChargedMovesModule {
  CHARGED_MOVES: ReadonlyArray<MoveData>;
  CHARGED_MOVES_BY_ID: Record<string, MoveData>;
  CHARGED_MOVE_IDS: string[];
}

interface PokemonDataStore {
  all?: PokemonSpeciesData[];
  byId?: Map<number, PokemonSpeciesData>;
  getPokemonById?: (id: number, overrides?: PokemonCollectionEntry | null) => PokemonSpeciesData | (PokemonSpeciesData & PokemonCollectionEntry) | null;
  slugifyName?: (name: string) => string;
  getForwardSpriteUrl?: (monOrName: string | PokemonSpeciesData) => string;
  getBattleSpriteUrl?: (name: string, side: 'player' | 'opponent', isShiny?: boolean) => string;
  FAST_MOVE_IDS?: string[];
  CHARGED_MOVE_IDS?: string[];
  FAST_MOVES?: ReadonlyArray<MoveData>;
  FAST_MOVES_BY_ID?: Record<string, MoveData>;
  CHARGED_MOVES?: ReadonlyArray<MoveData>;
  CHARGED_MOVES_BY_ID?: Record<string, MoveData>;
  TYPES?: ReadonlyArray<string>;
  calcGoHp?: PokemonStatsModule['calcGoHp'];
  calcGoAttack?: PokemonStatsModule['calcGoAttack'];
  calcGoDefense?: PokemonStatsModule['calcGoDefense'];
  calcGoSpeed?: PokemonStatsModule['calcGoSpeed'];
  calcCpMultiplier?: PokemonStatsModule['calcCpMultiplier'];
  calcGoCp?: PokemonStatsModule['calcGoCp'];
  getGoStatsById?: (id: number, level: number) => PokemonGoStats | null;
}

interface RocketStageMember {
  id: number;
  speciesId: number;
  name: string | null;
  level: number;
  overrides?: PokemonCollectionEntry | null | undefined;
}

interface RocketStage {
  id: string;
  name: string;
  quote?: string;
  icon?: string;
  team: ReadonlyArray<RocketStageMember>;
}

interface RocketTeamsModule extends ReadonlyArray<RocketStage> {}

type StateListener = (state: Record<string, unknown>) => void;

interface AppStateApi {
  get<T = unknown>(key: string, fallback?: T): T | null;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
  all(): Record<string, unknown>;
  read(): Record<string, unknown>;
  replace(next: Record<string, unknown>): void;
  merge(patch: Record<string, unknown>): void;
  write(patch: Record<string, unknown>): void;
  subscribe(listener: StateListener): () => void;
}

interface PlayerCollectionApi {
  createPokemon(spec: PokemonCollectionEntry): PokemonCollectionEntry | null;
  releasePokemon(uid: string): boolean;
}

interface UiHelpers {
  attachDragScroll(el: HTMLElement | null): () => void;
}

interface Window {
  PokemonFastMoves?: PokemonFastMovesModule;
  PokemonChargedMoves?: PokemonChargedMovesModule;
  PokemonTypes?: ReadonlyArray<string>;
  PokemonSpecies?: Record<number, PokemonSpeciesData>;
  PokemonStats?: PokemonStatsModule;
  PokemonData?: PokemonDataStore;
  RocketTeams?: RocketTeamsModule;
  getRocketStageByIndex?: (index: number) => RocketStage | null | undefined;
  getRocketStageById?: (id: string) => RocketStage | null | undefined;
  AppState?: AppStateApi;
  PlayerCollection?: PlayerCollectionApi;
  UI?: UiHelpers;
  readState?: () => Record<string, unknown>;
  writeState?: (patch: Record<string, unknown>) => void;
  mergeState?: (patch: Record<string, unknown>) => void;
  replaceState?: (next: Record<string, unknown>) => void;
  clearState?: () => void;
  setStateValue?: (key: string, value: unknown) => void;
  removeStateValue?: (key: string) => void;
  getStateValue?: <T = unknown>(key: string, fallback?: T) => T | null;
  subscribeState?: (listener: StateListener) => () => void;
}

