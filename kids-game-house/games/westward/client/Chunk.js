import {SpaceMap} from '../shared/SpaceMap'
import Utils from '../shared/Utils'
import World from '../shared/World'

var TREE_ALPHA = 1;

function Chunk(data, tilesetData, scene){
    this.tilesetData = tilesetData;
    this.scene = scene;
    this.id = data.id;
    this.x = parseInt(data.x);
    this.y = parseInt(data.y);
    this.defaultTile = data.default;
    this.layers = data.layers;
    this.decor = data.decor;
    this.ground = new SpaceMap();
    this.ground.fromList(this.layers[0],true); // true = compact list
    this.wood = data.wood;
    this.tiles = [];
    this.tilesMap = new SpaceMap();
    this.images = [];
    this.displayed = false;
    this.leavesPos = [[0,-1],[0,0],[0,1],[1,1],[1,0],[2,0],[2,1],[2,-1]];
    this.draw();
}

Chunk.prototype.draw = function(){
    console.log('绘制地图块:', this.id, '坐标:', this.x, this.y, 'defaultTile:', this.defaultTile);
    
    this.wood.forEach(function(w){
        this.addResource(this.x+w[0],this.y+w[1]);
    },this);
    
    // Ground - 渲染基础地面
    var groundRendered = false;
    for(var x_ = 0; x_ < World.chunkWidth; x_++){
        for(var y_ = 0; y_ < World.chunkHeight; y_++) {
            var tx = this.x + x_;
            var ty = this.y + y_;
            if(this.hasWater(tx,ty)) continue;
            if(this.defaultTile == 'grass') {
                var gs = this.tilesetData.config.grassSize;
                var t = (tx % gs) + (ty % gs) * gs;
                var tileName = this.tilesetData.config.grassPrefix+'_'+t;
                this.drawTile(tx,ty,tileName);
                groundRendered = true;
            }
        }
    }
    
    if (!groundRendered) {
        console.warn('地图块', this.id, '没有渲染任何地面瓦片');
    } else {
        console.log('地图块', this.id, '地面瓦片渲染成功');
    }
    
    // Layers - 渲染额外的图层
    if (this.layers && this.layers.length > 0) {
        this.layers.forEach(function(layer){
            if (!layer || layer.length === 0) return;
            layer.forEach(function(data){
                if (!data || data.length < 3) return;
                var tile = data[2];
                if(tile === undefined) return;
                var x = this.x + parseInt(data[0]);
                var y = this.y + parseInt(data[1]);
                var name = this.tilesetData.shorthands[tile];
                if(!name) {
                    // 如果没有简写映射，直接使用 tile 作为名称
                    name = tile;
                }
                this.drawTile(x, y, name);
            },this);
        },this);
    }
    
    if(this.tiles.length > 700) console.warn(this.tiles.length); // TODO: remove eventually

    // Decor - 渲染装饰物
    if (this.decor && this.decor.length > 0) {
        this.decor.forEach(function (data) {
            if (!data || data.length < 3) return;
            var x = this.x + parseInt(data[0]);
            var y = this.y + parseInt(data[1]);
            this.addImage(x, y, data[2]);
            if(data[2][0] == 't') this.addOverlay(x,y);
        }, this);
    }

    this.displayed = true;
    console.log('地图块', this.id, '渲染完成，瓦片数:', this.tiles.length, '装饰数:', this.images ? this.images.length : 0);
};

Chunk.prototype.has = function(x,y,v){
    var cx = x - this.x;
    var cy = y - this.y;
    return (this.ground.get(cx,cy) == v);
};

Chunk.prototype.hasWater = function(x,y){
    return this.has(x,y,'w');
};

