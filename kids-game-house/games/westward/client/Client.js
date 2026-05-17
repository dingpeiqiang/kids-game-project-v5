/**
 * Created by Jerome on 30-06-17.
 */

import { io } from 'socket.io-client';
import Engine from './Engine'
import UI from './UI'
import OfflineGameData from './OfflineGameData'

var Client = {
    initEventName: 'init', // name of the event that triggers the call to initWorld() and the initialization of the game
    storageIDKey: 'playerID', // key in localStorage of player ID
    eventsQueue : [], // when events arrive before the flag playerIsInitialized is set to true, they are not processed
    offlineMode: true // 纯前端模式标志
};

// 模拟配置 - 使游戏在没有后端服务器时也能正常显示
Client.gameConfig = OfflineGameData.gameConfig;

// 安全地调用 bootParamsReceived，避免循环依赖
Client.safeBootParamsReceived = function() {
    try {
        // 延迟加载 Boot 模块，避免循环依赖问题
        import('./Boot').then(function(module) {
            var Boot = module.default;
            if (Boot && typeof Boot.bootParamsReceived === 'function') {
                Boot.bootParamsReceived();
            }
        }).catch(function(err) {
            console.error('加载 Boot 模块失败:', err);
        });
    } catch (e) {
        console.error('调用 bootParamsReceived 失败:', e);
    }
};

// 连接到本地开发服务器（端口 8081）
if (!Client.offlineMode) {
    try {
        Client.socket = io('http://localhost:8081', {
            transports: ['websocket', 'polling'],
            timeout: 2000,
            reconnectionAttempts: 1
        });
        
        // 如果连接成功，我们会使用服务器的配置
        Client.socket.on('boot-params', function(data) {
            Client.gameConfig = data;
            console.log('收到服务器配置:', Client.gameConfig);
            Client.safeBootParamsReceived();
            Client.newPlayer = data.newPlayer;
            Client.nbConnected = data.nbc;
            console.log(Client.nbConnected + ' connected');
        });
        
        // 如果连接失败，我们已经有模拟配置了
        Client.socket.on('connect_error', function() {
            console.log('无法连接到后端服务器，使用模拟配置');
            // 调用 bootParamsReceived 继续游戏流程
            Client.safeBootParamsReceived();
        });
    } catch (e) {
        console.log('Socket.io 连接错误，使用模拟配置:', e);
        // 确保有一个基本的 socket 对象，避免后续错误
        Client.socket = {
            emit: function() {},
            on: function() {},
            onevent: function() {}
        };
        // 继续游戏流程
        setTimeout(function() {
            Client.safeBootParamsReceived();
        }, 500);
    }
} else {
    // 纯前端模式：创建一个基本的 socket 对象，避免错误
    Client.socket = {
        emit: function() {},
        on: function() {},
        onevent: function() {}
    };
    // 直接调用 bootParamsReceived 继续游戏流程
    console.log('纯前端模式已启用');
    setTimeout(function() {
        Client.safeBootParamsReceived();
    }, 100);
}

Client.emptyQueue = function(){ // Process the events that have been queued during initialization
    for(var e = 0; e < Client.eventsQueue.length; e++){
        Client.socket.onevent.call(Client.socket,Client.eventsQueue[e]);
    }
};

Client.requestData = function(){ // request the data to be used for initWorld()
    console.log('requesting data');
    
    // 纯前端模式：直接初始化游戏世界
    if (Client.offlineMode) {
        console.log('纯前端模式：直接初始化游戏世界');
        setTimeout(function() {
            Engine.initWorld(OfflineGameData.playerData);
        }, 500);
        return;
    }
    
    Client.socket.emit('init-world',Client.getInitRequest());

    // The following checks if the game is initialized or not, and based on this either queues the events or process them
    // The original socket.onevent function is copied to onevent. That way, onevent can be used to call the origianl function,
    // whereas socket.onevent can be modified for our purpose!
    var onevent = Client.socket.onevent;
    Client.socket.onevent = function (packet) {
        if(!Engine.playerIsInitialized && packet.data[0] != Client.initEventName && packet.data[0] != 'dbError'){
            console.warn('queueing ',packet.data[0]);
            Client.eventsQueue.push(packet);
        }else{
            onevent.call(this, packet);    // original call
        }
    };
};

Client.getInitRequest = function(){ // Returns the data object to send to request the initialization data
    // In case of a new player, set new to true and send the name of the player
    // Else, set new to false and send it's id instead to fetch the corresponding data in the database
    if(Client.tutorial){
        return {
            new: true,
            tutorial:true
        };
    }
    if(Client.isNewPlayer()) {
        return {
            new:true,
            tutorial: false,
            selectedClass: UI.selectedClass,
            selectedRegion: UI.selectedSettlement,
            characterName: UI.characterName,
            log: Client.getLogFlag()
        };
    }
    return {
        new:false,
        id:Client.getPlayerID(),
        stamp: Client.getIDStamp(),
        log: Client.getLogFlag()
    };
};

Client.getLogFlag = function(){
    return !localStorage.getItem('log');
};

Client.getIDStamp = function(){
    return localStorage.getItem('idStamp');
};

Client.getBootParameters = function(){
    Client.socket.emit('boot-params',{id:Client.getPlayerID()});
};

Client.isNewPlayer = function(){
    if(Client.gameConfig) {
        if(Client.gameConfig.boot.forceNewPlayer) return true;
        return Client.newPlayer;
    }
    console.error('Missing Client.gameConfig');
};

