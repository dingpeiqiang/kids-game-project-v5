/**
 * sd-webui-aki API 封装
 * 
 * 使用方法:
 * ```typescript
 * import { SDWebUI } from 'game-asset-generator';
 * 
 * const sd = new SDWebUI('http://localhost:7860');
 * 
 * // 文生图
 * const result = await sd.txt2img({
 *   prompt: 'a cute cat',
 *   width: 512,
 *   height: 512
 * });
 * 
 * // 保存图片
 * result.images[0].save('cat.png');
 * 
 * // 图生图
 * const result2 = await sd.img2img({
 *   prompt: 'a dog',
 *   initImages: [result.images[0].base64],
 *   denoisingStrength: 0.7
 * });
 * ```
 */

import axios, { AxiosInstance } from 'axios';
import type {
  Txt2ImgOptions,
  Img2ImgOptions,
  InpaintingOptions,
  SDResponse,
  SDModel,
  SDSampler,
  GenerateResult,
  GeneratedImage,
  GenerationInfo,
  GameStyle,
  PromptTemplate,
  APIConfig,
} from './types.js';

// ============== 游戏风格预设 ==============

/** 游戏风格预设列表 */
export const GAME_STYLES: GameStyle[] = [
  {
    id: 'pixel-art',
    name: '像素艺术',
    promptSuffix: ', pixel art style, 8-bit, 16-bit, retro game art, crisp pixels',
    negativePromptSuffix: 'photorealistic, 3d render, smooth, blurry',
    defaultParams: { steps: 20, cfgScale: 7, width: 512, height: 512, sampler: 'Euler' },
  },
  {
    id: 'cartoon',
    name: '卡通风格',
    promptSuffix: ', cartoon style, vibrant colors, animated, cartoonish, cute',
    negativePromptSuffix: 'realistic, photograph, dark, horror',
    defaultParams: { steps: 25, cfgScale: 8, width: 512, height: 512, sampler: 'DPM++ 2M Karras' },
  },
  {
    id: 'fantasy',
    name: '奇幻风格',
    promptSuffix: ', fantasy art, magical, ethereal, mystical, epic fantasy',
    negativePromptSuffix: 'modern, sci-fi, futuristic',
    defaultParams: { steps: 30, cfgScale: 9, width: 768, height: 768, sampler: 'DPM++ 2M Karras' },
  },
  {
    id: 'scifi',
    name: '科幻风格',
    promptSuffix: ', sci-fi, science fiction, futuristic, space, robot, cyberpunk',
    negativePromptSuffix: 'medieval, fantasy, ancient',
    defaultParams: { steps: 25, cfgScale: 8, width: 768, height: 512, sampler: 'Euler a' },
  },
  {
    id: 'medieval',
    name: '中世纪',
    promptSuffix: ', medieval style, castle, knight, renaissance, classic European art',
    negativePromptSuffix: 'modern, futuristic, sci-fi',
    defaultParams: { steps: 30, cfgScale: 8, width: 768, height: 512, sampler: 'DPM++ 2M Karras' },
  },
  {
    id: 'horror',
    name: '恐怖风格',
    promptSuffix: ', horror art, dark, spooky, eerie, creepy, halloween, gothic',
    negativePromptSuffix: 'cute, cheerful, bright, colorful',
    defaultParams: { steps: 25, cfgScale: 10, width: 512, height: 512, sampler: 'DPM++ 2M' },
  },
  {
    id: 'minimalist',
    name: '简约风格',
    promptSuffix: ', minimalist, flat design, simple, clean lines, vector art',
    negativePromptSuffix: 'complex, detailed, cluttered, ornate',
    defaultParams: { steps: 20, cfgScale: 6, width: 512, height: 512, sampler: 'Euler' },
  },
  {
    id: 'chibi',
    name: 'Q版风格',
    promptSuffix: ', chibi style, super deformed, cute anime, big head, kawaii',
    negativePromptSuffix: 'realistic, mature, scary',
    defaultParams: { steps: 25, cfgScale: 8, width: 512, height: 512, sampler: 'Euler a' },
  },
  {
    id: 'watercolor',
    name: '水彩风格',
    promptSuffix: ', watercolor painting, soft colors, artistic, hand painted',
    negativePromptSuffix: 'digital, sharp edges, 3d render',
    defaultParams: { steps: 30, cfgScale: 7, width: 512, height: 512, sampler: 'DPM++ 2M Karras' },
  },
  {
    id: 'hand-drawn',
    name: '手绘风格',
    promptSuffix: ', hand drawn, pencil sketch, pen and ink, line art, sketch',
    negativePromptSuffix: 'digital, smooth, 3d render',
    defaultParams: { steps: 25, cfgScale: 7, width: 512, height: 512, sampler: 'Euler' },
  },
];

