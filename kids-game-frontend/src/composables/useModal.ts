import { ref, watch, onUnmounted, type Ref } from 'vue';

/**
 * 弹窗通用 Composable
 * 提供弹窗的通用功能：ESC监听、body滚动锁定、生命周期管理
 */
export interface UseModalOptions {
  show: Ref<boolean>;
  onClose?: () => void;
  lockBodyScroll?: boolean;
  closeOnEscape?: boolean;
}

export function useModal(options: UseModalOptions) {
  const {
    show,
    onClose,
    lockBodyScroll = true,
    closeOnEscape = true
  } = options;

  /**
   * 处理ESC键关闭弹窗
   */
  function handleEscapeKey(event: KeyboardEvent) {
    if (closeOnEscape && (event.key === 'Escape' || event.keyCode === 27)) {
      if (onClose) {
        onClose();
      } else {
        show.value = false;
      }
    }
  }

  /**
   * 锁定body滚动
   */
  function lockScroll() {
    if (lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 解锁body滚动
   */
  function unlockScroll() {
    if (lockBodyScroll) {
      document.body.style.overflow = '';
    }
  }

  /**
   * 监听显示状态变化
   */
  watch(show, (newValue) => {
    if (newValue) {
      lockScroll();
      if (closeOnEscape) {
        document.addEventListener('keydown', handleEscapeKey);
      }
    } else {
      unlockScroll();
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleEscapeKey);
      }
    }
  });

  /**
   * 组件卸载时清理
   */
  onUnmounted(() => {
    unlockScroll();
    if (closeOnEscape) {
      document.removeEventListener('keydown', handleEscapeKey);
    }
  });

  /**
   * 手动关闭弹窗
   */
  function close() {
    if (onClose) {
      onClose();
    } else {
      show.value = false;
    }
  }

  return {
    close,
    handleEscapeKey,
    lockScroll,
    unlockScroll
  };
}
