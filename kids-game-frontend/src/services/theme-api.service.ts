/**
 * 主题 API 服务
 * 统一继承 BaseApiService，使用 fetch 替代 axios
 */
import { BaseApiService } from './base-api.service';
import type { ApiResponse, PageData } from './api.types';
import type { ThemeConfig } from '@/core/theme/ThemeManager';

/**
 * 云端主题信息
 * 
 * ⭐ 字段说明：
 * - gameId: 数据库主键，用于业务逻辑和关系查询
 * - gameCode: 游戏代码标识符，用于资源加载和文件路径
 * - gameName: 游戏显示名称
 */
export interface CloudThemeInfo {
  id: string;
  themeId?: number;
  key: string;
  name: string;
  themeName?: string;
  author: string;
  authorName?: string;
  authorId?: number; // ⭐ 作者 ID（用于判断主题来源）
  price: number;
  thumbnail?: string;
  thumbnailUrl?: string;
  description?: string;
  downloadCount: number;
  rating?: number;
  status: 'on_sale' | 'offline' | 'pending';
  createdAt: number;
  
  // 游戏关联字段
  gameId?: number;        // 游戏 ID - 数据库主键（用于业务逻辑、关系查询）
  gameCode?: string;      // 游戏代码 - 资源加载标识符（用于文件系统路径、必填）
  gameName?: string;      // 游戏名称 - UI 显示用
  
  configJson?: any; // 主题配置 JSON（字符串或对象）
  
  // ⭐ 主题来源标识字段
  isOfficial?: boolean;   // 是否为官方主题
  ownerType?: 'GAME' | 'APPLICATION'; // 所有者类型
  ownerId?: number;       // 所有者 ID（游戏主题时关联 gameId）
}

/**
 * 主题列表查询参数
 * 适配后端参数：ownerType, ownerId, status, page, pageSize
 */
export interface ThemeListParams {
  ownerType?: 'GAME' | 'APPLICATION';
  ownerId?: number | null;
  status?: 'on_sale' | 'offline' | 'pending';
  page?: number;
  pageSize?: number;
}

/**
 * 主题上传参数
 */
export interface ThemeUploadPayload {
  name: string;
  author: string;
  price: number;
  config: ThemeConfig;
  description?: string;
  thumbnail?: string;
}

/**
 * ⭐ 用户主题偏好数据
 */
export interface UserThemePreference {
  preferenceId?: number;
  userId: number;
  ownerType: 'GAME' | 'APPLICATION';
  ownerId: number;
  themeId: number;
  isActive?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 主题 API 服务类
 * 继承 BaseApiService 统一使用 fetch
 */
class ThemeApiService extends BaseApiService {
  private static instance: ThemeApiService;

  private constructor() {
    super();
  }

  static getInstance(): ThemeApiService {
    if (!ThemeApiService.instance) {
      ThemeApiService.instance = new ThemeApiService();
    }
    return ThemeApiService.instance;
  }