Chunk.prototype.drawTile = function(x,y,tile){
    /*if(BLIT){ // TODO: remove?
        Editor.ground.create(x * World.tileWidth, y * World.tileHeight, tile);
        return;
    }*/
    
    // 调试：记录前几个瓦片的渲染情况
    if (this.tiles.length < 3) {
        console.log('尝试绘制瓦片:', tile, '位置:', x, y);
    }
    
    // 先检查纹理帧是否存在
    var textureExists = false;
    try {
        var textureManager = this.scene.textures;
        if (textureManager && textureManager.exists('tileset')) {
            var texture = textureManager.get('tileset');
            var frames = texture.frames;
            if (frames && frames[tile]) {
                textureExists = true;
                if (this.tiles.length < 3) {
                    console.log('纹理存在:', tile);
                }
            } else {
                if (this.tiles.length < 3) {
                    console.warn('纹理帧不存在:', tile, 
                                 '总帧数:', Object.keys(frames || {}).length,
                                 '可用帧示例:', Object.keys(frames || {}).slice(0, 5));
                }
            }
        } else {
            // 只在第一次警告时输出详细信息
            if (!Chunk._tilesetWarningShown) {
                console.warn('tileset 纹理不存在');
                console.warn('已加载的纹理:', Object.keys(textureManager.list));
                Chunk._tilesetWarningShown = true;
            }
        }
    } catch (e) {
        console.warn('检查纹理时出错:', e);
    }
    
    if (textureExists) {
        try {
            var sprite = this.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',tile);
            sprite.setDisplayOrigin(0,0);
            sprite.tileID = tile;
            this.tiles.push(sprite);
            if(this.getAtlasData(tile,'collides',true)) this.addCollision(x,y);
            this.postDrawTile(x,y,tile,sprite);
        } catch (e) {
            console.warn('绘制瓦片失败:', tile, e);
            // 如果出错，还是使用 fallback
            this.drawFallbackTile(x, y, tile);
        }
    } else {
        // 纹理不存在，使用 fallback
        if (this.tiles.length < 3) {
            console.log('使用 fallback 绘制瓦片:', tile);
        }
        this.drawFallbackTile(x, y, tile);
    }
};

Chunk.prototype.drawFallbackTile = function(x,y,tile){
    // 如果找不到纹理帧，绘制一个简单的矩形作为 fallback
    var graphics = this.scene.add.graphics();
    
    // 根据瓦片类型设置颜色
    if (tile && tile.startsWith('grass')) {
        graphics.fillStyle(0x7CFC00, 1); // 草坪绿
    } else if (tile && tile.startsWith('water')) {
        graphics.fillStyle(0x4169E1, 1); // 皇家蓝
    } else {
        graphics.fillStyle(0x90EE90, 1); // 浅绿作为默认颜色
    }
    
    graphics.fillRect(x*World.tileWidth, y*World.tileHeight, World.tileWidth, World.tileHeight);
    
    // 生成纹理并创建精灵
    var textureKey = 'fallback_' + tile.replace(/[^a-zA-Z0-9]/g, '_') + '_' + x + '_' + y;
    graphics.generateTexture(textureKey, World.tileWidth, World.tileHeight);
    graphics.destroy();
    
    var fallbackSprite = this.scene.add.image(x*World.tileWidth, y*World.tileHeight, textureKey);
    fallbackSprite.setDisplayOrigin(0,0);
    fallbackSprite.tileID = tile;
    this.tiles.push(fallbackSprite);
    
    if (this.tiles.length <= 3) {
        console.log('Fallback 瓦片已创建:', tile, '纹理键:', textureKey);
    }
};

Chunk.prototype.getAtlasData = function(image,data,longname){
    if (!this.tilesetData || !this.tilesetData.atlas) {
        return false;
    }
    if(longname){
        if (this.tilesetData.atlas[image] && this.tilesetData.atlas[image][data] !== undefined) {
            return this.tilesetData.atlas[image][data];
        }
        return false;
    }else {
        if (!(image in this.tilesetData.shorthands)){
            console.warn('Unknown shorthand',image);
            return false;
        }
        var longnameImage = this.tilesetData.shorthands[image];
        if (this.tilesetData.atlas[longnameImage] && this.tilesetData.atlas[longnameImage][data] !== undefined) {
            return this.tilesetData.atlas[longnameImage][data];
        }
        return false;
    }
};

