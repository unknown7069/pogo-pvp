const ITEM_DEFINITIONS = [
    {
        key: 'rareCandy',
        name: 'Rare Candy',
        icon: 'https://archives.bulbagarden.net/media/upload/8/8d/Bag_Rare_Candy_Sprite.png',
        description: 'A candy that is packed with energy. When consumed, it will instantly raise the level of a single Pokemon by one.',
        categories: ['candy'],
    },
    {
        key: 'fastTm',
        name: 'Fast TM',
        icon: 'https://archives.bulbagarden.net/media/upload/9/9a/Bag_TM_Normal_Sprite.png',
        description: 'A Technical Machine that teaches a Pokemon a new fast move. It is consumed after use.',
        categories: ['tm'],
    },
    {
        key: 'chargedTm',
        name: 'Charged TM',
        icon: 'https://archives.bulbagarden.net/media/upload/5/57/Bag_TM_Electric_Sprite.png',
        description: 'A Technical Machine that teaches a Pokemon a new charged move. It is consumed after use.',
        categories: ['tm'],
    },
    {
        key: 'eliteTm',
        name: 'Elite TM',
        icon: 'https://archives.bulbagarden.net/media/upload/6/64/Bag_TM_Fighting_Sprite.png',
        description: 'A rare Technical Machine that unlocks every fast or charged move a Pokemon can learn.',
        categories: ['tm', 'premium'],
    },
    {
        key: 'sunStone',
        name: 'Sun Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/a/ad/Bag_Sun_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It burns as red as the evening sun.',
        categories: ['evolution'],
    },
    {
        key: 'moonStone',
        name: 'Moon Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/a/ae/Bag_Moon_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It is as black as the night sky.',
        categories: ['evolution'],
    },
    {
        key: 'fireStone',
        name: 'Fire Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/8/86/Bag_Fire_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. The stone has a fiery orange heart.',
        categories: ['evolution'],
    },
    {
        key: 'waterStone',
        name: 'Water Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/3/3f/Bag_Water_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It has a mystic, water-blue glow.',
        categories: ['evolution'],
    },
    {
        key: 'thunderStone',
        name: 'Thunder Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/7/79/Bag_Thunder_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It has an unmistakable thunderbolt pattern.',
        categories: ['evolution'],
    },
    {
        key: 'leafStone',
        name: 'Leaf Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/e/eb/Bag_Leaf_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It has an unmistakable leaf pattern.',
        categories: ['evolution'],
    },
    {
        key: 'iceStone',
        name: 'Ice Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/5/51/Bag_Ice_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It has an unmistakable snowflake pattern.',
        categories: ['evolution'],
    },
    {
        key: 'shinyStone',
        name: 'Shiny Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/4/45/Bag_Shiny_Stone_Sprite.png',
        description: 'A very shiny stone that makes certain species of Pokemon evolve. It shines with a dazzling light.',
        categories: ['evolution'],
    },
    {
        key: 'duskStone',
        name: 'Dusk Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/b/b2/Bag_Dusk_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It holds shadows as dark as can be.',
        categories: ['evolution'],
    },
    {
        key: 'dawnStone',
        name: 'Dawn Stone',
        icon: 'https://archives.bulbagarden.net/media/upload/7/70/Bag_Dawn_Stone_Sprite.png',
        description: 'A peculiar stone that can make certain species of Pokemon evolve. It sparkles like a gleam of dawn.',
        categories: ['evolution'],
    },
];
const itemByKey = ITEM_DEFINITIONS.reduce((acc, def) => {
    acc[def.key] = def;
    return acc;
}, {});
const tmKeys = ITEM_DEFINITIONS.filter((def) => def.categories.includes('tm') && !def.categories.includes('premium')).map((def) => def.key);
const evolutionKeys = ITEM_DEFINITIONS.filter((def) => def.categories.includes('evolution')).map((def) => def.key);
(function registerItemCatalog() {
    if (typeof window === 'undefined')
        return;
    window.ItemData = {
        list: ITEM_DEFINITIONS.slice(),
        byKey: itemByKey,
        tmKeys: tmKeys.slice(),
        evolutionKeys: evolutionKeys.slice(),
    };
})();
