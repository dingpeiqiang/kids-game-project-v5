/**
 * 统一主题系统类型定义
 * 支持应用主题和游戏主题的统一配置结构
 */

// ==================== 资源类型定义 ====================

/**
 * 资源类型枚举
 */
export type AssetType = 'color' | 'emoji' | 'image' | 'audio';

/**
 * 基础资源接口
 */
export interface BaseAsset {
  type: AssetType;
}

/**
 * 颜色资源
 */
export interface ColorAsset extends BaseAsset {
  type: 'color';
  value: string; // 颜色值 #RRGGBB 或 rgba
}

/**
 * Emoji 资源
 */
export interface EmojiAsset extends BaseAsset {
  type: 'emoji';
  value: string; // emoji 字符
}

/**
 * 图片资源
 */
export interface ImageAsset extends BaseAsset {
  type: 'image';
  url: string; // 图片 URL (CDN)
  thumbnailUrl?: string; // 缩略图 URL
  hoverUrl?: string; // hover 状态图片 URL
  width?: number; // 图片宽度
  height?: number; // 图片高度
}

/**
 * 音频资源
 */
export interface AudioAsset extends BaseAsset {
  type: 'audio';
  url: string; // 音频 URL (CDN)
  volume?: number; // 音量 0-1，默认 0.5
  loop?: boolean; // 是否循环播放
  duration?: number; // 时长 (秒)
}

/**
 * 联合类型：所有可能的资源类型
 */
export type ThemeAsset = ColorAsset | EmojiAsset | ImageAsset | AudioAsset;

// ==================== 样式配置 ====================

/**
 * 颜色系统配置
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary?: string;
  accent?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

/**
 * 字体排印配置
 */
export interface ThemeTypography {
  fontFamily?: string;
  fontSizes: Record<string, string>; // xs, sm, base, lg, xl, 2xl, 3xl...
  lineHeights?: Record<string, string>; // tight, normal, relaxed
  fontWeights?: Record<string, number>; // light, normal, medium, bold
}

/**
 * 圆角配置
 */
export interface ThemeRadius {
  sm?: string;
  base?: string;
  md?: string;
  lg?: string;
  xl?: string;
  full?: string;
  [key: string]: string | undefined;
}

/**
 * 阴影配置
 */
export interface ThemeShadows {
  sm?: string;
  base?: string;
  md?: string;
  lg?: string;
  xl?: string;
  glow?: string; // 发光效果
  [key: string]: string | undefined;
}

/**
 * 过渡动画配置
 */
export interface ThemeTransitions {
  fast?: string; // 150ms
  normal?: string; // 300ms
  slow?: string; // 500ms
  [key: string]: string | undefined;
}

/**
 * 完整样式配置
 */
export interface ThemeStyles {
  colors: ThemeColors;
  typography: ThemeTypography;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  transitions?: ThemeTransitions;
}

// ==================== 主题资源配置 ====================

/**
 * 背景资源配置
 */
export interface BackgroundAssets {
  bg_main?: ThemeAsset;
  bg_sidebar?: ThemeAsset;
  bg_card?: ThemeAsset;
  bg_header?: ThemeAsset;
  bg_footer?: ThemeAsset;
  [key: string]: ThemeAsset | undefined;
}

/**
 * 图标资源配置
 */
export interface IconAssets {
  icon_logo?: ThemeAsset;
  icon_home?: ThemeAsset;
  icon_game?: ThemeAsset;
  icon_user?: ThemeAsset;
  icon_shop?: ThemeAsset;
  icon_ranking?: ThemeAsset;
  icon_settings?: ThemeAsset;
  [key: string]: ThemeAsset | undefined;
}

/**
 * UI 元素资源配置
 */
export interface UIAssets {
  btn_primary?: ThemeAsset;
  btn_secondary?: ThemeAsset;
  btn_success?: ThemeAsset;
  btn_danger?: ThemeAsset;
  card_bg?: ThemeAsset;
  input_bg?: ThemeAsset;
  border_decoration?: ThemeAsset;
  [key: string]: ThemeAsset | undefined;
}

/**
 * 游戏专属资源配置 (可选)
 */
export interface GameSpecificAssets {
  // 角色相关
  player?: ThemeAsset;
  snakeHead?: ThemeAsset;
  snakeBody?: ThemeAsset;
  snakeTail?: ThemeAsset;
  
  // 敌人/障碍
  enemy?: ThemeAsset;
  obstacle?: ThemeAsset;
  
  // 道具/食物
  food?: ThemeAsset;
  powerup?: ThemeAsset;
  coin?: ThemeAsset;
  
  // 游戏场景
  gameBg?: ThemeAsset;
  gridLine?: ThemeAsset;
  platform?: ThemeAsset;
  
  // 投射物
  projectile?: ThemeAsset;
  bullet?: ThemeAsset;
  
  [key: string]: ThemeAsset | undefined;
}

/**
 * 完整资源配置
 */
export interface ThemeAssets {
  // 背景资源
  bg_main?: ThemeAsset;
  bg_sidebar?: ThemeAsset;
  bg_card?: ThemeAsset;
  bg_header?: ThemeAsset;
  bg_footer?: ThemeAsset;
  
  // 图标资源
  icon_logo?: ThemeAsset;
  icon_home?: ThemeAsset;
  icon_game?: ThemeAsset;
  icon_user?: ThemeAsset;
  icon_shop?: ThemeAsset;
  icon_ranking?: ThemeAsset;
  icon_settings?: ThemeAsset;
  
