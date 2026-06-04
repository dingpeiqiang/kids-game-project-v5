import { createApp, ref, h, type App, type VNode } from 'vue';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';

// ===== 类型定义 =====

export interface DialogOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'question';
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning';
}

// ===== 挂载辅助函数 =====

/**
 * 将 VNode 挂载到 body，并返回卸载函数
 */
function mountComponent(vnode: VNode): { app: App; el: HTMLElement } {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const app = createApp({ render: () => vnode });
  app.mount(el);
  return { app, el };
}

function unmountComponent(app: App, el: HTMLElement) {
  app.unmount();
  document.body.removeChild(el);
}

// ===== useDialog：Alert 提示 =====

/**
 * 编程式弹出提示框（仅有确认按钮）
 * 
 * @example
 * await useDialog({ message: '操作成功！', type: 'success' });
 * // 用户点击确定后 Promise resolve
 */
export function useDialog(options: DialogOptions | string): Promise<void> {
  const opts: DialogOptions = typeof options === 'string'
    ? { message: options }
    : options;

  return new Promise((resolve) => {
    const show = ref(true);

    const vnode = h(KidUnifiedModalV2, {
      show: show.value,
      title: opts.title ?? '提示',
      type: opts.type ?? 'info',
      icon: opts.icon,
      confirmText: opts.confirmText ?? '确定',
      showCancel: false,
      showFooter: true,
      'onUpdate:show': (val: boolean) => { show.value = val; },
      onConfirm: () => {
        show.value = false;
        setTimeout(() => {
          unmountComponent(instance.app, instance.el);
          resolve();
        }, 300); // 等待关闭动画
      },
      onClose: () => {
        show.value = false;
        setTimeout(() => {
          unmountComponent(instance.app, instance.el);
          resolve();
        }, 300);
      },
    });

    const instance = mountComponent(vnode);
  });
}

// ===== useConfirm：Confirm 确认框 =====

/**
 * 编程式弹出确认框，返回 true（确认）或 false（取消）
 * 
 * @example
 * const confirmed = await useConfirm({ message: '确定要删除吗？', confirmVariant: 'danger' });
 * if (confirmed) { ... }
 */
export function useConfirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions = typeof options === 'string'
    ? { message: options }
    : options;

  return new Promise((resolve) => {
    const show = ref(true);

    const cleanup = (result: boolean) => {
      show.value = false;
      setTimeout(() => {
        unmountComponent(instance.app, instance.el);
        resolve(result);
      }, 300);
    };

    const vnode = h(KidUnifiedModalV2, {
      show: show.value,
      title: opts.title ?? '确认',
      type: opts.type ?? 'question',
      icon: opts.icon,
      confirmText: opts.confirmText ?? '确定',
      cancelText: opts.cancelText ?? '取消',
      confirmVariant: opts.confirmVariant ?? 'primary',
      showCancel: true,
      showFooter: true,
      'onUpdate:show': (val: boolean) => { show.value = val; },
      onConfirm: () => cleanup(true),
      onCancel: () => cleanup(false),
      onClose: () => cleanup(false),
    });

    const instance = mountComponent(vnode);
  });
}

// ===== 便捷别名 =====

/**
 * 成功提示
 * @example await dialog.success('保存成功！')
 */
export const dialog = {
  info: (message: string, opts?: Partial<DialogOptions>) =>
    useDialog({ message, type: 'info', ...opts }),
  success: (message: string, opts?: Partial<DialogOptions>) =>
    useDialog({ message, type: 'success', ...opts }),
  warning: (message: string, opts?: Partial<DialogOptions>) =>
    useDialog({ message, type: 'warning', ...opts }),
  error: (message: string, opts?: Partial<DialogOptions>) =>
    useDialog({ message, type: 'error', ...opts }),
};

/**
 * 便捷确认框
 * @example const ok = await confirm.danger('确定删除？')
 */
export const confirm = {
  /** 普通确认 */
  show: (message: string, opts?: Partial<ConfirmOptions>) =>
    useConfirm({ message, ...opts }),
  /** 危险操作确认（确认按钮为红色） */
  danger: (message: string, opts?: Partial<ConfirmOptions>) =>
    useConfirm({ message, confirmVariant: 'danger', type: 'warning', ...opts }),
  /** 警告操作确认 */
  warning: (message: string, opts?: Partial<ConfirmOptions>) =>
    useConfirm({ message, confirmVariant: 'primary', type: 'warning', ...opts }),
};
