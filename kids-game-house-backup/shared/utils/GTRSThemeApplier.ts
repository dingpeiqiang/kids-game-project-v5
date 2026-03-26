/**
 * GTRS主题应用器
 * 提供游戏场景中应用主题资源的便捷方法
 */

import { getImageResource, getAudioResource, type GTRSTheme } from './GTRSThemeLoader'

/**
 * Phaser场景基类扩展
 * 提供主题资源获取方法
 */
export class GTRSThemeScene extends Phaser.Scene {
  /**
   * 获取图片资源并加载
   * @param category 分类
   * @param key 资源key
   * @returns 资源路径
   */
  public getThemeImage(
    category: 'login' | 'scene' | 'ui' | 'icon' | 'effect',
    key: string
  ): string {
    const src = getImageResource(category, key)
    return src
  }

  /**
   * 加载主题图片到Phaser缓存
   * @param category 分类
   * @param key 资源key
   * @param textureKey Phaser纹理key（可选，默认使用资源key）
   */
  public loadThemeImage(
    category: 'login' | 'scene' | 'ui' | 'icon' | 'effect',
    key: string,
    textureKey?: string
  ): void {
    const src = getImageResource(category, key)
    if (src) {
      this.load.image(textureKey || key, src)
    }
  }

  /**
   * 获取音频资源
   * @param category 分类
   * @param key 资源key
   * @returns 音频资源对象
   */
  public getThemeAudio(
    category: 'bgm' | 'effect' | 'voice',
    key: string
  ): { src: string; volume: number } | null {
    return getAudioResource(category, key)
  }

  /**
   * 播放主题音频
   * @param category 分类
   * @param key 资源key
   * @param loop 是否循环
   * @returns 音频对象
   */
  public playThemeAudio(
    category: 'bgm' | 'effect' | 'voice',
    key: string,
    loop: boolean = false
  ): Phaser.Sound.BaseSound | null {
    const audio = getAudioResource(category, key)
    if (!audio) {
      console.warn(`音频资源不存在: ${category}.${key}`)
      return null
    }

    // 检查是否已加载
    const sound = this.sound.get(key)
    if (sound) {
      sound.setVolume(audio.volume)
      if (loop) {
        sound.setLoop(true)
      }
      sound.play()
      return sound
    }

    // 使用Web Audio API播放
    return null
  }

  /**
   * 应用全局样式到游戏UI
   */
  public applyThemeStyles(): void {
    const root = document.documentElement

    // 从CSS变量获取样式
    const primaryColor = root.style.getPropertyValue('--theme-primary-color')
    const secondaryColor = root.style.getPropertyValue('--theme-secondary-color')
    const bgColor = root.style.getPropertyValue('--theme-bg-color')
    const textColor = root.style.getPropertyValue('--theme-text-color')

    // 应用到游戏UI元素（如果有）
    const gameContainer = document.getElementById('game-container')
    if (gameContainer) {
      gameContainer.style.backgroundColor = bgColor || '#1A1A1A'
      gameContainer.style.color = textColor || '#FFFFFF'
    }
  }
}

/**
 * 创建带主题功能的按钮
 * @param scene Phaser场景
 * @param x X坐标
 * @param y Y坐标
 * @param text 按钮文字
 * @param callback 点击回调
 * @returns 按钮对象
 */
export function createThemeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  callback: () => void
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y)

  // 获取按钮图片
  const normalKey = getImageResource('ui', 'ui_button_normal')
  const hoverKey = getImageResource('ui', 'ui_button_hover')
  const pressedKey = getImageResource('ui', 'ui_button_pressed')

  // 创建按钮背景
  const bg = scene.add.image(0, 0, normalKey)
  bg.setInteractive({ useHandCursor: true })

  // 悬停效果
  bg.on('pointerover', () => {
    if (hoverKey) {
      bg.setTexture(hoverKey)
    }
  })

  bg.on('pointerout', () => {
    bg.setTexture(normalKey)
  })

  bg.on('pointerdown', () => {
    if (pressedKey) {
      bg.setTexture(pressedKey)
    }
  })

  bg.on('pointerup', () => {
    bg.setTexture(normalKey)
    callback()
  })

  // 创建文字
  const label = scene.add.text(0, 0, text, {
    fontSize: '20px',
    color: '#ffffff'
  })
  label.setOrigin(0.5)

  container.add([bg, label])
  container.setSize(bg.width, bg.height)

  return container
}

/**
 * 应用主题到游戏场景背景
 * @param scene Phaser场景
 * @param category 分类
 * @param key 资源key
 * @returns 背景图片对象
 */
export function applyThemeBackground(
  scene: Phaser.Scene,
  category: 'scene' | 'login',
  key: string
): Phaser.GameObjects.Image | null {
  const src = getImageResource(category, key)
  if (!src) {
    console.warn(`背景资源不存在: ${category}.${key}`)
    return null
  }

  const bg = scene.add.image(scene.scale.width / 2, scene.scale.height / 2, key)
  bg.setDisplaySize(scene.scale.width, scene.scale.height)

  return bg
}