Chunk.prototype.drawImage = function(x,y,image,depth,crop){
    try {
        if (!this.tilesetData || !this.tilesetData.shorthands || !this.tilesetData.shorthands[image]) {
            console.warn('找不到图像缩写:', image);
            return null;
        }
        
        var fullImageName = this.tilesetData.shorthands[image];
        
        // 检查纹理帧是否存在
        var textureExists = false;
        try {
            var textureManager = this.scene.textures;
            if (textureManager && textureManager.exists('tileset')) {
                var frames = textureManager.get('tileset').frames;
                if (frames && frames[fullImageName]) {
                    textureExists = true;
                }
            }
        } catch (e) {
            // 忽略错误
        }
        
        if (!textureExists) {
            // 减少警告噪音，只在调试模式下显示
            // console.warn('找不到纹理帧:', fullImageName);
            return null;
        }
        
        var offset = this.getAtlasData(image,'offset');
        if(offset){
            x += offset.x;
            y += offset.y;
        }
        var img = this.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',fullImageName);
        if(crop) img.setCrop(crop);
        var depthOffset = this.getAtlasData(image,'depthOffset') || 0;
        depth = depth || y;
        img.setDepth(depth+depthOffset);
        var anchor = this.getAtlasData(image,'anchor');
        if (anchor) {
            img.setOrigin(anchor.x,anchor.y);
        }
        this.images.push(img);
        this.postDrawImage(x,y,image,img);
        return img;
    } catch (e) {
        console.warn('绘制图像出错:', e, 'image:', image);
        return null;
    }
};

Chunk.prototype.addImage = function(x,y,image){
    try {
        var isTree = (image[0] == 't');
        if(isTree){
            var frame = this.getAtlasData(image,'frame');
            if (!frame) {
                console.warn('找不到图像帧数据:', image);
                return;
            }
            var ycutoff = frame.h*0.4;
            var img1 = this.drawImage(x,y,image, y, new Phaser.Geom.Rectangle(0,0,frame.w,ycutoff));
            if (img1) img1.setAlpha(TREE_ALPHA);
            var img2 = this.drawImage(x,y,image, y+1, new Phaser.Geom.Rectangle(0,ycutoff,frame.w,frame.h-ycutoff));
            if (img2) img2.setAlpha(TREE_ALPHA);
        }else{
            this.drawImage(x,y,image);
        }
        // Manage collisions
        var collisions = this.getAtlasData(image,'collisions');
        if(collisions) {
            collisions.forEach(function(coll){
                this.addCollision(x+coll[0],y+coll[1]);
            },this);
        }
        // Draw dead leaves on the ground
        if(isTree && Utils.randomInt(1,10) > 6){ // TODO: conf
            var nbleaves = 5; //TODO: conf
            Utils.shuffle(this.leavesPos);
            for(var j = 0; j < nbleaves; j++) {
                var c = this.leavesPos[j];
                var type = Utils.randomInt(1,3);
                var lx = x+c[0];
                var ly = y+c[1];
                this.drawImage(lx,ly,'l'+type);
                // if(this.hasWater(lx,ly)) console.warn('on water');
            }
        }
        // Add ivy
        if(isTree && (image[1] == 1 || image[1] == 2) && Utils.randomInt(1,10) > 6){ // TODO: conf
            this.drawImage(x+1,y-1,'i'+Utils.randomInt(1,2),y+1);
        }
    } catch (e) {
        console.warn('添加图像出错:', e, 'image:', image);
    }
};

Chunk.prototype.erase = function(){
    for(var x = this.x; x < this.x + World.chunkWidth; x++){
        for(var y = this.y; y < this.y + World.chunkHeight; y++){
           this.removeCollision(x,y);
        }
    }
    this.tiles.forEach(function(tile){
        tile.destroy();
    });
    this.images.forEach(function(image){
        image.destroy();
    });
};

export default Chunk