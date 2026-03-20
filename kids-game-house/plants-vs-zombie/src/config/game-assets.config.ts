/**
 * 游戏资源配置文件
 * 
 * 配置说明：
 * - type: 资源类型 (image | audio)
 * - defaultPath: 默认资源路径（占位符）
 * - customPath: 自定义资源路径（留空则使用默认）
 * - fallback: 回退方式 (emoji | generated)
 * - emoji: 当使用 emoji 回退时的字符
 * - specs: 资源规格说明（仅供自定义时参考）
 * 
 * 自定义资源替换步骤：
 * 1. 准备符合规格的图片/音频文件
 * 2. 将文件放到 public/assets/game/ 目录下
 * 3. 修改对应资源的 customPath 为实际文件名
 * 4. 刷新游戏即可加载新资源
 */

// 植物资源
export const PLANT_ASSETS = {
  sunflower: {
    type: 'image',
    defaultPath: 'assets/game/plants/sunflower.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🌻',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '向日葵'
    }
  },
  peashooter: {
    type: 'image',
    defaultPath: 'assets/game/plants/peashooter.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🌱',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '豌豆射手'
    }
  },
  wallnut: {
    type: 'image',
    defaultPath: 'assets/game/plants/wallnut.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🥔',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '坚果墙'
    }
  },
  cherrybomb: {
    type: 'image',
    defaultPath: 'assets/game/plants/cherrybomb.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🍒',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '樱桃炸弹'
    }
  },
  snowpea: {
    type: 'image',
    defaultPath: 'assets/game/plants/snowpea.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '❄️',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '寒冰射手'
    }
  }
} as const

// 僵尸资源
export const ZOMBIE_ASSETS = {
  normal: {
    type: 'image',
    defaultPath: 'assets/game/zombies/zombie-normal.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🧟',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '普通僵尸'
    }
  },
  cone: {
    type: 'image',
    defaultPath: 'assets/game/zombies/zombie-cone.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🧟',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '路障僵尸'
    }
  },
  bucket: {
    type: 'image',
    defaultPath: 'assets/game/zombies/zombie-bucket.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🧟',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '铁桶僵尸'
    }
  },
  imp: {
    type: 'image',
    defaultPath: 'assets/game/zombies/zombie-imp.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '👶',
    specs: {
      size: '64x64 像素',
      format: 'PNG 透明背景',
      name: '小僵尸'
    }
  }
} as const

// 子弹资源
export const PROJECTILE_ASSETS = {
  pea: {
    type: 'image',
    defaultPath: 'assets/game/projectiles/pea.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '🟢',
    specs: {
      size: '16x16 像素',
      format: 'PNG 透明背景',
      name: '豌豆'
    }
  },
  snowpea: {
    type: 'image',
    defaultPath: 'assets/game/projectiles/snowpea.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '❄️',
    specs: {
      size: '16x16 像素',
      format: 'PNG 透明背景',
      name: '冰豌豆'
    }
  }
} as const

// 阳光资源
export const SUN_ASSETS = {
  sun: {
    type: 'image',
    defaultPath: 'assets/game/sun.png',
    customPath: '',
    fallback: 'emoji',
    emoji: '☀️',
    specs: {
      size: '48x48 像素',
      format: 'PNG 透明背景',
      name: '阳光'
    }
  }
} as const

// UI 资源
export const UI_ASSETS = {
  background: {
    type: 'image',
    defaultPath: 'assets/game/ui/background.png',
    customPath: '',
    fallback: 'color',
    color: '#1a472a',
    specs: {
      size: '1920x1080 像素',
      format: 'JPG 或 PNG',
      name: '游戏背景图'
    }
  },
  cardBackground: {
    type: 'image',
    defaultPath: 'assets/game/ui/card-bg.png',
    customPath: '',
    fallback: 'color',
    color: '#2d5a3d',
    specs: {
      size: '80x100 像素',
      format: 'PNG 圆角',
      name: '植物卡牌背景'
    }
  },
  lawn: {
    type: 'image',
    defaultPath: 'assets/game/ui/lawn.png',
    customPath: '',
    fallback: 'color',
    color: '#1a472a',
    specs: {
      size: '720x480 像素',
      format: 'PNG',
      name: '草地背景'
    }
  }
} as const

// 音效资源
export const AUDIO_ASSETS = {
  shoot: {
    type: 'audio',
    defaultPath: 'assets/game/audio/shoot.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 1秒',
      name: '射击音效'
    }
  },
  plant: {
    type: 'audio',
    defaultPath: 'assets/game/audio/plant.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 1秒',
      name: '种植音效'
    }
  },
  sunCollect: {
    type: 'audio',
    defaultPath: 'assets/game/audio/sun-collect.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 1秒',
      name: '收集阳光音效'
    }
  },
  zombieEat: {
    type: 'audio',
    defaultPath: 'assets/game/audio/zombie-eat.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 1秒',
      name: '僵尸吃植物音效'
    }
  },
  zombieDie: {
    type: 'audio',
    defaultPath: 'assets/game/audio/zombie-die.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 2秒',
      name: '僵尸死亡音效'
    }
  },
  cherrybomb: {
    type: 'audio',
    defaultPath: 'assets/game/audio/explosion.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '< 1秒',
      name: '樱桃炸弹爆炸音效'
    }
  },
  gameOver: {
    type: 'audio',
    defaultPath: 'assets/game/audio/game-over.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3 或 WAV',
      duration: '3-5秒',
      name: '游戏结束音效'
    }
  },
  bgm: {
    type: 'audio',
    defaultPath: 'assets/game/audio/bgm.mp3',
    customPath: '',
    fallback: 'none',
    specs: {
      format: 'MP3',
      duration: '30-60秒（循环）',
      name: '背景音乐'
    }
  }
} as const

// 资源映射表
export const ASSET_MAP = {
  plants: PLANT_ASSETS,
  zombies: ZOMBIE_ASSETS,
  projectiles: PROJECTILE_ASSETS,
  suns: SUN_ASSETS,
  ui: UI_ASSETS,
  audio: AUDIO_ASSETS
} as const

// 获取资源实际路径
export function getAssetPath(category: keyof typeof ASSET_MAP, key: string): string {
  const assets = ASSET_MAP[category] as Record<string, any>
  if (!assets[key]) return ''
  
  const config = assets[key]
  // 如果有自定义路径则使用自定义路径，否则使用默认路径
  return config.customPath || config.defaultPath
}

// 判断是否使用回退
export function useFallback(category: keyof typeof ASSET_MAP, key: string): boolean {
  const assets = ASSET_MAP[category] as Record<string, any>
  if (!assets[key]) return true
  
  const config = assets[key]
  // 如果没有自定义路径，使用回退
  return !config.customPath
}