  /**
   * 获取主题列表
   * GET /api/theme/list
   * @returns 分页数据 {list, total}
   */
  async getList(params: ThemeListParams = {}): Promise<PageData<CloudThemeInfo>> {
    const queryParams = new URLSearchParams();

    if (params.ownerType) queryParams.append('ownerType', params.ownerType);
    if (params.ownerId !== undefined && params.ownerId !== null) {
      queryParams.append('ownerId', params.ownerId.toString());
    }
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/api/theme/list?${queryString}` : '/api/theme/list';

    // 使用 returnPageData: true 确保返回分页格式
    return this.get<PageData<CloudThemeInfo>>(url, { returnPageData: true });
  }

  /**
   * 获取我上传的云端主题
   * GET /api/theme/my-cloud-themes
   * 后端从认证信息中获取用户ID
   * @param params 可选筛选参数：ownerType, ownerId
   */
  async getMyThemes(params?: {
    ownerType?: 'GAME' | 'APPLICATION';
    ownerId?: number;
  }): Promise<CloudThemeInfo[]> {
    const queryParams = new URLSearchParams();
    if (params?.ownerType) queryParams.append('ownerType', params.ownerType);
    if (params?.ownerId) queryParams.append('ownerId', String(params.ownerId));
    const queryString = queryParams.toString();
    return this.get<CloudThemeInfo[]>(`/api/theme/my-cloud-themes${queryString ? '?' + queryString : ''}`);
  }

  /**
   * 获取已购买的主题列表
   * GET /api/theme/purchased-themes
   * 后端从认证信息中获取用户ID，不需要传递参数
   */
  async getPurchasedThemes(): Promise<CloudThemeInfo[]> {
    return this.get<CloudThemeInfo[]>('/api/theme/purchased-themes');
  }

  /**
   * ⭐ 获取用户可用的主题列表（支持分页和来源筛选）
   * GET /api/theme/my-available-themes
   * 后端从认证信息中获取用户 ID
   * 
   * @param params 查询参数
   * @returns 分页数据 {list, total, pageNum, pageSize}
   */
  async getMyAvailableThemes(params?: {
    ownerType?: 'GAME' | 'APPLICATION';
    ownerId?: number;
    source?: 'all' | 'official' | 'purchased' | 'mine';
    page?: number;
    pageSize?: number;
  }): Promise<PageData<CloudThemeInfo>> {
    const queryParams = new URLSearchParams();
      
    if (params?.ownerType) queryParams.append('ownerType', params.ownerType);
    if (params?.ownerId) queryParams.append('ownerId', params.ownerId.toString());
    if (params?.source) queryParams.append('source', params.source);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      
    const url = `/api/theme/my-available-themes?${queryParams.toString()}`;
      
    // 使用 returnPageData: true 确保返回分页格式
    return this.get<PageData<CloudThemeInfo>>(url, { returnPageData: true });
  }

  /**
   * 上传主题到云端
   * POST /api/theme/upload
   */
  async upload(payload: ThemeUploadPayload): Promise<CloudThemeInfo> {
    return this.post<CloudThemeInfo>('/api/theme/upload', payload);
  }


  /**
   * 购买主题
   * POST /api/theme/buy
   */
  async buy(themeId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/theme/buy', { themeId });
  }

  /**
   * 检查购买状态
   * GET /api/theme/check-purchase?themeId=xxx
   */
  async checkPurchase(themeId: number): Promise<{ purchased: boolean }> {
    return this.get<{ purchased: boolean }>(`/api/theme/check-purchase?themeId=${themeId}`);
  }

  /**
   * 下载主题
   * GET /api/theme/download?id=xxx
   * 返回结构: { configJson: "GTRS JSON 字符串" }
   */
  async download(themeId: string): Promise<{ configJson: string }> {
    return this.get<{ configJson: string }>(`/api/theme/download?id=${themeId}`);
  }

  /**
   * ⭐ 获取主题编辑器专用数据（结构化返回）
   * GET /api/theme/editor-data?id=xxx
   * 返回结构:
   * {
   *   themeInfo: { themeId, themeName, authorName, ownerType, ownerId, ... },
   *   config: { specMeta, globalStyle, resources }  // 已解析的对象，不是字符串
   * }
   */
  async getEditorData(themeId: string): Promise<{
    themeInfo: {
      themeId: number;
      themeName: string;
      authorName: string;
      authorId: number;
      ownerType: string;
      ownerId: number;
      isDefault: boolean;
      description: string;
      price: number;
      status: string;
      thumbnailUrl: string;
      downloadCount: number;
      totalRevenue: number;
      createdAt: string;
      updatedAt: string;
    };
    config: {
      specMeta: { specName: string; specVersion: string; compatibleVersion: string };
      globalStyle: Record<string, any>;
      resources: Record<string, any>;
    };
  }> {
    return this.get<any>(`/api/theme/editor-data?id=${themeId}`);
  }

  /**
   * 切换主题销售状态
   * POST /api/theme/toggle-sale?themeId=xxx&onSale=true
   */
  async toggleSale(themeId: string, onSale: boolean): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/api/theme/toggle-sale?themeId=${themeId}&onSale=${onSale}`, null);
  }

  /**
   * 获取创作者收益
   * GET /api/theme/earnings
   */
  async getEarnings(): Promise<{ total: number; pending: number; withdrawn: number }> {
    return this.get<{ total: number; pending: number; withdrawn: number }>('/api/theme/earnings');
  }

