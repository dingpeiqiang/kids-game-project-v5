/**
 * 通用游戏资源管理器配置接口定义
 * 
 * 通过配置文件驱动资源管理器，支持不同游戏的资源管理需求
 */

/**
 * 资源类型枚举
 */
export enum ResourceType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  SCRIPT = 'script',
  ATLAS = 'atlas',
  TILEMAP = 'tilemap'
}

/**
 * 资源分类
 */
export enum ResourceCategory {
  // 图片分类
  SCENE = 'scene',
  UI = 'ui',
  ICON = 'icon',
  EFFECT = 'effect',
  
  // 音频分类
  BGM = 'bgm',
  SOUND_EFFECT = 'effect',
  VOICE = 'voice',
  
  // 其他
  SCRIPT = 'script',
  DATA = 'data'
}

/**
 * 单个资源配置
 */
export interface ResourceConfig {
  /** 资源唯一标识 */
  key: string;
  
  /** 显示名称/别名 */
  alias: string;
  
  /** 资源类型 */
  type: ResourceType;
  
  /** 资源分类 */
  category?: ResourceCategory;
  
  /** 文件路径（相对于主题目录） */
  path: string;
  
  /** 文件名 */
  filename?: string;
  
  /** 资源尺寸（图片/视频） */
  size?: {
    width: number;
    height: number;
  };
  
  /** 音频时长（秒） */
  duration?: number;
  
  /** 文件格式 */
  format?: string;
  
  /** 文件大小（字节） */
  fileSize?: number;
  
  /** 生成提示词（用于AI生成） */
  prompt?: string;
  
  /** 额外元数据 */
  metadata?: Record<string, any>;
  
  /** 是否必需 */
  required?: boolean;
  
  /** 标签 */
  tags?: string[];
}

/**
 * 资源分组配置
 */
export interface ResourceGroupConfig {
  /** 分组名称 */
  name: string;
  
  /** 分组描述 */
  description?: string;
  
  /** 分组图标 */
  icon?: string;
  
  /** 资源列表 */
  resources: ResourceConfig[];
  
  /** 是否可折叠 */
  collapsible?: boolean;
  
  /** 默认展开 */
  defaultExpanded?: boolean;
}

/**
 * 游戏资源配置
 */
export interface GameResourceConfig {
  /** 游戏ID */
  gameId: string;
  
  /** 游戏名称 */
  gameName: string;
  
  /** 游戏类型 */
  gameType?: string;
  
  /** 主题ID */
  themeId: string;
  
  /** 主题名称 */
  themeName?: string;
  
  /** 主题基础路径 */
  themeBasePath: string;
  
  /** GTRS配置文件路径 */
  gtrsConfigPath?: string;
  
  /** 资源分组 */
  groups: ResourceGroupConfig[];
  
  /** 扁平化资源列表（从groups中提取，便于快速访问） */
  flatResources?: Map<string, ResourceConfig>;
  
  /** 尺寸规格配置（用于AI生成） */
  sizeSpecs?: Record<string, {
    width: number;
    height: number;
    note?: string;
  }>;
  
  /** AI生成提示词模板 */
  prompts?: Record<string, string>;
  
  /** 生成配置 */
  generationConfig?: {
    /** 默认采样步数 */
    defaultSteps?: number;
    
    /** 默认CFG Scale */
    defaultCfgScale?: number;
    
    /** 是否启用高清修复 */
    enableHiresFix?: boolean;
    
    /** 高清修复算法 */
    hrUpscaler?: string;
    
    /** 高清修复缩放倍数 */
    hrScale?: number;
    
    /** 重绘强度 */
    denoisingStrength?: number;
  };
  
  /** 自定义配置 */
  custom?: Record<string, any>;
}

/**
 * 资源管理器配置
 */
export interface ResourceManagerConfig {
  /** 游戏资源配置 */
  gameConfig: GameResourceConfig;
  
  /** 是否启用AI生成功能 */
  enableAIGeneration?: boolean;
  
  /** 是否启用音频编辑功能 */
  enableAudioEditing?: boolean;
  
  /** 是否启用帧序列图制作 */
  enableSpriteSheetMaker?: boolean;
  
  /** SD WebUI API地址 */
  sdApiUrl?: string;
  
  /** MusicGen API地址 */
  musicGenApiUrl?: string;
  
  /** 自定义操作按钮 */
  customActions?: Array<{
    id: string;
    label: string;
    icon: string;
    handler: (resource: ResourceConfig) => void;
  }>;
}

/**
 * 从GTRS配置转换为通用资源配置的工具函数
 */
