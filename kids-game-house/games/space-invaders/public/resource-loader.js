/**
 * Space Invaders 资源加载器
 * 从 GTRS.json 配置文件加载游戏资源
 */

class ResourceLoader {
  constructor() {
    this.gtrsData = null;
    this.resourcesLoaded = false;
    this.onLoadCallbacks = [];
  }

  /**
   * 加载 GTRS.json 配置
   */
  async loadGtrsConfig() {
    try {
      const response = await fetch('/api/gtrs');
      if (!response.ok) {
        throw new Error('Failed to load GTRS.json');
      }
      this.gtrsData = await response.json();
      this.resourcesLoaded = true;
      
      // 执行所有回调
      this.onLoadCallbacks.forEach(callback => callback(this.gtrsData));
      this.onLoadCallbacks = [];
      
      console.log('✅ GTRS 配置加载成功');
      return this.gtrsData;
    } catch (error) {
      console.error('❌ 加载 GTRS 配置失败:', error);
      throw error;
    }
  }

  /**
   * 当资源加载完成时执行回调
   */
  onLoad(callback) {
    if (this.resourcesLoaded) {
      callback(this.gtrsData);
    } else {
      this.onLoadCallbacks.push(callback);
    }
  }

  /**
   * 获取图片资源
   */
  getImage(key) {
    if (!this.gtrsData || !this.gtrsData.resources || !this.gtrsData.resources.images) {
      return null;
    }

    // 在所有分类中查找
    for (const category in this.gtrsData.resources.images) {
      if (this.gtrsData.resources.images[category][key]) {
        return this.gtrsData.resources.images[category][key];
      }
    }
    return null;
  }

  /**
   * 获取图片资源路径
   */
  getImagePath(key) {
    const image = this.getImage(key);
    return image ? image.src : null;
  }

  /**
   * 获取音频资源
   */
  getAudio(key) {
    if (!this.gtrsData || !this.gtrsData.resources || !this.gtrsData.resources.audio) {
      return null;
    }

    // 在所有分类中查找
    for (const category in this.gtrsData.resources.audio) {
      if (this.gtrsData.resources.audio[category][key]) {
        return this.gtrsData.resources.audio[category][key];
      }
    }
    return null;
  }

  /**
   * 获取音频资源路径
   */
  getAudioPath(key) {
    const audio = this.getAudio(key);
    return audio ? audio.src : null;
  }

  /**
   * 获取脚本资源
   */
  getScript(key) {
    if (!this.gtrsData || !this.gtrsData.resources || !this.gtrsData.resources.scripts) {
      return null;
    }
    return this.gtrsData.resources.scripts[key];
  }

  /**
   * 在 Phaser 的 preload 中加载资源（只加载实际存在的文件）
   * 返回 Promise，resolve 时所有可用资源已提交给 phaserLoader
   */
  async loadIntoPhaser(phaserLoader) {
    if (!this.gtrsData) {
      console.warn('GTRS 数据未加载，无法加载资源到 Phaser');
      return;
    }

    // 加载图片资源 —— 先 HEAD 检测文件是否存在，避免 Phaser 因 404 覆盖备用纹理
    if (this.gtrsData.resources && this.gtrsData.resources.images) {
      for (const category in this.gtrsData.resources.images) {
        const categoryData = this.gtrsData.resources.images[category];
        for (const key in categoryData) {
          const image = categoryData[key];
          if (!image.src) continue;
          try {
            const resp = await fetch(image.src, { method: 'HEAD' });
            if (resp.ok) {
              phaserLoader.image(key, image.src);
              console.log(`📷 加载图片: ${key} -> ${image.src}`);
            } else {
              console.log(`⚠️ 图片不存在，跳过: ${key} (${image.src})`);
            }
          } catch {
            console.log(`⚠️ 图片检测失败，跳过: ${key}`);
          }
        }
      }
    }

    // 加载音频资源
    if (this.gtrsData.resources && this.gtrsData.resources.audio) {
      for (const category in this.gtrsData.resources.audio) {
        const categoryData = this.gtrsData.resources.audio[category];
        for (const key in categoryData) {
          const audio = categoryData[key];
          if (!audio.src) continue;
          try {
            const resp = await fetch(audio.src, { method: 'HEAD' });
            if (resp.ok) {
              phaserLoader.audio(key, audio.src);
              console.log(`🎵 加载音频: ${key} -> ${audio.src}`);
            }
          } catch {
            // 静默跳过
          }
        }
      }
    }
  }

  /**
   * 获取所有资源键列表
   */
  getAllResourceKeys() {
    const keys = {
      images: [],
      audio: [],
      scripts: []
    };

    if (!this.gtrsData) return keys;

    // 获取图片键
    if (this.gtrsData.resources && this.gtrsData.resources.images) {
      for (const category in this.gtrsData.resources.images) {
        keys.images.push(...Object.keys(this.gtrsData.resources.images[category]));
      }
    }

    // 获取音频键
    if (this.gtrsData.resources && this.gtrsData.resources.audio) {
      for (const category in this.gtrsData.resources.audio) {
        keys.audio.push(...Object.keys(this.gtrsData.resources.audio[category]));
      }
    }

    // 获取脚本键
    if (this.gtrsData.resources && this.gtrsData.resources.scripts) {
      keys.scripts.push(...Object.keys(this.gtrsData.resources.scripts));
    }

    return keys;
  }
}

// 创建全局资源加载器实例
window.resourceLoader = new ResourceLoader();
