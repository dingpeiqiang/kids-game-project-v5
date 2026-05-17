import Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // 从全局变量读取GTRS数据
    this.gtrsData = window.GTRS_DATA;
    
    if (!this.gtrsData) {
      console.error('[BootScene] GTRS配置未加载，无法继续');
      // 显示错误信息
      const C = window.GAME_CONFIG;
      this.add.text(C.BASE_W / 2, C.BASE_H / 2, '资源加载失败，请刷新页面', {
        fontSize: '24px', fill: '#FF0000', fontStyle: 'bold'
      }).setOrigin(0.5);
      return;
    }

    console.log('[BootScene] 开始加载资源，GTRS版本:', this.gtrsData.themeInfo?.version);

    // ── 强制刷新缓存:使用时间戳作为版本号 ──
    const v = `?v=${Date.now()}`;
    const gtrs = this.gtrsData;
    const resources = gtrs.resources;

    // 加载图片
    if (resources.images) {
      Object.entries(resources.images).forEach(([category, items]) => {
        Object.entries(items).forEach(([key, item]) => {
          console.log(`[BootScene] 加载图片: ${key}`);
          this.load.image(key, `${item.src}${v}`);
        });
      });
    }

    // 加载音效
    if (resources.audio) {
      // 加载 BGM
      if (resources.audio.bgm) {
        Object.entries(resources.audio.bgm).forEach(([key, item]) => {
          console.log(`[BootScene] 加载 BGM: ${key}`);
          this.load.audio(key, [item.src]);
        });
      }
      
      // 加载音效（跳过图片类型）
      if (resources.audio.effect) {
        Object.entries(resources.audio.effect).forEach(([key, item]) => {
          // 跳过非音频资源（如被错误分类的图片）
          if (item.type && !['mp3', 'wav', 'ogg', 'webm'].includes(item.type.toLowerCase())) {
            console.log(`[BootScene] 跳过非音频资源: ${key} (类型: ${item.type})`);
            return;
          }
          console.log(`[BootScene] 加载音效: ${key}`);
          this.load.audio(key, [item.src]);
        });
      }
      
      // 加载语音
      if (resources.audio.voice) {
        Object.entries(resources.audio.voice).forEach(([key, item]) => {
          console.log(`[BootScene] 加载语音: ${key}`);
          this.load.audio(key, [item.src]);
        });
      }
    }

    // 加载图集
    if (resources.atlases) {
      Object.entries(resources.atlases).forEach(([category, items]) => {
        Object.entries(items).forEach(([key, item]) => {
          console.log(`[BootScene] 加载图集: ${key}`);
          this.load.multiatlas(key, `${item.atlas}${v}`, item.image.substring(0, item.image.lastIndexOf('/')));
        });
      });
    }

    // 加载进度条
    const C = window.GAME_CONFIG;
    const barW = 300;
    const barH = 20;
    const barX = (C.BASE_W - barW) / 2;
    const barY = C.BASE_H / 2;

    const bgBar = this.add.rectangle(C.BASE_W / 2, barY, barW + 4, barH + 4, 0x333333).setOrigin(0.5);
    const fgBar = this.add.rectangle(barX, barY - barH / 2, 0, barH, 0x4CAF50).setOrigin(0);

    this.load.on('progress', (value) => {
      fgBar.width = barW * value;
    });

    this.load.on('complete', () => {
      console.log('[BootScene] 所有资源加载完成');
      bgBar.destroy();
      fgBar.destroy();
    });

    this.load.on('filecomplete', (key, type, data) => {
      console.log(`[BootScene] ✓ ${key}`);
    });

    this.load.on('loaderror', (file) => {
      console.error(`[BootScene] ✗ 加载失败:`, file.src);
    });
  }

  create() {
    // 布局常量传到 game 对象
    const C = window.GAME_CONFIG;
    Object.keys(C).forEach(k => { this.game[k] = C[k] });

    this.scene.start('TitleScene');
  }
}