export function convertGTRSToResourceConfig(
  gtrsData: any,
  themeBasePath: string,
  gameId: string,
  themeId: string
): GameResourceConfig {
  const groups: ResourceGroupConfig[] = [];
  const flatResources = new Map<string, ResourceConfig>();
  
  // 转换图片资源
  if (gtrsData.resources?.images) {
    const imageGroups: ResourceConfig[] = [];
    
    for (const [category, items] of Object.entries(gtrsData.resources.images)) {
      if (typeof items === 'object') {
        for (const [key, config] of Object.entries(items as Record<string, any>)) {
          const resource: ResourceConfig = {
            key,
            alias: config.alias || key,
            type: ResourceType.IMAGE,
            category: category as ResourceCategory,
            path: config.src,
            filename: config.src.split('/').pop(),
            format: config.type || 'png',
            metadata: config
          };
          
          imageGroups.push(resource);
          flatResources.set(key, resource);
        }
      }
    }
    
    if (imageGroups.length > 0) {
      groups.push({
        name: '图片资源',
        description: '游戏中的图片素材',
        icon: '🖼️',
        resources: imageGroups,
        collapsible: true,
        defaultExpanded: true
      });
    }
  }
  
  // 转换音频资源
  if (gtrsData.resources?.audio) {
    const audioGroups: ResourceConfig[] = [];
    
    for (const [category, items] of Object.entries(gtrsData.resources.audio)) {
      if (typeof items === 'object') {
        for (const [key, config] of Object.entries(items as Record<string, any>)) {
          const resource: ResourceConfig = {
            key,
            alias: config.alias || key,
            type: ResourceType.AUDIO,
            category: category as ResourceCategory,
            path: config.src,
            filename: config.src.split('/').pop(),
            format: config.type || 'mp3',
            duration: config.duration,
            metadata: config
          };
          
          audioGroups.push(resource);
          flatResources.set(key, resource);
        }
      }
    }
    
    if (audioGroups.length > 0) {
      groups.push({
        name: '音频资源',
        description: '游戏中的音频素材',
        icon: '🔊',
        resources: audioGroups,
        collapsible: true,
        defaultExpanded: false
      });
    }
  }
  
  // 转换图集资源
  if (gtrsData.resources?.atlases) {
    const atlasGroups: ResourceConfig[] = [];
    
    for (const [category, items] of Object.entries(gtrsData.resources.atlases)) {
      if (typeof items === 'object') {
        for (const [key, config] of Object.entries(items as Record<string, any>)) {
          const resource: ResourceConfig = {
            key,
            alias: config.alias || key,
            type: ResourceType.ATLAS,
            category: category as ResourceCategory,
            path: config.image || config.atlas,
            filename: (config.image || config.atlas)?.split('/').pop(),
            format: 'json',
            metadata: config
          };
          
          atlasGroups.push(resource);
          flatResources.set(key, resource);
        }
      }
    }
    
    if (atlasGroups.length > 0) {
      groups.push({
        name: '图集资源',
        description: '雪碧图和图集配置',
        icon: '🎨',
        resources: atlasGroups,
        collapsible: true,
        defaultExpanded: false
      });
    }
  }
  
  // 添加GTRS配置文件本身
  if (gtrsData.specMeta) {
    const gtrsResource: ResourceConfig = {
      key: 'gtrs_config',
      alias: 'GTRS 主题配置',
      type: ResourceType.JSON,
      category: ResourceCategory.DATA,
      path: `${themeBasePath}/GTRS.json`,
      filename: 'GTRS.json',
      format: 'json',
      required: true
    };
    
    flatResources.set('gtrs_config', gtrsResource);
    
    // 如果没有其他JSON资源，创建一个JSON分组
    const existingJsonGroup = groups.find(g => g.name === '配置文件');
    if (existingJsonGroup) {
      existingJsonGroup.resources.push(gtrsResource);
    } else {
      groups.push({
        name: '配置文件',
        description: '游戏配置文件',
        icon: '📄',
        resources: [gtrsResource],
        collapsible: true,
        defaultExpanded: false
      });
    }
  }
  
  return {
    gameId,
    gameName: gtrsData.themeInfo?.themeName || gameId,
    gameType: gtrsData.themeInfo?.gameId,
    themeId,
    themeName: gtrsData.themeInfo?.themeName,
    themeBasePath,
    gtrsConfigPath: `${themeBasePath}/GTRS.json`,
    groups,
    flatResources
  };
}

/**
 * 加载游戏资源配置
 */
export async function loadGameResourceConfig(
  gameId: string,
  themeId: string,
  themeBasePath: string
): Promise<GameResourceConfig> {
  try {
    // 尝试从GTRS.json加载配置
    const gtrsPath = `${themeBasePath}/GTRS.json?t=${Date.now()}`;
    const response = await fetch(gtrsPath);
    
    if (!response.ok) {
      throw new Error(`无法加载GTRS配置: ${response.statusText}`);
    }
    
    const gtrsData = await response.json();
    
    // 转换为通用配置
    return convertGTRSToResourceConfig(gtrsData, themeBasePath, gameId, themeId);
  } catch (error) {
    console.error('[ResourceManager] 加载配置失败:', error);
    throw error;
  }
}
