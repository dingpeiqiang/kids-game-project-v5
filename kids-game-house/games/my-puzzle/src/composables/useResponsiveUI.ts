/**
 * useResponsiveUI - 响应式 UI 缩放工具
 *
 * 设计基准：375×667（iPhone SE）
 * 运行时根据实际屏幕计算缩放比
 *
 * @example
 * const { scale, px, fontSize } = useResponsiveUI()
 * // 将设计稿上的 24px 字体转为实际像素
 * const titleSize = fontSize(24)
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import gameConfig from '@/config/game-config.json'

const DESIGN_WIDTH = gameConfig.ui.designWidth   // 设计基准宽度
const DESIGN_HEIGHT = gameConfig.ui.designHeight  // 设计基准高度

// 全局共享的缩放比（避免多个组件重复监听）
const _scale = ref(1)

function calcScale(): number {
  const scaleW = window.innerWidth / DESIGN_WIDTH
  const scaleH = window.innerHeight / DESIGN_HEIGHT
  return Math.min(scaleW, scaleH)
}

export function useResponsiveUI() {
  function updateScale() {
    _scale.value = calcScale()
  }

  onMounted(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScale)
  })

  /** 缩放比（computed ref，自动响应式） */
  const scale = computed(() => _scale.value)

  /**
   * 将设计稿像素转为实际像素
   * @param designPx 设计稿像素值
   */
  const px = (designPx: number) => Math.round(designPx * _scale.value)

  /**
   * 将设计稿字体大小转为实际字体大小（带 px 单位字符串）
   * @param designPx 设计稿字体大小
   */
  const fontSize = (designPx: number) => `${Math.round(designPx * _scale.value)}px`

  /**
   * 将设计稿尺寸转为实际尺寸对象
   * @param w 设计稿宽度
   * @param h 设计稿高度
   */
  const size = (w: number, h: number) => ({
    width: `${Math.round(w * _scale.value)}px`,
    height: `${Math.round(h * _scale.value)}px`
  })

  return { scale, px, fontSize, size }
}