  // UI 元素
  btn_primary?: ThemeAsset;
  btn_secondary?: ThemeAsset;
  btn_success?: ThemeAsset;
  btn_danger?: ThemeAsset;
  card_bg?: ThemeAsset;
  input_bg?: ThemeAsset;
  border_decoration?: ThemeAsset;
  
  // 扁平化的资源键值对 (推荐使用这种方式)
  [key: string]: ThemeAsset | undefined;
}

// ==================== 音频配置 ====================

/**
 * 背景音乐配置
 */
export interface BGMAudio {
  bgm_main?: AudioAsset;
  bgm_menu?: AudioAsset;
  bgm_gameplay?: AudioAsset;
  bgm_victory?: AudioAsset;
  bgm_defeat?: AudioAsset;
  [key: string]: AudioAsset | undefined;
}

/**
 * 音效配置
 */
export interface SFXAudio {
  sfx_click?: AudioAsset;
  sfx_hover?: AudioAsset;
  sfx_success?: AudioAsset;
  sfx_error?: AudioAsset;
  sfx_notification?: AudioAsset;
  sfx_collect?: AudioAsset;
  sfx_jump?: AudioAsset;
  sfx_explosion?: AudioAsset;
  [key: string]: AudioAsset | undefined;
}

/**
 * 完整音频配置
 */
export interface ThemeAudio {
  bgm?: BGMAudio;
  sfx?: SFXAudio;
  
  // 扁平化的音频键值对
  [key: string]: AudioAsset | BGMAudio | SFXAudio | undefined;
}

// ==================== 主题配置主接口 ====================

/**
 * 单个主题配置 (default 键)
 */
export interface ThemeConfigDefault {
  name: string;
  author: string;
  description?: string;
  version?: string;
  gameCode?: string; // 仅游戏主题需要
  
  // 样式配置
  styles: ThemeStyles;
  
  // 资源配置
  assets: Record<string, ThemeAsset>;
  
  // 音频配置
  audio: Record<string, AudioAsset>;
}

/**
 * 完整主题配置对象
 */
export interface ThemeConfig {
  default: ThemeConfigDefault;
}

// ==================== 主题信息 (数据库实体) ====================

/**
 * 主题适用范围
 */
export type ApplicableScope = 'all' | 'specific';

/**
 * 所有者类型：GAME-游戏，APPLICATION-应用
 */
export type OwnerType = 'GAME' | 'APPLICATION';

/**
 * 主题状态
 */
export type ThemeStatus = 'on_sale' | 'offline' | 'pending';

/**
 * 主题信息 (后端返回的数据结构)
 */
export interface ThemeInfo {
  themeId: number;
  authorId: number;
  themeName: string;
  authorName?: string;
  
  // ⭐ NEW: 所有者类型和 ID
  ownerType?: OwnerType;
  ownerId?: number | null;
  
  // ⚠️ DEPRECATED: 保留以兼容旧版本
  applicableScope?: ApplicableScope;
  
  price: number;
  status: ThemeStatus;
  downloadCount: number;
  totalRevenue: number;
  thumbnailUrl?: string;
  description?: string;
  configJson: string | ThemeConfig; // 可能是 JSON 字符串或对象
  isDefault?: boolean; // 是否为默认主题
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // ⚠️ DEPRECATED: 关联的游戏信息 (仅游戏主题，已废弃)
  gameId?: number;
  gameCode?: string;
}

/**
 * 主题 - 游戏关系
 */
export interface ThemeGameRelation {
  relationId: number;
  themeId: number;
  gameId: number;
  gameCode: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date | string;
}

/**
 * 游戏信息 (简化版)
 */
export interface GameInfo {
  gameId: number;
  gameName: string;
  gameCode: string;
  gameUrl?: string;
  status?: string;
}

// ==================== API 请求/响应类型 ====================

/**
 * 主题列表查询参数
 */
export interface ThemeListParams {
  // ⭐ NEW: 新的查询参数
  ownerType?: OwnerType;
  ownerId?: number | null;
  
  // ⚠️ DEPRECATED: 保留以兼容旧版本
  applicableScope?: ApplicableScope;
  gameId?: number;
  gameCode?: string;
  
  status?: ThemeStatus;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 主题上传请求
 */
export interface ThemeUploadPayload {
  themeName: string;
  authorName?: string;
  applicableScope: ApplicableScope;
  price?: number;
  description?: string;
  thumbnailUrl?: string;
  config: ThemeConfig;
  gameId?: number; // 仅游戏主题需要
  gameCode?: string; // 仅游戏主题需要
  isDefault?: boolean;
}

/**
 * 主题更新请求
 */
export interface ThemeUpdatePayload {
  themeId: number;
  themeName?: string;
  description?: string;
  price?: number;
  status?: ThemeStatus;
  config?: ThemeConfig;
  isDefault?: boolean;
}

/**
 * 资源上传响应
 */
export interface ResourceUploadResponse {
  success: boolean;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  type: string;
}

// ==================== 辅助类型 ====================

/**
 * 主题创作表单数据
 */
export interface ThemeFormData {
  basic: {
    name: string;
    author: string;
    description?: string;
    applicableScope: ApplicableScope;
    selectedGameId?: number;
    selectedGameCode?: string;
    price: number;
  };
  
  styles: ThemeStyles;
  assets: Record<string, ThemeAsset>;
  audio: Record<string, AudioAsset>;
}

/**
 * 资源编辑器属性
 */
export interface AssetEditorProps {
  assetKey: string;
  asset: ThemeAsset;
  onUpdate: (asset: ThemeAsset) => void;
  onDelete: () => void;
}

/**
 * 预览组件属性
 */
export interface ThemePreviewProps {
  config: ThemeConfig;
  previewType?: 'application' | 'game';
  gameCode?: string;
}
