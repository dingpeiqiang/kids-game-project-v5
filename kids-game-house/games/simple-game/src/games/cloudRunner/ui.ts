export class UI {
  private container: HTMLElement;
  private scoreElement!: HTMLElement;
  private distanceElement!: HTMLElement;
  private highScoreElement!: HTMLElement;
  private speedElement!: HTMLElement;
  private gameOverElement!: HTMLElement;
  private startScreenElement!: HTMLElement;
  private newRecordElement!: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createElements();
  }

  private createElements(): void {
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '100%';
    uiContainer.style.height = '100%';
    uiContainer.style.pointerEvents = 'none';
    this.container.appendChild(uiContainer);

    const topBar = document.createElement('div');
    topBar.style.position = 'absolute';
    topBar.style.top = '20px';
    topBar.style.left = '20px';
    topBar.style.right = '20px';
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.color = '#fff';
    topBar.style.fontFamily = 'Arial, sans-serif';
    topBar.style.fontSize = '18px';
    topBar.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    uiContainer.appendChild(topBar);

    this.scoreElement = document.createElement('div');
    this.scoreElement.innerHTML = '<span style="color:#F1C40F">💰</span> 分数: <span id="score">0</span>';
    topBar.appendChild(this.scoreElement);

    this.distanceElement = document.createElement('div');
    this.distanceElement.innerHTML = '<span style="color:#3498db">🏃</span> 距离: <span id="distance">0</span>m';
    topBar.appendChild(this.distanceElement);

    this.highScoreElement = document.createElement('div');
    this.highScoreElement.innerHTML = '<span style="color:#E74C3C">🏆</span> 最高分: <span id="highScore">0</span>';
    topBar.appendChild(this.highScoreElement);

    this.speedElement = document.createElement('div');
    this.speedElement.innerHTML = '<span style="color:#2ECC71">⚡</span> 速度: <span id="speed">1x</span>';
    topBar.appendChild(this.speedElement);

    this.startScreenElement = document.createElement('div');
    this.startScreenElement.style.position = 'absolute';
    this.startScreenElement.style.top = '50%';
    this.startScreenElement.style.left = '50%';
    this.startScreenElement.style.transform = 'translate(-50%, -50%)';
    this.startScreenElement.style.textAlign = 'center';
    this.startScreenElement.style.color = '#fff';
    this.startScreenElement.style.fontFamily = 'Arial, sans-serif';
    this.startScreenElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    this.startScreenElement.style.pointerEvents = 'auto';
    this.startScreenElement.innerHTML = `
      <h1 style="font-size: 48px; margin-bottom: 20px; color: #3498db;">☁️ 云端极速跑酷</h1>
      <p style="font-size: 20px; margin-bottom: 30px;">在云端赛道上奔跑，挑战你的极限！</p>
      <div style="font-size: 16px; margin-bottom: 30px; text-align: left; display: inline-block;">
        <p><strong>电脑端操作：</strong></p>
        <p>⬅️ A/D 或 方向键 - 左右变道</p>
        <p>⬆️ 空格键 - 跳跃</p>
        <p>⬇️ S/下方向键 - 下蹲</p>
        <p>🔄 R键 - 重置游戏</p>
        <br>
        <p><strong>手机端操作：</strong></p>
        <p>👈👉 左右滑动 - 变道</p>
        <p>⬆️ 上滑 - 跳跃</p>
        <p>⬇️ 下滑 - 下蹲</p>
        <p>👆 双击 - 重置游戏</p>
      </div>
      <button 
        style="padding: 15px 40px; font-size: 24px; background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; border-radius: 30px; cursor: pointer; transition: transform 0.2s;"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
        id="startButton"
      >
        🚀 开始游戏
      </button>
    `;
    uiContainer.appendChild(this.startScreenElement);

    this.gameOverElement = document.createElement('div');
    this.gameOverElement.style.position = 'absolute';
    this.gameOverElement.style.top = '50%';
    this.gameOverElement.style.left = '50%';
    this.gameOverElement.style.transform = 'translate(-50%, -50%)';
    this.gameOverElement.style.textAlign = 'center';
    this.gameOverElement.style.color = '#fff';
    this.gameOverElement.style.fontFamily = 'Arial, sans-serif';
    this.gameOverElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    this.gameOverElement.style.pointerEvents = 'auto';
    this.gameOverElement.style.display = 'none';
    this.gameOverElement.innerHTML = `
      <h1 style="font-size: 48px; margin-bottom: 20px; color: #E74C3C;">💥 游戏结束</h1>
      <p id="finalScore" style="font-size: 24px; margin-bottom: 10px;">最终分数: 0</p>
      <p id="finalDistance" style="font-size: 20px; margin-bottom: 20px;">奔跑距离: 0m</p>
      <div id="recordIndicator" style="font-size: 24px; color: #F1C40F; margin-bottom: 30px; display: none;">🎉 新纪录！</div>
      <button 
        style="padding: 15px 40px; font-size: 24px; background: linear-gradient(135deg, #2ECC71, #27AE60); color: white; border: none; border-radius: 30px; cursor: pointer; transition: transform 0.2s;"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
        id="restartButton"
      >
        🔄 重新开始
      </button>
    `;
    uiContainer.appendChild(this.gameOverElement);

    this.newRecordElement = document.createElement('div');
    this.newRecordElement.style.position = 'absolute';
    this.newRecordElement.style.top = '40%';
    this.newRecordElement.style.left = '50%';
    this.newRecordElement.style.transform = 'translate(-50%, -50%)';
    this.newRecordElement.style.fontSize = '36px';
    this.newRecordElement.style.color = '#F1C40F';
    this.newRecordElement.style.fontFamily = 'Arial, sans-serif';
    this.newRecordElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    this.newRecordElement.style.display = 'none';
    this.newRecordElement.innerHTML = '🎉 新纪录！';
    uiContainer.appendChild(this.newRecordElement);
  }

  updateScore(score: number): void {
    document.getElementById('score')!.textContent = score.toString();
  }

  updateDistance(distance: number): void {
    document.getElementById('distance')!.textContent = Math.floor(distance).toString();
  }

  updateHighScore(highScore: number): void {
    document.getElementById('highScore')!.textContent = highScore.toString();
  }

  updateSpeed(speed: number): void {
    document.getElementById('speed')!.textContent = speed.toFixed(1) + 'x';
  }

  showStartScreen(): void {
    this.startScreenElement.style.display = 'block';
    this.gameOverElement.style.display = 'none';
  }

  hideStartScreen(): void {
    this.startScreenElement.style.display = 'none';
  }

  showGameOver(score: number, distance: number, isNewRecord: boolean): void {
    document.getElementById('finalScore')!.textContent = `最终分数: ${score}`;
    document.getElementById('finalDistance')!.textContent = `奔跑距离: ${Math.floor(distance)}m`;
    document.getElementById('recordIndicator')!.style.display = isNewRecord ? 'block' : 'none';
    this.gameOverElement.style.display = 'block';
  }

  hideGameOver(): void {
    this.gameOverElement.style.display = 'none';
  }

  showNewRecord(): void {
    this.newRecordElement.style.display = 'block';
    setTimeout(() => {
      this.newRecordElement.style.display = 'none';
    }, 2000);
  }

  setStartCallback(callback: () => void): void {
    document.getElementById('startButton')!.addEventListener('click', callback);
  }

  setRestartCallback(callback: () => void): void {
    document.getElementById('restartButton')!.addEventListener('click', callback);
  }

  cleanup(): void {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}