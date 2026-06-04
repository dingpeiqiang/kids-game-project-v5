/**
 * PVZ 游戏资源配置示例
 * 
 * 展示如何通过配置文件定义PVZ游戏的资源
 */

import type { GameResourceConfig } from '../types/resource-manager-config';
import { ResourceType, ResourceCategory } from '../types/resource-manager-config';

/**
 * PVZ 默认主题资源配置
 */
export const pvzDefaultThemeConfig: GameResourceConfig = {
  gameId: 'pvz',
  gameName: '植物大战僵尸',
  gameType: 'tower-defense',
  themeId: 'pvz',
  themeName: 'PVZ 默认主题',
  themeBasePath: '/themes/pvz',
  gtrsConfigPath: '/themes/pvz/GTRS.json',
  
  // 尺寸规格配置（用于AI生成）
  sizeSpecs: {
    plant: { width: 80, height: 80, note: '植物角色标准尺寸' },
    zombie: { width: 60, height: 120, note: '僵尸角色标准尺寸' },
    pea: { width: 15, height: 15, note: '豌豆子弹，代码会放大 2x' },
    sun: { width: 80, height: 80, note: '阳光，代码会缩小到 55%' },
    mower: { width: 100, height: 60, note: '割草机，代码会缩小到 70%' },
    background: { width: 1100, height: 580, note: '游戏全屏背景 1100x580' }
  },
  
  // AI生成提示词
  prompts: {
    peashooter: 'Plants vs Zombies pea shooter, green pod creature with red mouth, cute cartoon style, standing pose, bright green stem, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    sunflower: 'Plants vs Zombies sunflower, bright yellow petals, cheerful smiling face, orange center, green stem and leaves, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    wallnut: 'Plants vs Zombies wall-nut, brown walnut with worried expression, thick shell texture, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    iceshooter: 'Plants vs Zombies snow pea, icy blue body, light blue pods, cold frost effect, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    repeater: 'Plants vs Zombies repeater, two pea pods connected, bright green, angry red mouth, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    cherrybomb: 'Plants vs Zombies cherry bomb, two bright red cherries with angry face, green stem and leaves, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    potatomine: 'Plants vs Zombies potato mine, brown potato with mining face, dirt particles, cute cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    zombie_normal: 'Plants vs Zombies zombie, shambling dead, torn purple shirt, gray skin, green hair, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    zombie_conehead: 'Plants vs Zombies conehead zombie, orange traffic cone on head, torn purple shirt, gray skin, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    zombie_buckethead: 'Plants vs Zombies buckethead zombie, gray metal bucket on head, torn purple shirt, gray skin, arms outstretched, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    zombie_newspaper: 'Plants vs Zombies newspaper zombie, holding newspaper, torn purple shirt, gray skin, shambling pose, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete character, clean edges',
    sun: 'Plants vs Zombies sun, bright yellow circle, cheerful smiling face, glowing rays, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges',
    lawnmower: 'Plants vs Zombies lawn mower, red motorized mower, cog wheels, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges',
    shovel: 'Plants vs Zombies shovel, wooden handle, metal blade, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges',
    pea: 'Plants vs Zombies pea projectile, bright green circle, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges',
    ice_pea: 'Plants vs Zombies ice pea, icy blue circle, frost effect, cartoon style, pure white background, transparent background, isolated subject, centered, no shadow, fully visible, complete object, clean edges',
    grass: 'Plants vs Zombies grass tile, green grass texture, cartoon style, seamless, game background',
    sprites: 'Plants vs Zombies sprite sheet, multiple plant zombie sprites, grid layout, cartoon style, game sprite atlas'
  },
  
  // 生成配置
  generationConfig: {
    defaultSteps: 30,
    defaultCfgScale: 7.5,
    enableHiresFix: true,
    hrUpscaler: 'R-ESRGAN 4x+',
    hrScale: 2,
    denoisingStrength: 0.45
  },
  
  // 资源分组（这个会被GTRS.json动态覆盖，这里只是作为fallback）
  groups: [
    {
      name: '植物角色',
      description: '可种植的植物角色',
      icon: '🌱',
      resources: [
        {
          key: 'peashooter',
          alias: '豌豆射手',
          type: ResourceType.IMAGE,
          category: ResourceCategory.SCENE,
          path: '/assets/scene/peashooter.png',
          filename: 'peashooter.png',
          size: { width: 80, height: 80 },
          format: 'png',
          prompt: 'Plants vs Zombies pea shooter, green pod creature with red mouth, cute cartoon style',
          tags: ['plant', 'shooter']
        },
        {
          key: 'sunflower',
          alias: '向日葵',
          type: ResourceType.IMAGE,
          category: ResourceCategory.SCENE,
          path: '/assets/scene/sunflower.png',
          filename: 'sunflower.png',
          size: { width: 80, height: 80 },
          format: 'png',
          prompt: 'Plants vs Zombies sunflower, bright yellow petals, cheerful smiling face',
          tags: ['plant', 'producer']
        }
        // ... 更多植物
      ],
      collapsible: true,
      defaultExpanded: true
    },
    {
      name: '僵尸角色',
      description: '敌人僵尸角色',
      icon: '🧟',
      resources: [
        {
          key: 'zombie_normal',
          alias: '普通僵尸',
          type: ResourceType.IMAGE,
          category: ResourceCategory.SCENE,
          path: '/assets/scene/zombie_normal.png',
          filename: 'zombie_normal.png',
          size: { width: 60, height: 120 },
          format: 'png',
          prompt: 'Plants vs Zombies zombie, shambling dead, torn purple shirt',
          tags: ['zombie', 'basic']
        }
        // ... 更多僵尸
      ],
      collapsible: true,
      defaultExpanded: false
    }
  ]
};

/**
 * 创建PVZ资源配置的工厂函数
 * 从GTRS.json动态加载配置
 */
export async function createPVZResourceConfig(
  themeId: string = 'pvz',
  themeBasePath: string = '/themes/pvz'
): Promise<GameResourceConfig> {
  // 这里会调用 loadGameResourceConfig 从 GTRS.json 加载
  // 返回的配置将包含所有从GTRS解析的资源
  return pvzDefaultThemeConfig;
}
