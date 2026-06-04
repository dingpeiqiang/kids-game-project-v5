/**
 * 版本管理工具
 * 用于检测新版本并提示用户刷新
 */

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
}

class VersionManager {
  private currentVersion: string | null = null;
  private checkInterval: number = 5 * 60 * 1000; // 5分钟检查一次
  private timer: number | null = null;

  /**
   * 初始化版本管理器
   */
  async init(): Promise<void> {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (response.ok) {
        const versionInfo: VersionInfo = await response.json();
        this.currentVersion = versionInfo.version;
        console.log(`[版本] 当前版本: ${this.currentVersion}`);
        
        // 启动定期检查
        this.startPeriodicCheck();
      }
    } catch (error) {
      console.warn('[版本] 无法获取版本信息:', error);
    }
  }

  /**
   * 检查是否有新版本
   */
  async checkForUpdate(): Promise<boolean> {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (response.ok) {
        const versionInfo: VersionInfo = await response.json();
        
        if (this.currentVersion && versionInfo.version !== this.currentVersion) {
          console.log(`[版本] 发现新版本: ${versionInfo.version} (当前: ${this.currentVersion})`);
          this.showUpdateNotification(versionInfo.version);
          return true;
        }
      }
    } catch (error) {
      console.warn('[版本] 检查更新失败:', error);
    }
    
    return false;
  }

  /**
   * 显示更新提示
   */
  private showUpdateNotification(newVersion: string): void {
    // 使用 Element Plus 的消息提示
    if (typeof window !== 'undefined' && (window as any).ElMessage) {
      (window as any).ElMessage({
        message: `发现新版本！请刷新页面以获取最新功能`,
        type: 'info',
        duration: 0, // 不自动关闭
        showClose: true,
        onClose: () => {
          // 用户关闭提示后，可以选择刷新
          if (confirm('是否立即刷新页面？')) {
            window.location.reload();
          }
        }
      });
    } else {
      // 降级方案：使用原生 alert
      if (confirm(`发现新版本！\n\n是否立即刷新页面？`)) {
        window.location.reload();
      }
    }
  }

  /**
   * 启动定期检查
   */
  private startPeriodicCheck(): void {
    this.timer = window.setInterval(() => {
      this.checkForUpdate();
    }, this.checkInterval);
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 获取当前版本
   */
  getVersion(): string | null {
    return this.currentVersion;
  }
}

// 导出单例
export const versionManager = new VersionManager();
