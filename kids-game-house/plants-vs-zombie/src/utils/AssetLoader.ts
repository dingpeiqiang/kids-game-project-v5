/**
 * 游戏资源加载器
 * 
 * 负责从配置加载游戏资源，支持图片和音频
 * 如果自定义资源不存在，则使用回退方案（Emoji 或生成的图形）
 */

import Phaser from 'phaser'
import {
  PLANT_ASSETS,
  ZOMBIE_ASSETS,
  PROJECTILE_ASSETS,
  SUN_ASSETS,
  UI_ASSETS,
  getAssetPath,
  useFallback
} from '@/config/game-assets.config'

export class AssetLoader {
  private scene: Phaser.Scene | null = null
  private loadedAssets: Set<string> = new Set()
  private themeAssets: Record<string, string> = {}

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 预加载所有资源
   */
  async preloadAll(): Promise<void> {
    if (!this.scene) return

    // 1. 尝试从创作者中心加载主题
    await this.loadThemeFromAPI()

    // 2. 预加载植物图片（如果主题中没有提供，使用默认资源）
    Object.entries(PLANT_ASSETS).forEach(([key, config]) => {
      const assetKey = `plant_${key}`
      const themeUrl = this.themeAssets[`plant_${key}`]

      if (themeUrl) {
        this.preloadImage(assetKey, themeUrl)
      } else if (!useFallback('plants', key)) {
        this.preloadImage(assetKey, getAssetPath('plants', key))
      }
    })

    // 3. 预加载僵尸图片
    Object.entries(ZOMBIE_ASSETS).forEach(([key, config]) => {
      const assetKey = `zombie_${key}`
      const themeUrl = this.themeAssets[`zombie_${key}`]

      if (themeUrl) {
        this.preloadImage(assetKey, themeUrl)
      } else if (!useFallback('zombies', key)) {
        this.preloadImage(assetKey, getAssetPath('zombies', key))
      }
    })

    // 4. 预加载子弹图片
    Object.entries(PROJECTILE_ASSETS).forEach(([key, config]) => {
      const assetKey = `projectile_${key}`
      const themeUrl = this.themeAssets[`projectile_${key}`]

      if (themeUrl) {
        this.preloadImage(assetKey, themeUrl)
      } else if (!useFallback('projectiles', key)) {
        this.preloadImage(assetKey, getAssetPath('projectiles', key))
      }
    })

    // 5. 预加载阳光图片
    Object.entries(SUN_ASSETS).forEach(([key, config]) => {
      const assetKey = `sun_${key}`
      const themeUrl = this.themeAssets[`sun_${key}`]

      if (themeUrl) {
        this.preloadImage(assetKey, themeUrl)
      } else if (!useFallback('suns', key)) {
        this.preloadImage(assetKey, getAssetPath('suns', key))
      }
    })

    // 6. 预加载UI图片
    Object.entries(UI_ASSETS).forEach(([key, config]) => {
      const assetKey = `ui_${key}`
      const themeUrl = this.themeAssets[`ui_${key}`]

      if (themeUrl) {
        this.preloadImage(assetKey, themeUrl)
      } else if (!useFallback('ui', key)) {
        this.preloadImage(assetKey, getAssetPath('ui', key))
      }
    })
  }

  /**
   * 从创作者中心API加载主题资源
   */
  private async loadThemeFromAPI(): Promise<void> {
    try {
      // 从URL参数获取themeId
      const urlParams = new URLSearchParams(window.location.search)
      const themeId = urlParams.get('theme_id')

      if (!themeId) {
        console.log('🎨 [PVZ] 未指定主题ID，使用默认资源')
        return
      }

      console.log('🎨 [PVZ] 加载主题资源，themeId:', themeId)

      // 调用后端API获取主题配置
      const response = await fetch(`/api/theme/download?id=${themeId}`)
      const result = await response.json()

      if (result.code !== 200 || !result.data) {
        console.error('🎨 [PVZ] 加载主题失败:', result.msg)
        return
      }

      // 解析主题配置
      const themeConfig = JSON.parse(result.data.configJson)
      const assets = themeConfig.default?.assets || {}

      console.log('🎨 [PVZ] 主题配置加载成功:', themeConfig.themeName)

      // 保存主题资源URL
      this.themeAssets = {
        ...this.themeAssets,
        ...assets
      }

      console.log('🎨 [PVZ] 主题资源加载完成:', Object.keys(this.themeAssets))
    } catch (error) {
      console.error('🎨 [PVZ] 加载主题资源失败:', error)
    }
  }

  /**
   * 预加载单个图片
   */
  private preloadImage(key: string, path: string): void {
    if (!this.scene || this.loadedAssets.has(key)) return

    this.scene.load.image(key, path)
    this.loadedAssets.add(key)
  }

