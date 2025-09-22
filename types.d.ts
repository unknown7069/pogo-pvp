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
  specialEffects?: {
    buff?: {
      target?: 'self' | 'opponent';
      chance?: number;
      attack?: number;
      defense?: number;
    };
  };
  buffs?: Record<string, unknown>;
}

interface PokemonSpeciesData {
  id: number;
  name: string;
  types?: string[];
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
  shiny?: boolean;
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
}

interface PokemonDataStore {
  FAST_MOVES_BY_ID?: Record<string, MoveData>;
  CHARGED_MOVES_BY_ID?: Record<string, MoveData>;
  speciesById?: Record<number, PokemonSpeciesData>;
  all?: PokemonSpeciesData[];
  getBattleSpriteUrl?: (name: string, side: 'player' | 'opponent', shiny?: boolean) => string;
  getPokemonById?: (id: number, overrides?: PokemonCollectionEntry | null) => any;
  getGoStatsById?: (id: number, level: number) => { hp?: number; attack?: number; defense?: number };
  calcGoCp?: (stats: { hp?: number; attack?: number; defense?: number }) => number;
  byId?: Map<number, any> | { get?: (id: number) => any };
  getPokemonFastMove?: (id: string) => MoveData | undefined;
  getPokemonChargedMove?: (id: string) => MoveData | undefined;
}

interface RocketTeamsModule {
  pool?: Array<{ id: number; name?: string }>;
}

type RocketStage = any;

interface Window {
  PokemonData?: PokemonDataStore;
  RocketTeams?: RocketTeamsModule;
  getRocketStageByIndex?: (index: number) => RocketStage | null | undefined;
  getRocketStageById?: (id: string) => RocketStage | null | undefined;
  readState?: () => any;
  writeState?: (state: any) => void;
  setStateValue?: (key: string, value: any) => void;
  removeStateValue?: (key: string) => void;
  getStateValue?: (key: string, fallback?: any) => any;
}
