/**
 * Phaser Theme Integration Utilities
 * Helper functions for integrating theme system with Phaser3 scenes
 */

import type { Scene, GameObjects, Types } from 'phaser';
import { themeManager, type ThemeConfig } from './ThemeManager';

/**
 * Apply theme styles to a Phaser Text GameObject
 */
export function applyTextTheme(
  text: GameObjects.Text,
  styleKey: string = 'font_size_body'
): void {
  const theme = themeManager.getCurrentTheme();
  const existingStyle = text.style.toJSON();

  const newStyle: Types.GameObjects.Text.TextStyle = {
    ...existingStyle,
    fontSize: theme.styles[styleKey] || theme.styles.font_size_body || '18px',
    color: theme.styles.color_text || '#ffffff',
    fontFamily: theme.styles.font_family || 'Arial',
  };

  text.setStyle(newStyle);
}

/**
 * Create themed button
 */
export function createThemedButton(
  scene: Scene,
  x: number,
  y: number,
  text: string,
  callback: () => void,
  options: {
    width?: number;
    height?: number;
    fontSize?: string;
  } = {}
): GameObjects.Container {
  const theme = themeManager.getCurrentTheme();

  const width = options.width || 200;
  const height = options.height || 60;
  const fontSize = options.fontSize || theme.styles.font_size_body || '18px';

  const container = scene.add.container(x, y);

  const bg = scene.add.rectangle(0, 0, width, height, parseInt(theme.styles.color_btn_bg?.replace('#', '0x') || '0x333333'));
  bg.setOrigin(0.5);
  bg.setInteractive({ useHandCursor: true });

  const radius = parseFloat(theme.styles.border_radius_btn || '8');
  bg.setRoundedRadius(radius);

  const label = scene.add.text(0, 0, text, {
    fontSize,
    color: theme.styles.color_btn_text || '#ffffff',
    fontFamily: theme.styles.font_family || 'Arial',
  });
  label.setOrigin(0.5);

  container.add([bg, label]);

  bg.on('pointerover', () => {
    bg.setFillStyle(parseInt(lightenColor(theme.styles.color_btn_bg || '#333333', 20)));
  });

  bg.on('pointerout', () => {
    bg.setFillStyle(parseInt(theme.styles.color_btn_bg?.replace('#', '0x') || '0x333333'));
  });

  bg.on('pointerdown', () => {
    const sound = scene.sound.get('sound_click');
    if (sound) {
      sound.play();
    }
    callback();
  });

  return container;
}

/**
 * Apply theme background to scene
 */
export function applyThemeBackground(scene: Scene, key: string = 'bg_main'): void {
  const assetKey = themeManager.getAsset(key);
  
  if (assetKey && scene.textures.exists(key)) {
    const bg = scene.add.image(
      scene.scale.width / 2,
      scene.scale.height / 2,
      key
    );
    bg.setDisplaySize(scene.scale.width, scene.scale.height);
    bg.setOrigin(0.5);
    bg.setDepth(-1000);
    return;
  }

  const theme = themeManager.getCurrentTheme();
  const bgColor = theme.styles.color_panel_bg || '#1a1a2e';
  const bg = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height / 2,
    scene.scale.width,
    scene.scale.height,
    parseInt(bgColor.replace('#', '0x'))
  );
  bg.setOrigin(0.5);
  bg.setDepth(-1000);
}

/**
 * Play themed background music
 */
export function playThemeBGM(scene: Scene, key: string = 'bgm_main'): void {
  const assetKey = themeManager.getAsset(key);
  
  if (assetKey && scene.sound.exists(key)) {
    scene.sound.play(key, {
      loop: true,
      volume: 0.5,
    });
  }
}

/**
 * Play themed sound effect
 */
export function playThemeSound(scene: Scene, key: string): void {
  const assetKey = themeManager.getAsset(key);
  
  if (assetKey && scene.sound.exists(key)) {
    scene.sound.play(key, {
      volume: 0.7,
    });
  }
}

/**
 * Create themed panel
 */
export function createThemedPanel(
  scene: Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    title?: string;
    closable?: boolean;
    onClose?: () => void;
  } = {}
): GameObjects.Container {
  const theme = themeManager.getCurrentTheme();

  const container = scene.add.container(x, y);

  const panelBg = scene.add.rectangle(0, 0, width, height, parseInt(theme.styles.color_panel_bg?.replace('#', '0x') || '0x1a1a2e'));
  panelBg.setOrigin(0.5);
  panelBg.setDepth(0);

  const radius = parseFloat(theme.styles.border_radius_panel || '12');
  panelBg.setRoundedRadius(radius);

  const border = scene.add.rectangle(0, 0, width, height, 0x000000);
  border.setOrigin(0.5);
  border.setRoundedRadius(radius);
  border.setStrokeStyle(2, 0x444444);
  border.setDepth(1);

  container.add([panelBg, border]);

  if (options.title) {
    const title = scene.add.text(-width / 2 + 20, -height / 2 + 30, options.title, {
      fontSize: theme.styles.font_size_subtitle || '28px',
      color: theme.styles.color_text || '#ffffff',
      fontFamily: theme.styles.font_family || 'Arial',
    });
    title.setOrigin(0, 0);
    title.setDepth(2);
    container.add(title);
  }

  if (options.closable && options.onClose) {
    const closeBtn = scene.add.text(width / 2 - 20, -height / 2 + 20, '×', {
      fontSize: '32px',
      color: theme.styles.color_text || '#ffffff',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.setDepth(2);

    closeBtn.on('pointerover', () => {
      closeBtn.setColor('#ff5252');
    });

    closeBtn.on('pointerout', () => {
      closeBtn.setColor(theme.styles.color_text || '#ffffff');
    });

    closeBtn.on('pointerdown', () => {
      playThemeSound(scene, 'sound_click');
      options.onClose?.();
    });

    container.add(closeBtn);
  }

  return container;
}

/**
 * Get color from theme
 */
export function getThemeColor(key: string): string {
  const theme = themeManager.getCurrentTheme();
  return theme.styles[key] || '#ffffff';
}

/**
 * Get numeric style value
 */
export function getThemeNumericStyle(key: string): number {
  const theme = themeManager.getCurrentTheme();
  const value = theme.styles[key] || '0';
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
}

/**
 * Lighten or darken a hex color
 */
export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * Setup theme change listener for scene
 */
export function setupThemeChangeListener(
  scene: Scene,
  callback: (theme: ThemeConfig) => void
): () => void {
  const handler = (event: CustomEvent) => {
    callback(event.detail.theme);
  };

  window.addEventListener('phaser-theme-change', handler as EventListener);

  return () => {
    window.removeEventListener('phaser-theme-change', handler as EventListener);
  };
}

/**
 * Preload theme assets in Phaser preload method
 */
export function preloadThemeAssets(scene: Scene): void {
  themeManager.loadThemeAssets(scene);
}

/**
 * Apply theme when scene starts
 */
export function applyThemeOnStart(scene: Phaser.Scene): void {
  themeManager.setActiveScene(scene);
}
