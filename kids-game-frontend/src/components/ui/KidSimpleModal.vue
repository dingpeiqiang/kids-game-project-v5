<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
        <Transition name="modal-scale">
          <div v-if="modelValue" class="modal-container" @click.stop>
            <!-- 头部 -->
            <div class="modal-header">
              <h3 class="modal-title">{{ title }}</h3>
              <button v-if="closable" class="close-btn" @click="handleClose">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- 内容 -->
            <div class="modal-body">
              <div v-if="icon" class="modal-icon">{{ icon }}</div>
              <p v-if="message" class="modal-message">{{ message }}</p>
              <slot></slot>
            </div>

            <!-- 底部按钮 -->
            <div v-if="showFooter" class="modal-footer">
              <button 
                v-if="showCancel" 
                class="btn btn-secondary" 
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button 
                v-if="showConfirm" 
                class="btn" 
                :class="`btn-${confirmType}`"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  icon?: string;
  closable?: boolean;
  closeOnClickOverlay?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmType?: 'primary' | 'danger' | 'success';
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  closable: true,
  closeOnClickOverlay: true,
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmType: 'primary',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  cancel: [];
  confirm: [];
}>();

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
}

function handleClose() {
  emit('update:modelValue', false);
}

function handleCancel() {
  emit('cancel');
  handleClose();
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #4b5563;
  }
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
  line-height: 1;
}

.modal-message {
  margin: 0;
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #f0f0f0;
}

.btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary {
  background: #6366f1;
  color: white;

  &:hover {
    background: #4f46e5;
  }

  &:active {
    background: #4338ca;
  }
}

.btn-danger {
  background: #ef4444;
  color: white;

  &:hover {
    background: #dc2626;
  }

  &:active {
    background: #b91c1c;
  }
}

.btn-success {
  background: #10b981;
  color: white;

  &:hover {
    background: #059669;
  }

  &:active {
    background: #047857;
  }
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:active {
    background: #f3f4f6;
  }
}

// 动画
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.2s;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

// 响应式
@media (max-width: 480px) {
  .modal-container {
    max-width: 100%;
    margin: 10px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 12px 20px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-message {
    font-size: 14px;
  }

  .btn {
    height: 36px;
    font-size: 14px;
  }
}
</style>