// ============== Prompt 模板 ==============

/** 常用游戏 Prompt 模板 */
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    category: '角色',
    items: {
      hero: 'game hero character, brave warrior, armor, sword, ready for battle, full body',
      mage: 'game mage character, wizard, robes, magic staff, spellcasting pose',
      rogue: 'game thief character, hood, daggers, stealthy pose, dark cloak',
      knight: 'game knight character, full plate armor, shield, helmet, heroic pose',
      princess: 'game princess character, elegant dress, crown, royal pose',
      zombie: 'game zombie enemy character, undead, tattered clothes, menacing',
      skeleton: 'game skeleton enemy character, bones, glowing eyes',
      dragon: 'game dragon boss character, huge wings, fire breath, menacing',
    },
  },
  {
    category: '道具',
    items: {
      sword: 'fantasy sword weapon, detailed, game item icon, glowing runes',
      axe: 'battle axe weapon, sharp blade, wooden handle, game item',
      shield: 'shield, medieval, ornate design, game item icon',
      potion: 'magic potion bottle, glowing liquid, colorful, game item',
      chest: 'treasure chest, golden, open, coins and gems inside, game loot',
      gem: 'precious gem crystal, glowing, valuable, game item icon',
      ring: 'magic ring, glowing runes, fantasy, game item',
      scroll: 'magic scroll, ancient, mysterious symbols, game item',
    },
  },
  {
    category: '场景',
    items: {
      forest: 'magical forest background, trees, sunlight, game scene',
      dungeon: 'dark dungeon interior, stone walls, torchlight, game background',
      castle: 'fantasy castle exterior, grand, detailed, game background',
      village: 'cozy medieval village, cottages, game background',
      cave: 'underground cave, crystals, dark, game background',
      volcano: 'volcano landscape, lava, fire, game background',
      underwater: 'underwater scene, coral, fish, ocean, game background',
      space: 'outer space, stars, planets, nebula, game background',
    },
  },
  {
    category: 'UI元素',
    items: {
      button: 'game UI button, clean design, simple, pixel art',
      icon: 'game item icon, clean, minimal, vector style',
      frame: 'decorative frame, game UI element, ornate border',
      badge: 'achievement badge, game reward, shiny gold',
      health: 'health bar UI, game interface, red gradient',
      mana: 'mana bar UI, game interface, blue gradient',
      cursor: 'game cursor, pointer, pixel art style',
      trophy: 'trophy, golden, victory, achievement',
    },
  },
  {
    category: '怪物',
    items: {
      slime: 'game slime monster, cute, bouncy, colorful jelly',
      goblin: 'game goblin enemy, green skin, pointy ears, mischievous',
      orc: 'game orc enemy, muscular, tusks, battle axe',
      ghost: 'game ghost enemy, ethereal, transparent, floating',
      demon: 'game demon boss, horns, wings, fire, dark aura',
      alien: 'game alien enemy, futuristic, tentacles, glowing eyes',
      golem: 'game golem enemy, stone body, glowing core, powerful',
      spider: 'game spider enemy, huge, eight legs, web',
    },
  },
  {
    category: '背景',
    items: {
      sky: 'game sky background, clouds, blue sky, parallax',
      ground: 'game ground tileset, grass, dirt, platformer',
      brick: 'game brick wall, tileset, medieval',
      water: 'game water surface, animated, waves, tileset',
      lava: 'game lava tileset, flowing, dangerous, volcano',
      ice: 'game ice tileset, frozen, slippery, winter',
      clouds: 'game clouds background, soft, parallax',
      stars: 'game starfield background, space, twinkling',
    },
  },
];

