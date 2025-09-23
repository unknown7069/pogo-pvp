(function (global) {
    const rawStages = [
        {
            id: 'grunt-male',
            name: 'Rocket Grunt',
            quote: "Let's do this!",
            icon: 'https://archives.bulbagarden.net/media/upload/thumb/8/80/VSTeam_GO_Rocket_Grunt_M.png/120px-VSTeam_GO_Rocket_Grunt_M.png',
            team: [
                { speciesId: 19, name: 'Rattata', level: 5 },
                { speciesId: 41, name: 'Zubat', level: 5 },
                { speciesId: 66, name: 'Machop', level: 7 },
            ],
        },
        {
            id: 'grunt-female',
            name: 'Rocket Grunt',
            quote: 'Get ready to lose twerp!',
            icon: 'https://archives.bulbagarden.net/media/upload/thumb/6/62/VSTeam_GO_Rocket_Grunt_F.png/120px-VSTeam_GO_Rocket_Grunt_F.png',
            team: [
                { speciesId: 23, name: 'Ekans', level: 7 },
                { speciesId: 96, name: 'Drowzee', level: 7 },
                { speciesId: 109, name: 'Koffing', level: 9 },
            ],
        },
        {
            id: 'cliff',
            name: 'Cliff',
            quote: "Don't waste my time.",
            icon: 'https://archives.bulbagarden.net/media/upload/thumb/d/d9/VSCliff.png/120px-VSCliff.png',
            team: [
                { speciesId: 142, name: 'Aerodactyl', level: 40 },
                { speciesId: 95, name: 'Onix', level: 42 },
                { speciesId: 68, name: 'Machamp', level: 43 },
            ],
        },
        {
            id: 'arlo',
            name: 'Arlo',
            quote: "I'll show you true power.",
            icon: 'https://archives.bulbagarden.net/media/upload/thumb/5/5c/VSArlo.png/120px-VSArlo.png',
            team: [
                { speciesId: 80, name: 'Slowbro', level: 39 },
                { speciesId: 123, name: 'Scyther', level: 41 },
                { speciesId: 45, name: 'Vileplume', level: 43 },
            ],
        },
        {
            id: 'sierra',
            name: 'Sierra',
            quote: "You'll regret this.",
            icon: 'https://archives.bulbagarden.net/media/upload/thumb/8/82/VSSierra.png/120px-VSSierra.png',
            team: [
                { speciesId: 38, name: 'Ninetales', level: 38 },
                { speciesId: 94, name: 'Gengar', level: 40 },
                { speciesId: 131, name: 'Lapras', level: 42 },
            ],
        },
        {
            id: 'giovanni',
            name: 'Giovanni',
            quote: 'So, you think you can challenge me?',
            icon: 'https://archives.bulbagarden.net/media/upload/f/f3/VSGiovanni_GO.png',
            team: [
                { speciesId: 53, name: 'Persian', level: 45 },
                { speciesId: 34, name: 'Nidoking', level: 47 },
                { speciesId: 111, name: 'Rhyhorn', level: 50 },
            ],
        },
    ];
    const STAGES = rawStages.map(function (stage) {
        const team = Array.isArray(stage.team)
            ? stage.team.map(function (member) {
                const speciesId = Number(member && (member.speciesId != null ? member.speciesId : member.id));
                const normalizedId = Number.isFinite(speciesId) ? speciesId : 0;
                return Object.freeze({
                    id: normalizedId,
                    speciesId: normalizedId,
                    name: member && member.name != null ? String(member.name) : null,
                    level: member && Number.isFinite(member.level) ? Number(member.level) : 20,
                    overrides: member && member.overrides && typeof member.overrides === 'object'
                        ? Object.assign({}, member.overrides)
                        : undefined,
                });
            })
            : [];
        return Object.freeze({
            id: stage.id,
            name: stage.name,
            quote: stage.quote,
            icon: stage.icon,
            team: team,
        });
    });
    Object.freeze(STAGES);
    function getStageById(id) {
        if (!id)
            return null;
        for (let i = 0; i < STAGES.length; i++) {
            if (STAGES[i].id === id)
                return STAGES[i];
        }
        return null;
    }
    function getStageByIndex(index) {
        const n = Number(index);
        if (!Number.isFinite(n) || n < 0 || n >= STAGES.length)
            return null;
        return STAGES[n];
    }
    global.RocketTeams = STAGES;
    global.getRocketStageById = getStageById;
    global.getRocketStageByIndex = getStageByIndex;
})(window);
