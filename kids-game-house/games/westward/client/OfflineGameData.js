/**
 * 纯前端模式的模拟数据
 */

var OfflineGameData = {
    // 模拟玩家数据
    playerData: {
        id: 1,
        name: 'Hero',
        x: 10,
        y: 10,
        region: 0,
        settlement: 0,
        hp: 100,
        hpmax: 100,
        vigor: 100,
        food: 100,
        gold: 100,
        class: 'warrior',
        level: 1,
        xp: 0,
        xpNeeded: 100,
        items: [], // 空背包
        belt: [], // 空腰带
        equipment: {}, // 空装备
        abilities: [], // 空技能
        ap: 10, // 行动点数
        classxp: 0, // 职业经验
        classlvl: 1 // 职业等级
    },
    
    // 模拟游戏配置
    gameConfig: {
        boot: {
            offerTutorial: true,
            forceNewPlayer: false,
            autoBoot: false
        },
        newPlayer: true,
        nbc: 1,
        config: {
            hearingDistance: 10
        }
    },
    
    // 模拟区域数据
    regionsData: [
        {
            id: 0,
            name: 'Greenwood',
            x: 500,
            y: 300
        },
        {
            id: 1,
            name: 'Mountains',
            x: 700,
            y: 200
        }
    ],
    
    // 模拟营地数据
    campsData: [
        {
            id: 0,
            name: 'Green Camp',
            region: 0,
            x: 10,
            y: 10
        }
    ],
    
    // 模拟世界数据
    worldData: {
        width: 1500,
        height: 1140
    },
    
    // 模拟地图块数据 (chunkX, chunkY) -> chunkData
    chunks: {},
    
    // 生成一个简单的地图块
    generateChunk: function(chunkX, chunkY) {
        var chunkId = chunkX + '_' + chunkY;
        if (this.chunks[chunkId]) {
            return this.chunks[chunkId];
        }
        
        // 创建一个简单的地图块
        var chunkData = {
            id: chunkId,
            x: chunkX,
            y: chunkY,
            default: 'grass',
            layers: [[]], // 简单的图层
            decor: [],
            wood: []
        };
        
        // 使用正确的装饰元素简写名称
        var decorTypes = ['t1', 't2', 't3', 't4', 'r1', 'r2', 'r3', 'r4', 'b1', 'b2'];
        
        // 添加一些简单的装饰
        for (var i = 0; i < 8; i++) {
            var dx = Math.floor(Math.random() * 30);
            var dy = Math.floor(Math.random() * 20);
            var decorType = decorTypes[Math.floor(Math.random() * decorTypes.length)];
            chunkData.decor.push([dx, dy, decorType]);
        }
        
        // 添加一些木材资源
        for (var i = 0; i < 5; i++) {
            var wx = Math.floor(Math.random() * 30);
            var wy = Math.floor(Math.random() * 20);
            chunkData.wood.push([wx, wy]);
        }
        
        this.chunks[chunkId] = chunkData;
        return chunkData;
    }
};

// 预生成一些地图块
for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
        OfflineGameData.generateChunk(x, y);
    }
}

export default OfflineGameData;