  /**
   * 加载植物纹理
   */
  loadPlantTexture(plantType: string, onLoad: (texture: Phaser.Textures.Texture | null) => void): void {
    if (!this.scene) {
      onLoad(null)
      return
    }

    // 检查是否使用自定义资源
    if (!useFallback('plants', plantType)) {
      const key = `plant_${plantType}`
      const path = getAssetPath('plants', plantType)

      if (this.scene.textures.exists(key)) {
        onLoad(this.scene.textures.get(key))
        return
      }

      this.scene.load.once('complete', () => {
        if (this.scene!.textures.exists(key)) {
          onLoad(this.scene!.textures.get(key))
        } else {
          onLoad(null)
        }
      })

      if (!this.loadedAssets.has(key)) {
        this.scene.load.image(key, path)
        this.loadedAssets.add(key)
        this.scene.load.start()
      }
      return
    }

    // 使用 Emoji 回退
    onLoad(null)
  }

  /**
   * 加载僵尸纹理
   */
  loadZombieTexture(zombieType: string, onLoad: (texture: Phaser.Textures.Texture | null) => void): void {
    if (!this.scene) {
      onLoad(null)
      return
    }

    if (!useFallback('zombies', zombieType)) {
      const key = `zombie_${zombieType}`
      const path = getAssetPath('zombies', zombieType)

      if (this.scene.textures.exists(key)) {
        onLoad(this.scene.textures.get(key))
        return
      }

      this.scene.load.once('complete', () => {
        if (this.scene!.textures.exists(key)) {
          onLoad(this.scene!.textures.get(key))
        } else {
          onLoad(null)
        }
      })

      if (!this.loadedAssets.has(key)) {
        this.scene.load.image(key, path)
        this.loadedAssets.add(key)
        this.scene.load.start()
      }
      return
    }

    onLoad(null)
  }

  /**
   * 加载子弹纹理
   */
  loadProjectileTexture(projectileType: string, onLoad: (texture: Phaser.Textures.Texture | null) => void): void {
    if (!this.scene) {
      onLoad(null)
      return
    }

    if (!useFallback('projectiles', projectileType)) {
      const key = `projectile_${projectileType}`
      const path = getAssetPath('projectiles', projectileType)

      if (this.scene.textures.exists(key)) {
        onLoad(this.scene.textures.get(key))
        return
      }

      this.scene.load.once('complete', () => {
        if (this.scene!.textures.exists(key)) {
          onLoad(this.scene!.textures.get(key))
        } else {
          onLoad(null)
        }
      })

      if (!this.loadedAssets.has(key)) {
        this.scene.load.image(key, path)
        this.loadedAssets.add(key)
        this.scene.load.start()
      }
      return
    }

    onLoad(null)
  }

  /**
   * 加载阳光纹理
   */
  loadSunTexture(onLoad: (texture: Phaser.Textures.Texture | null) => void): void {
    if (!this.scene) {
      onLoad(null)
      return
    }

    if (!useFallback('suns', 'sun')) {
      const key = 'sun_sun'
      const path = getAssetPath('suns', 'sun')

      if (this.scene.textures.exists(key)) {
        onLoad(this.scene.textures.get(key))
        return
      }

      this.scene.load.once('complete', () => {
        if (this.scene!.textures.exists(key)) {
          onLoad(this.scene!.textures.get(key))
        } else {
          onLoad(null)
        }
      })

      if (!this.loadedAssets.has(key)) {
        this.scene.load.image(key, path)
        this.loadedAssets.add(key)
        this.scene.load.start()
      }
      return
    }

    onLoad(null)
  }

  /**
   * 加载UI纹理
   */
  loadUITexture(uiKey: string, onLoad: (texture: Phaser.Textures.Texture | null) => void): void {
    if (!this.scene) {
      onLoad(null)
      return
    }

    if (!useFallback('ui', uiKey)) {
      const key = `ui_${uiKey}`
      const path = getAssetPath('ui', uiKey)

      if (this.scene.textures.exists(key)) {
        onLoad(this.scene.textures.get(key))
        return
      }

      this.scene.load.once('complete', () => {
        if (this.scene!.textures.exists(key)) {
          onLoad(this.scene!.textures.get(key))
        } else {
          onLoad(null)
        }
      })

      if (!this.loadedAssets.has(key)) {
        this.scene.load.image(key, path)
        this.loadedAssets.add(key)
        this.scene.load.start()
      }
      return
    }

    onLoad(null)
  }
}

/**
 * 检查资源是否存在
 */
export function checkAssetExists(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = path
  })
}

/**
 * 获取所有可配置资源的列表（用于文档或工具生成）
 */
export function getAssetList(): Array<{
  category: string
  key: string
  name: string
  type: string
  defaultPath: string
  specs: Record<string, string>
}> {
  const categories = {
    plants: PLANT_ASSETS,
    zombies: ZOMBIE_ASSETS,
    projectiles: PROJECTILE_ASSETS,
    suns: SUN_ASSETS,
    ui: UI_ASSETS
  }

  const result: Array<{
    category: string
    key: string
    name: string
    type: string
    defaultPath: string
    specs: Record<string, string>
  }> = []

  Object.entries(categories).forEach(([category, assets]) => {
    Object.entries(assets).forEach(([key, config]: [string, any]) => {
      result.push({
        category,
        key,
        name: config.specs?.name || key,
        type: config.type,
        defaultPath: config.defaultPath,
        specs: config.specs || {}
      })
    })
  })

  return result
}
