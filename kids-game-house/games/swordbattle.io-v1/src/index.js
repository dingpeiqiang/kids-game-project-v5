import TitleScene from "./TitleScene.js";
import GameScene from "./GameScene.js";
import OpenScene from "./OpenScene.js";
import Phaser from "phaser";

function canvas() {
    let downGrade = 1; // Do not change this, it breaks the game
    return {
        width: document.documentElement.clientWidth/downGrade,
        height: document.documentElement.clientHeight/downGrade,
        downGrade
    };
}

window.addEventListener("load", () => {
    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return false;
        }
    }

    var sva = storageAvailable("localStorage");
    let options;
    if(!sva) options = {};
    else {
    try {
        options = JSON.parse(window.localStorage.getItem("options"));
    } catch (e) {
        options = {};
    }
}
    console.warn(options, "options");

var config = {
    type: Phaser.CANVAS,
    width: canvas().width,
    height: canvas().height,
    parent: "game",
    dom: {
        createContainer: true,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scale: {
        mode:Phaser.Scale.NONE,
    },
    pixelArt: (options?.antiAliasing == "false") ? true : false,
    resolution: 0.5
};
var mobile = window.matchMedia("(pointer: coarse)").matches;
var game = new Phaser.Game(config);

var openScene = new OpenScene();

var scale = "scale(1)";
document.body.style.webkitTransform =       // Chrome, Opera, Safari
 document.body.style.msTransform =          // IE 9
 document.body.style.transform = scale;     // General

var gameScene = new GameScene((instantStart=false) => {
    titleScene.playPreroll = false;
    console.log(instantStart, "instantStart");
    titleScene.instantStart = instantStart;
});

var titleScene = new TitleScene(false, (name, music, secret, adFailed = false) => {
    gameScene.name = name;
    gameScene.options = titleScene.options;
    if(gameScene.options.server == "auto") gameScene.options.server = "local";
    gameScene.openingBgm = music;
    gameScene.secret = secret;

    titleScene.scene.start("game");
    titleScene.showPromo = false;
});

titleScene.mobile = mobile;
gameScene.mobile = mobile;
openScene.mobile = mobile;
titleScene.instantStart = false;

titleScene.showPromo = false;

Object.defineProperty(titleScene, "canvas", {
    get: canvas
});
Object.defineProperty(gameScene, "canvas", {
    get: canvas
});
Object.defineProperty(openScene, "canvas", {
    get: canvas
});

game.scene.add("title", titleScene);
game.scene.add("game", gameScene);
game.scene.add("open", openScene);

game.scene.start("open");

document.addEventListener("contextmenu",function(e) {
    e.preventDefault();
});
});
