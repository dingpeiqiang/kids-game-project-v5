/**
 * Toast 编程式调用
 * 提供 showSuccess/showError/showWarning/showInfo 等便捷方法
 */

interface ToastMessage {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'top-right' | 'bottom';
}

let toastId = 0;

/**
 * 创建 Toast 元素
 */
function createToastElement(options: ToastMessage): HTMLElement {
  const id = `toast-${++toastId}`;
  const { message, variant = 'info', duration = 3000 } = options;
  
  // 创建容器（如果不存在）
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  // 创建 Toast 元素
  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 90vw;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  // 设置颜色
  const colors: Record<string, string> = {
    success: 'background: linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%); color: white;',
    error: 'background: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%); color: white;',
    warning: 'background: linear-gradient(135deg, #FFE66D 0%, #FFB347 100%); color: #333;',
    info: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;',
  };
  toast.style.cssText += colors[variant];
  
  // 图标
  const icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  toast.innerHTML = `
    <span style="font-size: 1.3rem; flex-shrink: 0;">${icons[variant]}</span>
    <span style="flex: 1; font-size: 0.95rem; word-break: break-word;">${message}</span>
    <button style="
      background: rgba(255, 255, 255, 0.3);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      color: inherit;
      flex-shrink: 0;
    " onclick="this.parentElement.remove()">✕</button>
  `;
  
  // 添加动画样式（如果不存在）
  if (!document.getElementById('toast-animation')) {
    const style = document.createElement('style');
    style.id = 'toast-animation';
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  container.appendChild(toast);
  
  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}

/**
 * 显示 Toast
 */
function showToast(options: ToastMessage): void {
  createToastElement(options);
}

/**
 * 成功提示
 */
export function showSuccess(message: string, duration?: number): void {
  showToast({ message, variant: 'success', duration });
}

/**
 * 错误提示
 */
export function showError(message: string, duration?: number): void {
  showToast({ message, variant: 'error', duration });
}

/**
 * 警告提示
 */
export function showWarning(message: string, duration?: number): void {
  showToast({ message, variant: 'warning', duration });
}

/**
 * 信息提示
 */
export function showInfo(message: string, duration?: number): void {
  showToast({ message, variant: 'info', duration });
}

/**
 * 导出 Toast 工具对象
 */
export const toast = {
  show: showToast,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
};
