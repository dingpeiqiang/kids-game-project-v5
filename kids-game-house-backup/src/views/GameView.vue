<template>
  <div class="game-container">
    <!-- 游戏画布 -->
    <div ref="gameContainer" class="game-canvas"></div>
    
    <!-- UI 层 -->
    <div v-if="gameStore.gameState === 'menu'" class="ui-layer menu-ui">
      <h1 class="game-title">坦克大战</h1>
      <p class="game-subtitle">TANK BATTLE</p>
      
      <div class="menu-buttons">
        <button @click="startGame" class="btn btn-primary">开始游戏</button>
        <button @click="showInstructions = !showInstructions" class="btn btn-secondary">游戏说明</button>
      </div>
      
      <div v-if="showInstructions" class="instructions">
        <h3>游戏说明</h3>
        <ul>
          <li>使用 WASD 或方向键控制坦克移动</li>
          <li>按 J 或空格键开火</li>
          <li>保护基地 (鹰标),消灭所有敌人</li>
          <li>收集道具获得特殊能力</li>
        </ul>
      </div>
    </div>
    
    <!-- 暂停菜单 -->
    <div v-else-if="gameStore.gameState === 'paused'" class="ui-layer pause-ui">
      <h2>游戏暂停</h2>
      <div class="menu-buttons">
        <button @click="resumeGame" class="btn btn-primary">继续游戏</button>
        <button @click="restartGame" class="btn btn-secondary">重新开始</button>
        <button @click="quitGame" class="btn btn-danger">退出游戏</button>
      </div>
    </div>
    
    <!-- 游戏结束 -->
    <div v-else-if="gameStore.gameState === 'gameover'" class="ui-layer gameover-ui">
      <h2>游戏结束</h2>
      <p>得分：{{ gameStore.score }}</p>
      <p>关卡：{{ gameStore.currentLevel }}</p>
      <div class="menu-buttons">
        <button @click="restartGame" class="btn btn-primary">再来一次</button>
        <button @click="quitGame" class="btn btn-secondary">返回主菜单</button>
      </div>
    </div>
    
    <!-- 胜利画面 -->
    <div v-else-if="gameStore.gameState === 'victory'" class="ui-layer victory-ui">
      <h2>恭喜通关!</h2>
      <p>得分：{{ gameStore.score }}</p>
      <div class="menu-buttons">
        <button @click="nextLevel" class="btn btn-primary" v-if="gameStore.currentLevel < 20">下一关</button>
        <button @click="quitGame" class="btn btn-secondary">返回主菜单</button>
      </div>
    </div>
    
    <!-- HUD (游戏中界面) -->
    <div v-else class="hud">
      <div class="hud-left">
        <span>关卡：{{ gameStore.currentLevel }}</span>
        <span>分数：{{ gameStore.score }}</span>
      </div>
      <div class="hud-right">
        <span>生命：{{ gameStore.lives }}</span>
        <span>敌人：{{ gameStore.remainingEnemies + gameStore.enemies.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'
import { TankGameScene } from '../scenes/TankGameScene'

const gameStore = useGameStore()
const gameContainer = ref<HTMLDivElement | null>(null)
const showInstructions = ref(false)

let game: Phaser.Game | null = null

// 启动游戏
function startGame() {
  gameStore.startGame(1)
  initPhaserGame()
}

// 初始化 Phaser 游戏
function initPhaserGame() {
  if (!gameContainer.value || game) return
  
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: 720,
    height: 1280,
    backgroundColor: '#1a1a2e',
    scene: [TankGameScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  }
  
  game = new Phaser.Game(config)
}

// 恢复游戏
function resumeGame() {
  gameStore.resumeGame()
}

// 重新开始
function restartGame() {
  gameStore.initLevel(gameStore.currentLevel)
  gameStore.gameState = 'playing'
  
  // 重启 Phaser 场景
  if (game) {
    game.scene.getScene('TankGameScene').scene.restart()
  }
}

// 下一关
function nextLevel() {
  const nextLevel = gameStore.currentLevel + 1
  gameStore.startGame(nextLevel)
  
  if (game) {
    game.scene.getScene('TankGameScene').scene.restart()
  }
}

// 退出游戏
function quitGame() {
  gameStore.gameState = 'menu'
  
  if (game) {
    game.destroy(true)
    game = null
  }
}

// 处理 ESC 键
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (gameStore.gameState === 'playing') {
      gameStore.pauseGame()
    } else if (gameStore.gameState === 'paused') {
      gameStore.resumeGame()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(26, 26, 46, 0.95);
  color: white;
  z-index: 10;
}

.menu-ui {
  text-align: center;
}

.game-title {
  font-size: 72px;
  font-weight: bold;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #4ade80, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.game-subtitle {
  font-size: 32px;
  margin-bottom: 50px;
  color: #9ca3af;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  padding: 15px 40px;
  font-size: 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.btn-primary {
  background: linear-gradient(45deg, #4ade80, #22c55e);
  color: white;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
}

.btn-secondary {
  background: #4b5563;
  color: white;
}

.btn-secondary:hover {
  background: #6b7280;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.instructions {
  margin-top: 40px;
  padding: 30px;
  background: rgba(75, 85, 99, 0.5);
  border-radius: 8px;
  max-width: 500px;
}

.instructions h3 {
  margin-bottom: 15px;
  font-size: 24px;
}

.instructions ul {
  list-style: none;
  padding-left: 0;
}

.instructions li {
  margin: 10px 0;
  font-size: 18px;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  color: white;
  font-size: 20px;
  z-index: 5;
}

.hud-left,
.hud-right {
  display: flex;
  gap: 30px;
}
</style>