// ============== 主类 ==============

export class SDWebUI {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: string | APIConfig = 'http://localhost:7860') {
    const url = typeof config === 'string' ? config : config.baseUrl || 'http://localhost:7860';
    const timeout = typeof config === 'string' ? 300000 : config.timeout || 300000;
    
    this.baseUrl = url;
    this.client = axios.create({
      baseURL: url,
      timeout,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** 获取 API 地址 */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** 设置 API 地址 */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * 检查连接
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.get('/sdapi/v1/samplers', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<SDModel[]> {
    const response = await this.client.get<SDModel[]>('/sdapi/v1/sd-models');
    return response.data;
  }

  /**
   * 获取可用采样器列表
   */
  async getSamplers(): Promise<SDSampler[]> {
    const response = await this.client.get<SDSampler[]>('/sdapi/v1/samplers');
    return response.data;
  }

  /**
   * 获取当前选项
   */
  async getOptions(): Promise<Record<string, any>> {
    const response = await this.client.get<Record<string, any>>('/sdapi/v1/options');
    return response.data;
  }

  /**
   * 设置选项
   */
  async setOptions(options: Record<string, any>): Promise<void> {
    await this.client.post('/sdapi/v1/options', options);
  }

  /**
   * 切换模型
   */
  async setModel(modelName: string): Promise<void> {
    await this.setOptions({ sd_model_checkpoint: modelName });
  }

  /**
   * 中止当前生成
   */
  async interrupt(): Promise<void> {
    await this.client.post('/sdapi/v1/interrupt');
  }

  /**
   * 文生图
   */
  async txt2img(options: Txt2ImgOptions): Promise<GenerateResult> {
    const request = this.buildTxt2ImgRequest(options);
    const response = await this.client.post<SDResponse>('/sdapi/v1/txt2img', request);
    return this.parseResponse(response.data, request);
  }

  /**
   * 图生图
   */
  async img2img(options: Img2ImgOptions): Promise<GenerateResult> {
    const request = this.buildImg2ImgRequest(options);
    const response = await this.client.post<SDResponse>('/sdapi/v1/img2img', request);
    return this.parseResponse(response.data, request);
  }

  /**
   * 局部重绘 (Inpainting)
   */
  async inpainting(options: InpaintingOptions): Promise<GenerateResult> {
    const request = this.buildInpaintingRequest(options);
    const response = await this.client.post<SDResponse>('/sdapi/v1/img2img', request);
    return this.parseResponse(response.data, request);
  }

  /**
   * 使用游戏风格生成
   */
  async generateWithStyle(
    prompt: string,
    styleId: string,
    options: Partial<Txt2ImgOptions> = {}
  ): Promise<GenerateResult> {
    const style = GAME_STYLES.find(s => s.id === styleId);
    if (!style) {
      throw new Error(`未找到风格: ${styleId}`);
    }

    const fullPrompt = `${prompt}${style.promptSuffix}`;
    const fullNegative = options.negativePrompt 
      ? `${options.negativePrompt}${style.negativePromptSuffix || ''}`
      : style.negativePromptSuffix || '';

    return this.txt2img({
      prompt: fullPrompt,
      negativePrompt: fullNegative,
      ...style.defaultParams,
      ...options,
    });
  }

  /**
   * 使用 Prompt 模板生成
   */
  async generateFromTemplate(
    templateCategory: string,
    templateKey: string,
    styleId: string,
    options: Partial<Txt2ImgOptions> = {}
  ): Promise<GenerateResult> {
    const category = PROMPT_TEMPLATES.find(c => c.category === templateCategory);
    if (!category) {
      throw new Error(`未找到模板分类: ${templateCategory}`);
    }

    const prompt = category.items[templateKey];
    if (!prompt) {
      throw new Error(`未找到模板: ${templateCategory}.${templateKey}`);
    }

    return this.generateWithStyle(prompt, styleId, options);
  }

  /**
   * 批量生成
   */
  async batchGenerate(
    prompts: string[],
    styleId: string,
    options: Partial<Txt2ImgOptions> = {}
  ): Promise<GenerateResult[]> {
    return Promise.all(
      prompts.map(prompt => this.generateWithStyle(prompt, styleId, options))
    );
  }

  /**
   * 列出所有游戏风格
   */
  listStyles(): GameStyle[] {
    return GAME_STYLES;
  }

  /**
   * 列出所有 Prompt 模板
   */
  listTemplates(): PromptTemplate[] {
    return PROMPT_TEMPLATES;
  }

  // ============== 私有方法 ==============

  private buildTxt2ImgRequest(options: Txt2ImgOptions): Record<string, any> {
    const req: Record<string, any> = {
      prompt: options.prompt,
      negative_prompt: options.negativePrompt || '',
      width: options.width || 512,
      height: options.height || 512,
      steps: options.steps || 25,
      cfg_scale: options.cfgScale || 7,
      seed: options.seed ?? -1,
      batch_size: options.batchSize || 1,
      n_iter: options.batchCount || 1,
      sampler_name: options.sampler || 'Euler',
      restore_faces: options.restoreFaces || false,
      enable_hr: options.enableHiresFix || false,
      // 强制输出 PNG 格式（游戏素材必须使用 PNG）
      format: 'png',
    };

    if (options.enableHiresFix) {
      req.hr_scale = 2;
      req.hr_upscaler = 'Latent';
      req.denoising_strength = options.denoisingStrength || 0.5;
    }

    if (options.model) {
      req.override_settings = { sd_model_checkpoint: options.model };
    }

    return req;
  }

  private buildImg2ImgRequest(options: Img2ImgOptions): Record<string, any> {
    return {
      ...this.buildTxt2ImgRequest(options),
      init_images: options.initImages,
      denoising_strength: options.denoisingStrength,
      resize_mode: options.resizeMode ?? 0,
    };
  }

  private buildInpaintingRequest(options: InpaintingOptions): Record<string, any> {
    return {
      ...this.buildImg2ImgRequest(options),
      mask: options.mask,
      mask_blur: options.maskBlur ?? 4,
      inpainting_fill: options.inpaintingFill ?? 1,
      inpaint_full_res: false,
      inpaint_full_res_padding: 0,
      inpainting_mask_invert: 0,
    };
  }

  private parseResponse(response: SDResponse, request: Record<string, any>): GenerateResult {
    const info = JSON.parse(response.info);
    const seed = info.seed || 0;

    const images: GeneratedImage[] = response.images.map(base64 => ({
      base64,
      dataUrl: `data:image/png;base64,${base64}`,
      seed,
    }));

    const genInfo: GenerationInfo = {
      prompt: request.prompt,
      negativePrompt: request.negative_prompt,
      width: request.width,
      height: request.height,
      steps: request.steps,
      cfgScale: request.cfg_scale,
      sampler: request.sampler_name,
      seed,
      model: request.override_settings?.sd_model_checkpoint || '',
    };

    return { images, seed, info: genInfo };
  }

  /**
   * Base64 转文件 Buffer
   */
  static base64ToBuffer(base64: string): Buffer {
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(data, 'base64');
  }

  /**
   * 文件转 Base64
   */
  static async fileToBase64(filePath: string): Promise<string> {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  }
}

// ============== 快捷函数 ==============

/** 创建默认实例 */
export function createSDClient(baseUrl = 'http://localhost:7860'): SDWebUI {
  return new SDWebUI(baseUrl);
}

/** 列出所有可用的游戏风格 */
export function listGameStyles(): GameStyle[] {
  return GAME_STYLES;
}

/** 列出所有可用的 Prompt 模板 */
export function listPromptTemplates(): PromptTemplate[] {
  return PROMPT_TEMPLATES;
}

// ============== 导出类型 ==============
export type {
  Txt2ImgOptions,
  Img2ImgOptions,
  InpaintingOptions,
  SDModel,
  SDSampler,
  GenerateResult,
  GeneratedImage,
  GenerationInfo,
  GameStyle,
  PromptTemplate,
};
