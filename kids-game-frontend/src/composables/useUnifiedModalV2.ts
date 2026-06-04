import { createApp, ref, h, type App, type VNode, type CSSProperties } from 'vue';
import KidUnifiedModalV2, { type Stat, type Action } from '@/components/ui/KidUnifiedModalV2.vue';

// ===== 类型定义 =====

/**
 * 弹窗选项接口
 */
export interface UnifiedModalV2Options {
  title?: string;
  subtitle?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'question' | 'result' | 'reward' | 'levelup' | 'gameover';
  icon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  width?: string;
  stats?: Stat[];
  actions?: Action[];
  actionsLayout?: 'horizontal' | 'vertical';
  closeOnClickOverlay?: boolean;
  closable?: boolean;
  showDecorations?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
  contentMaxHeight?: string;
  style?: CSSProperties;
  /** 自定义内容（使用插槽） */
  content?: VNode | string;
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

// ===== useUnifiedModalV2：统一弹窗 =====

/**
 * 编程式弹出统一弹窗
 * 
 * @example
 * // 简单提示
 * await showUnifiedModalV2({ message: '操作成功！', type: 'success' });
 * 
 * @example
 * // 确认框
 * const confirmed = await showUnifiedModalV2({
 *   title: '确认删除',
 *   message: '确定要删除这个项目吗？',
 *   type: 'question',
 *   actions: [
 *     { text: '取消', variant: 'secondary', onClick: () => resolve(false) },
 *     { text: '删除', variant: 'danger', onClick: () => resolve(true) }
 *   ]
 * });
 * 
 * @example
 * // 游戏结算
 * showUnifiedModalV2({
 *   title: '游戏结束',
 *   type: 'result',
 *   stats: [
 *     { label: '得分', value: 1500 },
 *     { label: '连击', value: 25 },
 *     { label: '时间', value: '2:30' }
 *   ],
 *   actions: [
 *     { text: '再来一局', variant: 'primary', onClick: () => restart() },
 *     { text: '返回首页', variant: 'secondary', onClick: () => goHome() }
 *   ]
 * });
 */
export function showUnifiedModalV2(options: UnifiedModalV2Options | string): Promise<any> {
  const opts: UnifiedModalV2Options = typeof options === 'string'
    ? { message: options, type: 'info' }
    : options;

  return new Promise((resolve) => {
    const show = ref(true);

    const cleanup = (result?: any) => {
      show.value = false;
      setTimeout(() => {
        unmountComponent(instance.app, instance.el);
        resolve(result);
      }, 400); // 等待关闭动画
    };

    // 处理默认插槽内容
    const defaultSlot = opts.content 
      ? () => typeof opts.content === 'string' 
        ? h('div', { innerHTML: opts.content })
        : opts.content
      : undefined;

    const vnode = h(KidUnifiedModalV2, {
      show: show.value,
      title: opts.title,
      subtitle: opts.subtitle,
      type: opts.type ?? 'info',
      icon: opts.icon,
      size: opts.size ?? 'md',
      width: opts.width,
      stats: opts.stats ?? [],
      actions: opts.actions ?? [],
      actionsLayout: opts.actionsLayout ?? 'vertical',
      closeOnClickOverlay: opts.closeOnClickOverlay ?? false,
      closable: opts.closable ?? false,
      showDecorations: opts.showDecorations ?? true,
      showFooter: opts.showFooter ?? false,
      showCancel: opts.showCancel ?? true,
      showConfirm: opts.showConfirm ?? true,
      cancelText: opts.cancelText ?? '取消',
      confirmText: opts.confirmText ?? '确定',
      confirmVariant: opts.confirmVariant ?? 'primary',
      contentMaxHeight: opts.contentMaxHeight,
      style: opts.style,
      'onUpdate:show': (val: boolean) => { 
        show.value = val;
        if (!val) cleanup();
      },
      onClose: () => cleanup(),
      onCancel: () => cleanup(false),
      onConfirm: () => cleanup(true),
    }, {
      default: defaultSlot,
    });

    const instance = mountComponent(vnode);
  });
}

// ===== 便捷别名 =====

/**
 * 信息提示
 * @example await modal.info('这是一个提示信息')
 */
export const modal = {
  /** 信息提示 */
  info: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>>) =>
    showUnifiedModalV2({ message, type: 'info', ...opts }),
  
  /** 成功提示 */
  success: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>>) =>
    showUnifiedModalV2({ message, type: 'success', ...opts }),
  
  /** 警告提示 */
  warning: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>>) =>
    showUnifiedModalV2({ message, type: 'warning', ...opts }),
  
  /** 错误提示 */
  error: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>>) =>
    showUnifiedModalV2({ message, type: 'error', ...opts }),
  
  /** 问题确认框（返回 Promise<boolean>） */
  question: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>> & { confirmText?: string; cancelText?: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      showUnifiedModalV2({
        message,
        type: 'question',
        title: opts?.title ?? '确认',
        actions: [
          { 
            text: opts?.cancelText ?? '取消', 
            variant: 'secondary', 
            onClick: () => resolve(false) 
          },
          { 
            text: opts?.confirmText ?? '确定', 
            variant: 'primary', 
            onClick: () => resolve(true) 
          },
        ],
        ...opts,
      });
    });
  },
  
  /** 危险操作确认（返回 Promise<boolean>） */
  danger: (message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'type'>> & { confirmText?: string; cancelText?: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      showUnifiedModalV2({
        message,
        type: 'warning',
        title: opts?.title ?? '危险操作',
        actions: [
          { 
            text: opts?.cancelText ?? '取消', 
            variant: 'secondary', 
            onClick: () => resolve(false) 
          },
          { 
            text: opts?.confirmText ?? '确定', 
            variant: 'danger', 
            onClick: () => resolve(true) 
          },
        ],
        ...opts,
      });
    });
  },
  
  /** 游戏结算弹窗 */
  result: (title: string, stats: Stat[], opts?: Partial<Omit<UnifiedModalV2Options, 'title' | 'stats' | 'type'>>) =>
    showUnifiedModalV2({ title, stats, type: 'result', ...opts }),
  
  /** 奖励弹窗 */
  reward: (title: string, message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'title' | 'type'>>) =>
    showUnifiedModalV2({ title, subtitle: message, type: 'reward', ...opts }),
  
  /** 升级弹窗 */
  levelup: (title: string, message: string, opts?: Partial<Omit<UnifiedModalV2Options, 'message' | 'title' | 'type'>>) =>
    showUnifiedModalV2({ title, subtitle: message, type: 'levelup', ...opts }),
  
  /** 游戏结束弹窗 */
  gameover: (title: string, stats: Stat[], opts?: Partial<Omit<UnifiedModalV2Options, 'title' | 'stats' | 'type'>>) =>
    showUnifiedModalV2({ title, stats, type: 'gameover', ...opts }),
};

// ===== 导出默认函数 =====

export default showUnifiedModalV2;
