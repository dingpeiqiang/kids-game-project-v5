// ===== 核心基础组件 =====
export { default as KidButton } from './KidButton.vue';
export { default as KidLoading } from './KidLoading.vue';
export { default as KidToast } from './KidToast.vue';
export { default as BannerSlider } from './BannerSlider.vue';
export { default as SearchBox } from './SearchBox.vue';

// ===== 统一弹窗组件 =====
/**
 * KidUnifiedModalV2 - 项目唯一的统一弹窗组件
 * 
 * 功能：
 * - 支持多种类型：info/success/warning/error/question/result/reward/levelup/gameover
 * - 支持 4 种尺寸：sm/md/lg/xl
 * - 支持统计数据展示
 * - 支持自定义按钮和布局
 * - 完整的动画和过渡效果
 * 
 * 使用方式：
 * 1. 组件方式：<KidUnifiedModalV2 show title="提示" />
 * 2. 编程式：import { dialog, confirm } from '@/composables/useDialog'
 */
export { default as KidUnifiedModalV2 } from './KidUnifiedModalV2.vue';

/**
 * KidModal - KidUnifiedModalV2 的包装器，提供向后兼容
 * @deprecated 建议直接使用 KidUnifiedModalV2
 */
export { default as KidModal } from './KidModal.vue';

// ===== 特定用途弹窗（基于 KidUnifiedModalV2） =====
/** 游戏表单弹窗 */
export { default as GameFormModal } from './GameFormModal.vue';

// ===== 排行榜组件 =====
export { default as LeaderboardPanel } from './LeaderboardPanel.vue';
export { default as LeaderboardModal } from './LeaderboardModal.vue';
