/**
 * 游戏内主题 Hook
 * 
 * 在游戏组件中使用主题的便捷方式
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ThemeConfig, ThemeAsset } from '@/config/theme.config'

export function useTheme() {
  const themeStore = useThemeStore()
  
  // 当前主题
  const theme = computed(() => themeStore.currentTheme)
  
  // 主题颜色
  const colors = computed(() => theme.value.colors)
  
  // 主题效果
  const effects = computed(() => theme.value.effects)
  
  // 资源
  const assets = computed(() => theme.value.assets)
  
  // 音效设置
  const sounds = computed(() => theme.value.sounds)
  
  // 玩家角色资源
  const playerAsset = computed(() => assets.value.player)
  
  // 敌人资源
  const enemyAsset = computed(() => assets.value.enemy)
  
  // 背景资源
  const backgroundAsset = computed(() => assets.value.background)
  
  // 主题变化监听
  let unsubscribe: (() => void) | null = null
  
  function onThemeChange(callback: (theme: ThemeConfig) => void) {
    const handler = (e: CustomEvent) => {
      callback(e.detail as ThemeConfig)
    }
    window.addEventListener('theme-changed', handler as EventListener)
    return () => {
      window.removeEventListener('theme-changed', handler as EventListener)
    }
  }
  
  // 获取资源值（支持 emoji、图片、颜色）
  function getAssetValue(asset: ThemeAsset | undefined, fallback: string = ''): string {
    if (!asset) return fallback
    return asset.value || fallback
  }
  
  // 获取资源类型
  function getAssetType(asset: ThemeAsset | undefined): 'emoji' | 'image' | 'color' {
    return asset?.type || 'emoji'
  }
  
  // 监听主题变化
  function watchTheme(callback: (theme: ThemeConfig) => void) {
    unsubscribe = onThemeChange(callback)
    // 立即调用一次
    callback(theme.value)
  }
  
  // 清理
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
  
  return {
    theme,
    colors,
    effects,
    assets,
    sounds,
    playerAsset,
    enemyAsset,
    backgroundAsset,
    getAssetValue,
    getAssetType,
    watchTheme,
    onThemeChange
  }
}

/**
 * 植物大战僵尸特定的主题 Hook
 */
export function usePvZTheme() {
  const { theme, colors, effects, getAssetValue, watchTheme } = useTheme()
  
  // 获取植物大战僵尸特定资源
  const pvzAssets = computed(() => {
    return (theme.value.gameSpecific as any)?.pvz || {}
  })
  
  // 植物资源映射
  const plantAssets = computed(() => pvzAssets.value.plants || {})
  const zombieAssets = computed(() => pvzAssets.value.zombies || {})
  const projectileAsset = computed(() => pvzAssets.value.projectile)
  const sunAsset = computed(() => pvzAssets.value.sun)
  const backgroundAsset = computed(() => pvzAssets.value.background)
  const lawnAsset = computed(() => pvzAssets.value.lawn)
  
  // 获取特定植物的 Emoji
  function getPlantEmoji(plantType: string): string {
    const plant = plantAssets.value[plantType]
    return getAssetValue(plant, '🌱')
  }
  
  // 获取特定僵尸的 Emoji
  function getZombieEmoji(zombieType: string): string {
    const zombie = zombieAssets.value[zombieType]
    return getAssetValue(zombie, '🧟')
  }
  
  // 获取子弹 Emoji
  function getProjectileEmoji(type: string = 'pea'): string {
    if (type === 'snowpea') {
      return getAssetValue(projectileAsset.value, '❄️')
    }
    return getAssetValue(projectileAsset.value, '🟢')
  }
  
  // 获取阳光 Emoji
  function getSunEmoji(): string {
    return getAssetValue(sunAsset.value, '☀️')
  }
  
  // 获取背景色
  function getBackgroundColor(): string {
    return getAssetValue(backgroundAsset.value, '#1a472a')
  }
  
  // 获取草地颜色
  function getLawnColor(): string {
    return getAssetValue(lawnAsset.value, '#2d5a3d')
  }
  
  return {
    theme,
    colors,
    effects,
    plantAssets,
    zombieAssets,
    projectileAsset,
    sunAsset,
    backgroundAsset,
    lawnAsset,
    getPlantEmoji,
    getZombieEmoji,
    getProjectileEmoji,
    getSunEmoji,
    getBackgroundColor,
    getLawnColor,
    watchTheme
  }
}

// 导入 computed
import { computed } from 'vue'