  /**
   * 获取主题详情
   * GET /api/theme/detail?id=xxx
   */
  async getDetail(themeId: string): Promise<CloudThemeInfo> {
    return this.get<CloudThemeInfo>(`/api/theme/detail?id=${themeId}`);
  }

  /**
   * 更新主题信息
   * POST /api/theme/update
   */
  async update(themeId: string, payload: Partial<ThemeUploadPayload>): Promise<CloudThemeInfo> {
    return this.post<CloudThemeInfo>('/api/theme/update', { themeId, ...payload });
  }

  /**
   * 删除主题
   * POST /api/theme/delete
   */
  async delete(themeId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/theme/delete', { themeId });
  }

  /**
   * 设为默认主题
   * POST /api/theme/set-default
   */
  async setDefault(themeId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/theme/set-default', { themeId });
  }

  /**
   * 提现收益
   * POST /api/theme/withdraw
   */
  async withdraw(amount: number): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/theme/withdraw', { amount });
  }

  /**
   * GTRS Schema校验
   * POST /api/theme/validate-gtrs
   */
  async validateGTRSTheme(themeJson: string): Promise<{ valid: boolean; message: string }> {
    return this.post<{ valid: boolean; message: string }>('/api/theme/validate-gtrs', { themeJson });
  }

  /**
   * 检测主题格式
   * POST /api/theme/detect-format
   */
  async detectThemeFormat(themeJson: string): Promise<{ isGTRS: boolean; format: string }> {
    return this.post<{ isGTRS: boolean; format: string }>('/api/theme/detect-format', { themeJson });
  }

  /**
   * 迁移旧版主题到GTRS规范
   * POST /api/theme/migrate-to-gtrs
   */
  async migrateToGTRS(params: {
    oldThemeJson: string
    themeId: string
    gameId: string
    themeName: string
  }): Promise<{ gtrsJson: string; valid: boolean; message: string }> {
    return this.post<{ gtrsJson: string; valid: boolean; message: string }>('/api/theme/migrate-to-gtrs', params);
  }

  /**
   * 快速校验（用于前端实时预览）
   * POST /api/theme/quick-validate
   */
  async quickValidate(themeJson: string): Promise<{ valid: boolean }> {
    return this.post<{ valid: boolean }>('/api/theme/quick-validate', { themeJson });
  }

  // ==================== ⭐ 用户主题偏好相关 API ====================

  /**
   * ⭐ 获取用户当前使用的主题
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   * @returns 用户主题偏好信息
   */
  async getUserCurrentTheme(ownerType: string, ownerId: number): Promise<UserThemePreference | null> {
    try {
      const response = await this.get<UserThemePreference>(
        `/api/theme/user/current?ownerType=${ownerType}&ownerId=${ownerId}`
      );
      return response || null;
    } catch (error) {
      console.error('[ThemeApi] 获取用户当前主题失败:', error);
      return null;
    }
  }

  /**
   * ⭐ 获取用户所有主题偏好设置
   * @param userId 用户 ID
   * @returns 用户主题偏好列表
   */
  async getUserPreferences(userId: number): Promise<{ list: UserThemePreference[] }> {
    try {
      const response = await this.get<{ list: UserThemePreference[] }>(
        `/api/theme/user/preferences?userId=${userId}`
      );
      return response || { list: [] };
    } catch (error) {
      console.error('[ThemeApi] 获取用户主题偏好列表失败:', error);
      return { list: [] };
    }
  }

  /**
   * ⭐ 保存用户主题偏好
   * @param ownerType 所有者类型
   * @param ownerId 所有者 ID
   * @param themeId 主题 ID
   * @returns 是否保存成功
   */
  async saveUserPreference(
    ownerType: string,
    ownerId: number,
    themeId: number
  ): Promise<boolean> {
    try {
      await this.post(
        `/api/theme/user/preference?ownerType=${ownerType}&ownerId=${ownerId}&themeId=${themeId}`
      );
      return true;
    } catch (error) {
      console.error('[ThemeApi] 保存用户主题偏好失败:', error);
      return false;
    }
  }
}

export const themeApi = ThemeApiService.getInstance();
export default themeApi;
export { ThemeApiService };
