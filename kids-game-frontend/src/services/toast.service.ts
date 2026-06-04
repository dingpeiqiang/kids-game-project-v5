/**
 * Toast 提示服务
 */
import { createApp, h, ref } from 'vue';
import KidToast from '@/components/ui/KidToast.vue';

interface ToastOptions {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'top-right' | 'bottom';
  duration?: number;
  closable?: boolean;
}

class ToastService {
  private container: HTMLElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; z-index: 2000; pointer-events: none;';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(options: ToastOptions) {
    this.ensureContainer();

    const container = this.ensureContainer();
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'pointer-events: auto;';
    container.appendChild(wrapper);

    const app = createApp({
      render() {
        return h(KidToast, {
          ...options,
          onClose: () => {
            app.unmount();
            if (wrapper.parentNode) {
              wrapper.parentNode.removeChild(wrapper);
            }
          },
        });
      },
    });

    app.mount(wrapper);
  }

  success(message: string, duration = 3000) {
    this.show({
      message,
      variant: 'success',
      duration,
    });
  }

  error(message: string, duration = 3000) {
    this.show({
      message,
      variant: 'error',
      duration,
    });
  }

  warning(message: string, duration = 3000) {
    this.show({
      message,
      variant: 'warning',
      duration,
    });
  }

  info(message: string, duration = 3000) {
    this.show({
      message,
      variant: 'info',
      duration,
    });
  }
}

export const toast = new ToastService();
export default toast;
export { ToastService };
