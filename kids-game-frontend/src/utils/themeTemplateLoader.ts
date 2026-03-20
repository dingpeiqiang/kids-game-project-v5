/**
 * 游戏资源模板加载器
 * 从游戏项目中加载主题资源模板配置
 */

export interface ResourceSpec {
  width?: number;
  height?: number;
  format?: string[];
  transparent?: boolean;
  maxSize?: number;
  duration?: string;
  loop?: boolean;
  range?: [number, number];
  options?: string[];
}

export interface ResourceConfig {
  label: string;
  description: string;
  required: boolean;
  specs?: ResourceSpec;
  defaultValue?: string | number | null;
  type?: string;
}

export interface ThemeTemplate {
  version: string;
  gameCode: string;
  gameName: string;
  gameVersion: string;
  resources: {
    images?: Record<string, ResourceConfig>;
    audio?: Record<string, ResourceConfig>;
    colors?: Record<string, ResourceConfig>;
    configs?: Record<string, ResourceConfig>;
  };
  metadata?: {
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * 获取游戏资源模板
 * @param gameCode 游戏代码
 * @returns 资源模板配置
 */
export async function loadGameThemeTemplate(gameCode: string): Promise<ThemeTemplate | null> {
  try {
    console.log(`[ThemeTemplateLoader] 加载游戏资源模板：${gameCode}`);

    // ⭐ 方案 1：从静态文件加载（开发阶段）
    const templateUrl = `/games/${gameCode}/config/theme-template.json`;
    
    try {
      const response = await fetch(templateUrl);
      
      if (response.ok) {
        const template = await response.json() as ThemeTemplate;
        console.log(`[ThemeTemplateLoader] 模板加载成功:`, template);
        return template;
      }
    } catch (fileError) {
      // 文件不存在，继续尝试 API
      console.warn(`[ThemeTemplateLoader] 模板文件不存在：${templateUrl}`);
    }
    
    // ⭐ 方案 2：从后端API 加载（带 Token）
    try {
      const token = localStorage.getItem('token');
      const apiResponse = await fetch(`/api/game/theme-template?gameCode=${gameCode}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
          
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        if (result.code === 200 && result.data) {
          console.log(`[ThemeTemplateLoader] 从 API 加载成功`);
          return result.data as ThemeTemplate;
        }
      }
    } catch (apiError) {
      console.error(`[ThemeTemplateLoader] API 加载失败:`, apiError);
    }
    
    return null;
  } catch (error) {
    console.error(`[ThemeTemplateLoader] 加载失败:`, error);
    return null;
  }
}

/**
 * 从资源模板转换为DIY页面使用的格式
 */
export function convertTemplateToDIYFormat(template: ThemeTemplate) {
  const imageAssets: Array<{
    key: string;
    label: string;
    required: boolean;
    sizeHint?: string;
    description?: string;
  }> = [];

  const audioAssets: Array<{
    key: string;
    label: string;
    required: boolean;
    durationHint?: string;
    description?: string;
  }> = [];

  const colorConfigs: Array<{
    key: string;
    label: string;
    defaultValue: string;
    description?: string;
  }> = [];

  // 转换图片资源
  if (template.resources.images) {
    Object.entries(template.resources.images).forEach(([key, config]) => {
      imageAssets.push({
        key,
        label: config.label,
        required: config.required,
        sizeHint: config.specs?.width && config.specs?.height 
          ? `${config.specs.width}x${config.specs.height}` 
          : undefined,
        description: config.description
      });
    });
  }

  // 转换音频资源
  if (template.resources.audio) {
    Object.entries(template.resources.audio).forEach(([key, config]) => {
      audioAssets.push({
        key,
        label: config.label,
        required: config.required,
        durationHint: config.specs?.duration,
        description: config.description
      });
    });
  }

  // 转换颜色配置
  if (template.resources.colors) {
    Object.entries(template.resources.colors).forEach(([key, config]) => {
      colorConfigs.push({
        key,
        label: config.label,
        defaultValue: config.defaultValue as string,
        description: config.description
      });
    });
  }

  return {
    gameCode: template.gameCode,
    gameName: template.gameName,
    imageAssets,
    audioAssets,
    colorConfigs
  };
}

/**
 * 验证资源是否符合模板要求
 */
export function validateResource(
  resourceKey: string,
  resourceFile: File,
  config: ResourceConfig
): { valid: boolean; error?: string; warning?: string } {
  // 检查文件大小
  if (config.specs?.maxSize) {
    const fileSizeKB = resourceFile.size / 1024;
    if (fileSizeKB > config.specs.maxSize) {
      return {
        valid: false,
        error: `文件大小超出限制（最大 ${config.specs.maxSize}KB，当前 ${fileSizeKB.toFixed(1)}KB）`
      };
    }
  }

  // 检查文件格式
  if (config.specs?.format) {
    const extension = resourceFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !config.specs.format.includes(extension)) {
      return {
        valid: false,
        error: `不支持的文件格式（支持: ${config.specs.format.join(', ')}）`
      };
    }
  }

  // 图片尺寸检查（需要异步加载图片，这里只返回警告）
  if (config.specs?.width && config.specs?.height) {
    const sizeHint = `建议尺寸: ${config.specs.width}x${config.specs.height}`;
    return {
      valid: true,
      warning: sizeHint
    };
  }

  return { valid: true };
}

/**
 * 获取所有支持的游戏列表
 */
export async function getSupportedGames(): Promise<Array<{ gameCode: string; gameName: string }>> {
  try {
    // 方案 1：从静态文件加载
    try {
      const response = await fetch('/games/game-list.json');
      
      if (response.ok) {
        const gameList = await response.json();
        return gameList;
      }
    } catch (fileError) {
      // 文件不存在，继续尝试 API
    }

    // 方案 2：从后端 API 加载（使用统一 API 服务）
    try {
      const { gameApi } = await import('@/services');
      const games = await gameApi.getList();
      
      if (games && games.length > 0) {
        return games.map((game: any) => ({
          gameCode: game.gameCode,
          gameName: game.gameName
        }));
      }
    } catch (apiError) {
      // API 失败，使用备用数据
    }

    // 方案 3：使用备用数据
    return [
      { gameCode: 'snake-vue3', gameName: '贪吃蛇大冒险' },
      { gameCode: 'plants-vs-zombie', gameName: '植物大战僵尸' },
      { gameCode: 'plane-shooter', gameName: '飞机大战' },
      { gameCode: 'chromosome', gameName: '超级染色体' },
      { gameCode: 'arithmetic', gameName: '算术大战' }
    ];
  } catch (error) {
    console.error('[ThemeTemplateLoader] 获取游戏列表失败:', error);
    return [];
  }
}
