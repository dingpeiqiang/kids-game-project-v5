<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="show" class="kid-unified-modal-overlay" @click="handleOverlayClick">
        <Transition name="modal">
          <div 
            v-if="show" 
            class="kid-unified-modal" 
            :class="[`type-${type}`, `size-${size}`]"
            :style="customStyle"
            @click.stop
          >
            <!-- 关闭按钮 -->
            <button v-if="closable" class="modal-close-btn" @click="handleClose">
              <span>×</span>
            </button>

            <!-- 装饰元素 -->
            <div v-if="showDecorations" class="modal-decorations">
              <span class="decoration decoration-1">✨</span>
              <span class="decoration decoration-2">🌟</span>
              <span class="decoration decoration-3">💫</span>
            </div>

            <!-- 头部图标/表情 -->
            <div v-if="resolvedIcon" class="modal-icon-wrapper">
              <div class="modal-icon">
                {{ resolvedIcon }}
              </div>
            </div>

            <!-- 标题 -->
            <h2 v-if="title" class="modal-title">{{ title }}</h2>

            <!-- 副标题/描述 -->
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>

            <!-- 内容区域 -->
            <div class="modal-content" :style="contentMaxHeight">
              <slot>
                <!-- 默认显示统计数据 -->
                <div v-if="stats && stats.length > 0" class="modal-stats">
                  <div
                    v-for="(stat, index) in stats"
                    :key="index"
                    class="stat-item"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <span class="stat-label">{{ stat.label }}</span>
                    <span class="stat-value">{{ stat.value }}</span>
                  </div>
                </div>
              </slot>
            </div>

            <!-- 操作按钮 -->
            <div v-if="shouldShowActions" class="modal-actions" :class="[`layout-${actionsLayout}`]">
              <slot name="actions">
                <slot name="footer">
                  <button
                    v-if="showCancel && !hasActions"
                    class="modal-action variant-secondary"
                    @click="handleCancel"
                  >
                    {{ cancelText }}
                  </button>
                  <button
                    v-if="showConfirm && !hasActions"
                    class="modal-action"
                    :class="`variant-${confirmVariant}`"
                    @click="handleConfirm"
                  >
                    {{ confirmText }}
                  </button>
                </slot>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted, type CSSProperties } from 'vue';

/**
 * 统计数据接口
 */
export interface Stat {
  label: string;
  value: string | number;
}

/**
 * 操作按钮接口
 */
export interface Action {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  onClick: () => void;
}

/**
 * Props 定义
 */
interface Props {
  /** 是否显示弹窗 */
  show: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 弹窗类型 */
  type?: 'info' | 'success' | 'warning' | 'error' | 'question' | 'result' | 'reward' | 'levelup' | 'gameover';
  /** 自定义图标 Emoji，不传则根据 type 自动匹配 */
  icon?: string;
  /** 弹窗尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义宽度（优先级高于 size） */
  width?: string;
  /** 统计数据（用于游戏结算等场景） */
  stats?: Stat[];
  /** 操作按钮列表 */
  actions?: Action[];
  /** 按钮布局方式 */
  actionsLayout?: 'horizontal' | 'vertical';
  /** 点击遮罩是否关闭 */
  closeOnClickOverlay?: boolean;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 是否显示装饰元素 */
  showDecorations?: boolean;
  /** 是否显示底部按钮区域（使用默认按钮） */
  showFooter?: boolean;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否显示确认按钮 */
  showConfirm?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 确认按钮样式 */
  confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
  /** 内容区域最大高度 */
  contentMaxHeight?: string;
  /** 自定义样式 */
  style?: CSSProperties;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  size: 'md',
  stats: () => [],
  actions: () => [],
  actionsLayout: 'vertical',
  closeOnClickOverlay: false,
  closable: false,
  showDecorations: true,
  showFooter: false,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmVariant: 'primary',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  close: [];
}>();

// 根据 type 自动推导图标，优先使用 icon prop
const resolvedIcon = computed(() => {
  if (props.icon !== undefined) return props.icon;
  
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    question: '🤔',
    result: '🎯',
    reward: '🎁',
    levelup: '⬆️',
    gameover: '😢',
  };
  
  return icons[props.type] ?? '';
});

// 判断是否有操作按钮
const hasActions = computed(() => {
  return props.actions && props.actions.length > 0;
});

// 判断是否显示按钮区域（只要有取消或确认按钮就显示）
const shouldShowActions = computed(() => {
  return hasActions.value || props.showFooter || props.showCancel || props.showConfirm;
});

// 计算尺寸对应的 max-width
const sizeMap: Record<string, string> = {
  sm: '380px',
  md: '500px',
  lg: '650px',
  xl: '800px',
};

const customStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.width) {
    style.maxWidth = props.width;
  } else {
    style.maxWidth = sizeMap[props.size];
  }
  return style;
});

const contentMaxHeight = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.contentMaxHeight) {
    style.maxHeight = props.contentMaxHeight;
    style.overflowY = 'auto';
  }
  return style;
});

// 处理遮罩点击
function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
}

// 关闭按钮处理
function handleClose() {
  emit('update:show', false);
  emit('close');
}

// 取消按钮处理
function handleCancel() {
  emit('cancel');
  emit('update:show', false);
}

// 确认按钮处理
function handleConfirm() {
  emit('confirm');
}

// ESC 键关闭逻辑
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.keyCode === 27) {
    // 如果有取消按钮（通常是第一个），则触发取消
    if (props.actions && props.actions.length > 0) {
      props.actions[0].onClick();
    } else if (props.showCancel) {
      handleCancel();
    } else {
      handleClose();
    }
  }
}