Client.getPlayerID = function(){
    return localStorage.getItem(Client.storageIDKey);
};

Client.isFirstBattle = function(){
    return !localStorage.getItem('firstBattle');
};

Client.hadFirstBattle = function(){
    localStorage.setItem('firstBattle',true);
};

// #### RECEIVERS ####

Client.socket.on(Client.initEventName,function(data){ // This event triggers when receiving the initialization packet from the server, to use in Game.initWorld()
    console.log('Init packet received');
    //if(data instanceof ArrayBuffer) data = Decoder.decode(data,CoDec.initializationSchema); // if in binary format, decode first
    // Client.socket.emit('ponq',data.stamp); // send back a pong stamp to compute latency
    Client.serverTimeDelta = data.refTime - Date.now();
    Engine.initWorld(data.player);
    //Game.updateNbConnected(data.nbconnected);
    console.log(Client.serverTimeDelta,'time delta');
});

Client.socket.on('wait',function(){
    // wait is sent back from the server when the client attempts to connect before the server is done initializing and reading the map
    console.log('Server not ready, re-attempting...');
    setTimeout(Client.requestData, 500); // Just try again in 500ms
});

Client.socket.on('region-data',function(data){
    UI.displayRegions(data);
});

Client.socket.on('camps-data',function(data){
    UI.displayCamps(data);
});

Client.socket.on('update',function(data){ // This event triggers uppon receiving an update packet (data)
    //if(data instanceof ArrayBuffer) data = Decoder.decode(data,CoDec.finalUpdateSchema); // if in binary format, decode first
    //Client.socket.emit('ponq',data.stamp);  // send back a pong stamp to compute latency
    //if(data.nbconnected !== undefined) Game.updateNbConnected(data.nbconnected);
    //if(data.latency) Game.setLatency(data.latency);
    //if(data.latency) console.log('[lat] '+data.latency+' ms');
    if(data.local) console.log(data.local);
    if(data.global) console.log(data.global);
    if(data.local) Engine.updateSelf(data.local); // Should come first
    if(data.global) Engine.updateWorld(data.global);
    if(data.qt) Engine.debugQT(data.qt);
    Engine.currentTurn = data.turn;
});

Client.socket.on('pid',function(playerID){ // the 'pid' event is used for the server to tell the client what is the ID of the player
    Client.setLocalData(playerID);
});

Client.setLocalData = function(id){ // store the player ID in localStorage
    //console.log('your ID : '+id);
    localStorage.setItem(Client.storageIDKey,id);
    localStorage.setItem('idStamp',Date.now());
};

/// ##### SENDERS ######

Client.requestRegionsData = function(){
    Client.socket.emit('region-data');
};

Client.requestCampsData = function(){
    Client.socket.emit('camps-data');
};

Client.sendPath = function(path,action){
    Client.socket.emit('path',{path:path,action:action});
};

Client.buildingClick = function(targetID){
    Client.socket.emit('buildingClick',{id:targetID});
};

Client.NPCClick = function(targetID,type){
    Client.socket.emit('NPCClick',{id:targetID,type:type});
};

Client.battleAction = function(action,data){
    data.action = action;
    Client.socket.emit('battleAction',data);
};

Client.sendCraft = function(id,nb,stock){
    Client.socket.emit('craft',{id:id,nb:nb,stock:stock});
};

Client.sendPurchase = function(id,nb, action, financial){
    Client.socket.emit('shop',{id:id,nb:nb,action:action,financial:financial});
};

Client.sendStock  = function(item,nb,building,action){
    Client.socket.emit('stock',{item:item,nb:nb,building:building,action:action});
};

Client.sendUse = function(id, inventory){
    Client.socket.emit('use',{item:id, inventory:inventory});
};

Client.sendBelt = function(id, inventory){
    Client.socket.emit('belt',{item:id, inventory:inventory});
};


Client.sendUnequip = function(slot,subslot){
    Client.socket.emit('unequip',{slot:slot,subslot:subslot});
};

Client.sendExit = function(){
    Client.socket.emit('exit');
};

Client.sendBuild = function(id,tile){
    Client.socket.emit('build',{id:id,tile:tile});
};

Client.setPrices = function(id,buy,sell){
    Client.socket.emit('prices',{item:id,buy:buy,sell:sell});
};

Client.exchangeGold = function(nb){
    Client.socket.emit('gold',{nb:nb});
};

Client.sendChat = function(text){
    Client.socket.emit('chat',text);
};

Client.sendAbility = function(aid){
    Client.socket.emit('ability',aid);
};

Client.sendRespawn = function(){
    Client.socket.emit('respawn');
};

Client.logMenu = function(menu){
    Client.socket.emit('menu',menu);
};

Client.logMisc = function(misc){
    Client.socket.emit('logmisc',misc);
};

Client.sendTutorialStart = function(){
    Client.socket.emit('tutorial-start');
};

Client.sendTutorialStep = function(step){
    Client.socket.emit('tutorial-step',step);
};

Client.sendTutorialEnd = function(){
    Client.socket.emit('tutorial-end');
};
// ####################"

Client.sendMapData = function(id,data){
    Client.socket.emit('mapdata',{id:id,data:data});
};

Client.sendScreenshot = function(image,browser){
    Client.socket.emit('screenshot',{img:image,browser:browser});
};

export default Client;