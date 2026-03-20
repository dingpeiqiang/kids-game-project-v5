/**
 * 游戏资源严格预检测器
 * 在游戏启动前强制校验所有必需资源，有任何问题立即报错
 */

export interface AssetRequirement {
  key: string;
  type: 'image' | 'audio' | 'json' | 'spritesheet';
  required: boolean;
  path?: string;
}

export interface AssetValidationResult {
  success: boolean;
  missingAssets: Array<{
    key: string;
    type: string;
    expectedPath?: string;
  }>;
  invalidAssets: Array<{
    key: string;
    type: string;
    path: string;
    error: string;
  }>;
  loadedAssets: string[];
}

export class GameAssetValidator {
  private requiredAssets: Map<string, AssetRequirement> = new Map();
  private scene: Phaser.Scene;
  private validationTimeout: number = 10000; // 10 秒超时

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 注册必需资源
   */
  registerAsset(key: string, type: 'image' | 'audio' | 'json' | 'spritesheet', options?: {
    required?: boolean;
    path?: string;
  }): void {
    this.requiredAssets.set(key, {
      key,
      type,
      required: options?.required ?? true,
      path: options?.path,
    });
  }

  /**
   * 批量注册资源
   */
  registerAssets(assets: Array<{
    key: string;
    type: 'image' | 'audio' | 'json' | 'spritesheet';
    required?: boolean;
    path?: string;
  }>): void {
    assets.forEach(asset => {
      this.registerAsset(asset.key, asset.type, {
        required: asset.required,
        path: asset.path,
      });
    });
  }

  /**
   * 验证并加载所有必需资源（严格模式）
   */
  async validateAndLoad(): Promise<AssetValidationResult> {
    console.log('[GameAssetValidator] 开始验证资源...');
    
    const result: AssetValidationResult = {
      success: true,
      missingAssets: [],
      invalidAssets: [],
      loadedAssets: [],
    };

    // 1. 检查已注册的资源配置
    for (const [key, requirement] of this.requiredAssets.entries()) {
      if (requirement.required && !requirement.path) {
        // 必需资源但没有指定路径，尝试从 Phaser loader 中查找
        const isLoaded = this.checkAssetExists(key, requirement.type);
        if (!isLoaded) {
          result.missingAssets.push({
            key,
            type: requirement.type,
            expectedPath: undefined,
          });
        } else {
          result.loadedAssets.push(key);
        }
      }
    }

    // 2. 如果有缺失的必需资源，直接报错
    if (result.missingAssets.length > 0) {
      const errorMsg = this.buildMissingAssetsError(result.missingAssets);
      console.error('[GameAssetValidator] ❌ 资源验证失败:', errorMsg);
      result.success = false;
      throw new Error(errorMsg);
    }

    // 3. 加载所有资源并进行 HTTP 验证
    const loadPromises: Promise<void>[] = [];
    
    for (const [key, requirement] of this.requiredAssets.entries()) {
      if (requirement.path) {
        const loadPromise = this.loadAndVerifyAsset(key, requirement, result);
        loadPromises.push(loadPromise);
      }
    }

    // 4. 等待所有资源加载完成
    try {
      await Promise.allSettled(loadPromises);
    } catch (error) {
      console.error('[GameAssetValidator] 资源加载过程出错:', error);
      result.success = false;
    }

    // 5. 最终检查
    if (result.invalidAssets.length > 0) {
      const errorMsg = this.buildInvalidAssetsError(result.invalidAssets);
      console.error('[GameAssetValidator] ❌ 资源验证失败:', errorMsg);
      result.success = false;
      throw new Error(errorMsg);
    }

    // 6. 检查必需资源是否都加载成功
    const missingRequiredAssets = result.missingAssets.filter((_, index) => {
      const req = Array.from(this.requiredAssets.values())[index];
      return req?.required;
    });

    if (missingRequiredAssets.length > 0) {
      const errorMsg = this.buildMissingAssetsError(missingRequiredAssets);
      console.error('[GameAssetValidator] ❌ 必需资源缺失:', errorMsg);
      result.success = false;
      throw new Error(errorMsg);
    }

    console.log(`[GameAssetValidator] ✅ 资源验证通过，共加载 ${result.loadedAssets.length} 个资源`);
    return result;
  }

  /**
   * 加载并验证单个资源
   */
  private async loadAndVerifyAsset(
    key: string,
    requirement: AssetRequirement,
    result: AssetValidationResult
  ): Promise<void> {
    if (!requirement.path) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.validationTimeout);

    try {
      // HTTP HEAD 请求验证资源可访问性
      const response = await fetch(requirement.path, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 验证通过后加入加载队列
      this.scene.load.once(`filecomplete-${requirement.type}-${key}`, () => {
        result.loadedAssets.push(key);
        console.log(`[GameAssetValidator] ✅ 加载成功：${key}`);
      });

      this.scene.load.once(`load-error-${requirement.type}-${key}`, (data: any) => {
        result.invalidAssets.push({
          key,
          type: requirement.type,
          path: requirement.path!,
          error: data.message || '加载失败',
        });
        console.error(`[GameAssetValidator] ❌ 加载失败：${key}`, requirement.path);
      });

      // 根据类型加载资源
      switch (requirement.type) {
        case 'image':
          if (!this.scene.textures.exists(key)) {
            this.scene.load.image(key, requirement.path);
          }
          break;
        case 'audio':
          if (!this.scene.sound.exists(key)) {
            this.scene.load.audio(key, requirement.path);
          }
          break;
        case 'json':
          this.scene.load.json(key, requirement.path);
          break;
        case 'spritesheet':
          if (!this.scene.textures.exists(key)) {
            this.scene.load.spritesheet(key, requirement.path, {
              frameWidth: 32,
              frameHeight: 32,
            });
          }
          break;
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        result.invalidAssets.push({
          key,
          type: requirement.type,
          path: requirement.path!,
          error: `加载超时 (${this.validationTimeout}ms)`,
        });
      } else {
        result.invalidAssets.push({
          key,
          type: requirement.type,
          path: requirement.path!,
          error: error.message || '网络请求失败',
        });
      }
      
      console.error(`[GameAssetValidator] ❌ 资源不可用：${key}`, requirement.path, error);
    }
  }

  /**
   * 检查资源是否已在 Phaser 中存在
   */
  private checkAssetExists(key: string, type: string): boolean {
    switch (type) {
      case 'image':
      case 'spritesheet':
        return this.scene.textures.exists(key);
      case 'audio':
        return this.scene.sound.exists(key);
      case 'json':
        return true; // JSON 无法预先检查
      default:
        return false;
    }
  }

  /**
   * 构建缺失资源错误信息
   */
  private buildMissingAssetsError(missingAssets: Array<{ key: string; type: string; expectedPath?: string }>): string {
    const details = missingAssets.map(asset => 
      `  - ${asset.key} (${asset.type})${asset.expectedPath ? ': ' + asset.expectedPath : ''}`
    ).join('\n');
    
    return `缺少 ${missingAssets.length} 个必需资源:\n${details}\n\n请确保这些资源已正确配置并可访问`;
  }

  /**
   * 构建无效资源错误信息
   */
  private buildInvalidAssetsError(invalidAssets: Array<{ key: string; type: string; path: string; error: string }>): string {
    const details = invalidAssets.map(asset => 
      `  - ${asset.key} (${asset.type}): ${asset.error}\n    路径：${asset.path}`
    ).join('\n');
    
    return `${invalidAssets.length} 个资源加载失败:\n${details}`;
  }

  /**
   * 清除所有注册的资源
   */
  clear(): void {
    this.requiredAssets.clear();
  }
}