// 监听 show 状态，管理 body 滚动和键盘事件
watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscapeKey);
  }
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<style scoped lang="scss">
.kid-unified-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 215, 0, 0.25),
    rgba(147, 112, 219, 0.2),
    rgba(255, 105, 180, 0.15)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: overlayGlow 0.5s ease-out;
}

@keyframes overlayGlow {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(10px);
  }
}

.kid-unified-modal {
  background: linear-gradient(135deg, #ffffff 0%, #f8f4ff 50%, #fff5f8 100%);
  border: 2px solid rgba(147, 112, 219, 0.2);
  border-radius: 28px;
  padding: 1.75rem 2rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 60px rgba(147, 112, 219, 0.25),
    0 0 60px rgba(255, 182, 193, 0.15),
    inset 0 0 30px rgba(255, 255, 255, 0.5);
  will-change: transform, opacity;
  position: relative;
  overflow-x: hidden;
}

// 关闭按钮
.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #666;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: rotate(90deg);
  }
}

// 装饰元素
.modal-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  overflow: hidden;
  height: 40px;
  
  .decoration {
    position: absolute;
    font-size: 24px;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  }
  
  .decoration-1 {
    left: 20px;
    top: -8px;
    animation-delay: 0s;
  }
  
  .decoration-2 {
    left: 50%;
    top: -12px;
    transform: translateX(-50%);
    animation-delay: 0.5s;
    font-size: 28px;
  }
  
  .decoration-3 {
    right: 20px;
    top: -8px;
    animation-delay: 1s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(10deg);
  }
}

// 图标包装器
.modal-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
}

.modal-icon {
  font-size: 4rem;
  text-align: center;
  animation: celebrateBounce 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -12px;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent);
    border-radius: 50%;
    animation: iconRadiance 2s ease-in-out infinite;
  }
}

@keyframes celebrateBounce {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-30deg);
  }
  50% {
    transform: scale(1.25) rotate(10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes iconRadiance {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}

// 标题
.modal-title {
  margin: 0 0 0.75rem 0;
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ff69b4 0%, #ffd700 25%, #00bfff 50%, #ff1493 75%, #ff69b4 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  letter-spacing: 1px;
  animation: gradientFlow 3s ease-in-out infinite;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@keyframes gradientFlow {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

// 副标题
.modal-subtitle {
  margin: 0 0 1.25rem 0;
  font-size: 1rem;
  text-align: center;
  color: #666;
  font-weight: 600;
  background: linear-gradient(180deg, rgba(255, 105, 180, 0.1), rgba(0, 191, 255, 0.1));
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px dashed rgba(147, 112, 219, 0.2);
  line-height: 1.6;
}

// 内容区域
.modal-content {
  margin-bottom: 1.25rem;
  min-height: 20px;
}

// 统计数据
.modal-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, 
    rgba(255, 217, 102, 0.15) 0%, 
    rgba(102, 126, 234, 0.15) 50%, 
    rgba(255, 105, 180, 0.15) 100%);
  border: 2px dashed rgba(147, 112, 219, 0.3);
  border-radius: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  animation: statPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) backwards;
}

@keyframes statPop {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 8px rgba(102, 126, 234, 0.3));
}

// 操作按钮
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 1.5rem;
}

.modal-actions.layout-vertical {
  flex-direction: column;
}

.modal-actions.layout-horizontal {
  justify-content: center;
  flex-wrap: wrap;
}

.modal-action {
  flex: 1;
  min-width: 120px;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
}

.modal-action:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.modal-action:active {
  transform: translateY(-1px) scale(0.98);
}

// 按钮变体
.modal-action.variant-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-action.variant-secondary {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #333;
}

.modal-action.variant-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.modal-action.variant-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.modal-action.variant-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

// 类型特定样式
.kid-unified-modal.type-info .modal-title { 
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-success .modal-title { 
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-warning .modal-title { 
  background: linear-gradient(135deg, #f59e0b, #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-error .modal-title { 
  background: linear-gradient(135deg, #ef4444, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-question .modal-title { 
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-result .modal-title { 
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-reward .modal-title { 
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-levelup .modal-title { 
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kid-unified-modal.type-gameover .modal-title { 
  background: linear-gradient(135deg, #6b7280, #4b5563);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// 遮罩过渡
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

// 弹窗过渡
.modal-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.4s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: translateY(-80px) scale(0.7) rotate(-15deg);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.85) rotate(5deg);
}

// 响应式设计
@media (max-width: 768px) {
  .kid-unified-modal {
    padding: 1.5rem;
    max-width: 100%;
    
    .modal-decorations .decoration {
      font-size: 18px;
    }
  }

  .modal-icon { 
    font-size: 3.5rem;
  }
  
  .modal-title { 
    font-size: 1.75rem; 
    margin-bottom: 0.5rem;
  }
  
  .modal-subtitle { 
    font-size: 0.95rem;
    padding: 10px 14px;
    margin-bottom: 1rem;
  }

  .modal-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .stat-value { 
    font-size: 1.4rem; 
  }

  .modal-actions.layout-horizontal {
    flex-direction: column;
  }
  
  .modal-action {
    min-width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .kid-unified-modal {
    border-width: 2px;
    padding: 1.25rem;
  }
  
  .modal-icon { 
    font-size: 3rem; 
    margin-bottom: 0.75rem;
  }
  
  .modal-title { 
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .modal-subtitle {
    font-size: 0.9rem;
    padding: 8px 12px;
    margin-bottom: 0.875rem;
  }
  
  .modal-action {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
}

// 滚动条美化
.kid-unified-modal::-webkit-scrollbar {
  width: 8px;
}

.kid-unified-modal::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.kid-unified-modal::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff69b4, #ffd700);
  border-radius: 10px;
}

.kid-unified-modal::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff1493, #ff69b4);
}
</style>
