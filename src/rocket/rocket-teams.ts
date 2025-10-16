(function (global: Window & typeof window) {
  const rawStages = [
    {
      id: 'grunt-male',
      name: 'Rocket Grunt',
      quote: "Let's do this!",
      icon: 'https://archives.bulbagarden.net/media/upload/thumb/8/80/VSTeam_GO_Rocket_Grunt_M.png/120px-VSTeam_GO_Rocket_Grunt_M.png',
      team: [
        { speciesId: 19, name: 'Rattata', level: 5 },
        { speciesId: 41, name: 'Zubat', level: 6 },
        { speciesId: 66, name: 'Machop', level: 7 },
      ],
    },
    {
      id: 'grunt-female',
      name: 'Rocket Grunt',
      quote: 'Get ready to lose twerp!',
      icon: 'https://archives.bulbagarden.net/media/upload/thumb/6/62/VSTeam_GO_Rocket_Grunt_F.png/120px-VSTeam_GO_Rocket_Grunt_F.png',
      team: [
        { speciesId: 23, name: 'Ekans', level: 8 },
        { speciesId: 96, name: 'Drowzee', level: 9 },
        { speciesId: 109, name: 'Koffing', level: 10 },
      ],
    },
    {
      id: 'cliff',
      name: 'Cliff',
      quote: "Don't waste my time.",
      icon: 'https://archives.bulbagarden.net/media/upload/thumb/d/d9/VSCliff.png/120px-VSCliff.png',
      team: [
        { speciesId: 142, name: 'Aerodactyl', level: 14 },
        { speciesId: 95, name: 'Onix', level: 15 },
        { speciesId: 68, name: 'Machamp', level: 16 },
      ],
    },
    {
      id: 'arlo',
      name: 'Arlo',
      quote: "I'll show you true power.",
      icon: 'https://archives.bulbagarden.net/media/upload/thumb/5/5c/VSArlo.png/120px-VSArlo.png',
      team: [
        { speciesId: 80, name: 'Slowbro', level: 20 },
        { speciesId: 123, name: 'Scyther', level: 21 },
        { speciesId: 45, name: 'Vileplume', level: 22 },
      ],
    },
    {
      id: 'sierra',
      name: 'Sierra',
      quote: "You'll regret this.",
      icon: 'https://archives.bulbagarden.net/media/upload/thumb/8/82/VSSierra.png/120px-VSSierra.png',
      team: [
        { speciesId: 38, name: 'Ninetales', level: 28 },
        { speciesId: 94, name: 'Gengar', level: 29 },
        { speciesId: 131, name: 'Lapras', level: 30 },
      ],
    },
    {
      id: 'giovanni',
      name: 'Giovanni',
      quote: 'So, you think you can challenge me?',
      icon: 'https://archives.bulbagarden.net/media/upload/f/f3/VSGiovanni_GO.png',
      team: [
        { speciesId: 53, name: 'Persian', level: 35 },
        { speciesId: 34, name: 'Nidoking', level: 36 },
        { speciesId: 111, name: 'Rhyhorn', level: 37 },
      ],
    },    
    {
      id: 'mewtwo',
      name: 'Mewtwo',
      quote: '...',
      icon: 'https://www.pokemon.com/static-assets/content-assets/cms2/img/video-games/_tiles/pokemon-go/art/shadow-mewtwo.png',
      team: [
        { speciesId: 150, name: 'Mewtwo', level: 50 },
      ],
    },
  ];

  const STAGES: RocketStage[] = rawStages.map((stage) => {
    const team = Array.isArray(stage.team)
      ? stage.team.map((member) => {
          const raw = member as Record<string, unknown>;
          const speciesSource = raw.speciesId != null ? raw.speciesId : raw.id;
          const speciesId = Number(speciesSource);
          const normalizedId = Number.isFinite(speciesId) ? speciesId : 0;
          const overrides = raw.overrides && typeof raw.overrides === 'object'
            ? Object.assign({}, raw.overrides)
            : undefined;
          return Object.freeze({
            id: normalizedId,
            speciesId: normalizedId,
            name: raw.name != null ? String(raw.name) : null,
            level: Number.isFinite(raw.level as number) ? Number(raw.level) : 20,
            overrides: overrides as PokemonCollectionEntry | undefined,
          });
        })
      : [];

    return Object.freeze({
      id: stage.id,
      name: stage.name,
      quote: stage.quote,
      icon: stage.icon,
      team,
    });
  }) as RocketStage[];

  Object.freeze(STAGES);

  function getStageById(id: string) {
    if (!id) return null;
    for (let i = 0; i < STAGES.length; i++) {
      if (STAGES[i].id === id) return STAGES[i];
    }
    return null;
  }

  function getStageByIndex(index: number) {
    const n = Number(index);
    if (!Number.isFinite(n) || n < 0 || n >= STAGES.length) return null;
    return STAGES[n];
  }

  global.RocketTeams = STAGES as RocketTeamsModule;
  global.getRocketStageById = getStageById;
  global.getRocketStageByIndex = getStageByIndex;
})(window);
