/**
 * 组件统一导出
 */

// ===== UI 基础组件 =====
export { default as KidButton } from './ui/KidButton.vue';
export { default as KidLoading } from './ui/KidLoading.vue';
export { default as KidToast } from './ui/KidToast.vue';
export { default as BannerSlider } from './ui/BannerSlider.vue';
export { default as SearchBox } from './ui/SearchBox.vue';

// ===== 弹窗组件 =====
/**
 * KidUnifiedModalV2 - 项目唯一的统一弹窗组件
 * 
 * 功能：
 * - 支持多种类型：info/success/warning/error/question/result/reward/levelup/gameover
 * - 支持 4 种尺寸：sm/md/lg/xl
 * - 支持统计数据展示
 * - 支持自定义按钮和布局
 * 
 * 使用方式：
 * 1. 组件方式：<KidUnifiedModalV2 show title="提示" />
 * 2. 编程式：import { dialog, confirm } from '@/composables/useDialog'
 */
export { default as KidModal } from './ui/KidModal.vue';
export { default as KidUnifiedModalV2 } from './ui/KidUnifiedModalV2.vue';

// ===== 游戏组件 =====
export { default as ScorePanel } from './game/ScorePanel.vue';
export { default as PointsPopup } from './game/PointsPopup.vue';
export { default as UnifiedGameCard } from './game/UnifiedGameCard.vue';
export { default as GameCard } from './game/GameCard.vue';
export { default as GameListSection } from './game/GameListSection.vue';
