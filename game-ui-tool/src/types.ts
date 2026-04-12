/**
 * 游戏素材生成 API 类型定义
 */

/** 文生图请求参数 */
export interface Txt2ImgOptions {
  /** 正向提示词 */
  prompt: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 采样步数 */
  steps?: number;
  /** CFG 引导强度 */
  cfgScale?: number;
  /** 随机种子 (-1 随机) */
  seed?: number;
  /** 每批数量 */
  batchSize?: number;
  /** 生成批数 */
  batchCount?: number;
  /** 采样器 */
  sampler?: string;
  /** 脸部修复 */
  restoreFaces?: boolean;
  /** 高清修复 */
  enableHiresFix?: boolean;
  /** 高清修复重绘幅度 */
  denoisingStrength?: number;
  /** 指定模型 */
  model?: string;
}

/** 图生图请求参数 */
export interface Img2ImgOptions extends Txt2ImgOptions {
  /** 初始图片 (base64) */
  initImages: string[];
  /** 重绘幅度 (0-1) */
  denoisingStrength: number;
  /** 缩放模式 */
  resizeMode?: 0 | 1 | 2;
}

/** 局部重绘请求参数 */
export interface InpaintingOptions extends Img2ImgOptions {
  /** 遮罩图片 (base64) */
  mask: string;
  /** 遮罩模糊度 */
  maskBlur?: number;
  /** 重绘填充模式 */
  inpaintingFill?: 0 | 1 | 2 | 3;
}

/** SD WebUI 响应 */
export interface SDResponse {
  images: string[];
  parameters: Record<string, any>;
  info: string;
}

/** SD 模型信息 */
export interface SDModel {
  title: string;
  model_name: string;
  hash: string;
  sha256: string;
  filename: string;
  config: string;
}

/** SD 采样器 */
export interface SDSampler {
  name: string;
  aliases: string[];
  options: Record<string, any>;
}

/** 生成结果 */
export interface GenerateResult {
  images: GeneratedImage[];
  seed: number;
  info: GenerationInfo;
}

/** 生成的图片 (PNG 格式) */
export interface GeneratedImage {
  /** Base64 编码 (PNG) */
  base64: string;
  /** Data URL (PNG) */
  dataUrl: string;
  /** 种子值 */
  seed: number;
}

/** 生成信息 */
export interface GenerationInfo {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  seed: number;
  model: string;
}

/** API 配置 */
export interface APIConfig {
  /** API 地址 */
  baseUrl?: string;
  /** 超时时间 (ms) */
  timeout?: number;
}

/** 游戏风格预设 */
export interface GameStyle {
  id: string;
  name: string;
  promptSuffix: string;
  negativePromptSuffix?: string;
  defaultParams: Partial<Txt2ImgOptions>;
}

/** 常用游戏 prompt 模板 */
export interface PromptTemplate {
  category: string;
  items: Record<string, string>;
}
