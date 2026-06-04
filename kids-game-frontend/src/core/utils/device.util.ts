/**
 * 设备适配工具
 * 检测设备类型、屏幕适配、响应式支持
 * 从 platform 迁移到 frontend
 */

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  TV = 'tv',
}

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTV: boolean;
  isTouch: boolean;
  hasKeyboard: boolean;
  hasMouse: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

export interface GameResolution {
  width: number;
  height: number;
  scale: number;
}

class DeviceUtil {
  private deviceInfo: DeviceInfo | null = null;

  /**
   * 获取设备信息
   */
  getDeviceInfo(): DeviceInfo {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 检测设备类型
    let type: DeviceType;
    if (this.isTVDevice()) {
      type = DeviceType.TV;
    } else if (this.isTabletDevice()) {
      type = DeviceType.TABLET;
    } else if (this.isMobileDevice()) {
      type = DeviceType.MOBILE;
    } else {
      type = DeviceType.DESKTOP;
    }

    this.deviceInfo = {
      type,
      isMobile: type === DeviceType.MOBILE,
      isTablet: type === DeviceType.TABLET,
      isDesktop: type === DeviceType.DESKTOP,
      isTV: type === DeviceType.TV,
      isTouch: this.isTouchSupported(),
      hasKeyboard: this.hasKeyboardSupport(),
      hasMouse: this.hasMouseSupport(),
      orientation: width > height ? 'landscape' : 'portrait',
      screenWidth: width,
      screenHeight: height,
      pixelRatio: window.devicePixelRatio || 1,
    };

    return this.deviceInfo;
  }

  /**
   * 刷新设备信息
   */
  refreshDeviceInfo(): void {
    this.deviceInfo = null;
    this.getDeviceInfo();
  }

  /**
   * 是否为移动设备
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) &&
           !/iPad/i.test(userAgent);
  }

  /**
   * 是否为平板设备
   */
  private isTabletDevice(): boolean {
    const userAgent = navigator.userAgent;
    return /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent) ||
           (window.innerWidth >= 768 && window.innerWidth <= 1024);
  }

  /**
   * 是否为智能电视设备
   */
  private isTVDevice(): boolean {
    const userAgent = navigator.userAgent;
    return /TV|SmartTV|Internet TV|GoogleTV|WebTV/i.test(userAgent);
  }

  /**
   * 是否支持触摸
   */
  private isTouchSupported(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 是否支持键盘
   */
  private hasKeyboardSupport(): boolean {
    return !this.isMobileDevice() && !this.isTVDevice();
  }

  /**
   * 是否支持鼠标
   */
  private hasMouseSupport(): boolean {
    return 'onmousemove' in window;
  }

  /**
   * 是否需要遥控器模式
   */
  hasRemoteControl(): boolean {
    return /TV|SmartTV|Internet TV|GoogleTV|WebTV/i.test(navigator.userAgent);
  }

  /**
   * 获取最优游戏分辨率
   */
  getOptimalGameResolution(): GameResolution {
    const deviceInfo = this.getDeviceInfo();
    const { screenWidth, screenHeight, pixelRatio, type } = deviceInfo;

    let width: number;
    let height: number;
    let scale: number;

    switch (type) {
      case DeviceType.MOBILE:
        width = 375;
        height = 667;
        scale = Math.min(screenWidth / width, screenHeight / height);
        break;

      case DeviceType.TABLET:
        width = 768;
        height = 1024;
        scale = Math.min(screenWidth / width, screenHeight / height);
        break;

      case DeviceType.TV:
        width = 1280;
        height = 720;
        scale = Math.min(screenWidth / width, screenHeight / height);
        break;

      case DeviceType.DESKTOP:
      default:
        width = 1024;
        height = 768;
        scale = Math.min(screenWidth / width, screenHeight / height);
        break;
    }

    return { width, height, scale };
  }

  /**
   * 获取响应式游戏卡片尺寸
   */
  getGameCardSize(): { width: number; height: number } {
    const deviceInfo = this.getDeviceInfo();
    const { screenWidth, type } = deviceInfo;

    switch (type) {
      case DeviceType.MOBILE:
        return { width: screenWidth / 2 - 16, height: screenWidth / 2 + 32 };

      case DeviceType.TABLET:
        return { width: screenWidth / 3 - 16, height: screenWidth / 3 + 32 };

      case DeviceType.TV:
      case DeviceType.DESKTOP:
      default:
        return { width: 200, height: 240 };
    }
  }

  /**
   * 获取网格布局列数
   */
  getGridColumns(): number {
    const deviceInfo = this.getDeviceInfo();
    const { screenWidth, type } = deviceInfo;

    switch (type) {
      case DeviceType.MOBILE:
        return screenWidth < 360 ? 2 : 3;

      case DeviceType.TABLET:
        return screenWidth < 900 ? 3 : 4;

      case DeviceType.TV:
      case DeviceType.DESKTOP:
      default:
        return screenWidth < 1200 ? 4 : 5;
    }
  }

  /**
   * 获取最优字体大小
   */
  getOptimalFontSize(): number {
    const deviceInfo = this.getDeviceInfo();
    const { type } = deviceInfo;

    switch (type) {
      case DeviceType.MOBILE:
        return 14;

      case DeviceType.TABLET:
        return 16;

      case DeviceType.TV:
        return 20;

      case DeviceType.DESKTOP:
      default:
        return 16;
    }
  }

  /**
   * 进入全屏模式
   */
  async requestFullscreen(): Promise<void> {
    try {
      const element = document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (err) {
      console.error('进入全屏失败:', err);
    }
  }

  /**
   * 退出全屏模式
   */
  async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.error('退出全屏失败:', err);
    }
  }

  /**
   * 是否在全屏模式
   */
  isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  /**
   * 切换全屏模式
   */
  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.requestFullscreen();
    }
  }

  /**
   * 禁用页面滚动
   */
  disableScroll(): void {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }

  /**
   * 启用页面滚动
   */
  enableScroll(): void {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  /**
   * 防止缩放
   */
  preventZoom(): void {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      (viewport as HTMLMetaElement).setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
    }
  }
}

export const deviceUtil = new DeviceUtil();
