/**
 * 为 FRAMEWORK_LIFECYCLE 游戏补齐 public/themes/{gameId}/gtrs.json（仅当文件不存在）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const THEMES = path.join(ROOT, 'public/themes')
const REGISTRY = path.join(ROOT, 'src/games/gameRegistry.ts')

function extractFrameworkIds(ts) {
  const m = ts.match(/export const FRAMEWORK_LIFECYCLE_GAME_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/)
  if (!m) return []
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
}

function buildGtrs(gameId, themeName) {
  return {
    specMeta: { specName: 'GTRS', specVersion: '1.0.0', compatibleVersion: '1.0.0' },
    themeInfo: {
      themeId: `${gameId}_theme_default`,
      ownerType: 'GAME',
      ownerId: 0,
      themeName: themeName || `${gameId} 默认`,
      isDefault: true,
      gameId,
      description: `kids-game-simple ${gameId} 默认 GTRS（L1 占位，可按 GTRS_MIGRATE_TEMPLATE 扩展）`,
    },
    globalStyle: {
      primaryColor: '#6BCB77',
      secondaryColor: '#4ECDC4',
      bgColor: '#1a1a2e',
      textColor: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
    },
    resources: {
      images: {
        login: {},
        scene: {
          accent: { src: '#FFD700', type: 'png', alias: '强调色' },
          hud_bg: { src: 'rgba(0,0,0,0.45)', type: 'png', alias: 'HUD 底' },
          danger: { src: '#FF4444', type: 'png', alias: '警告' },
          game_palette: {
            src: '["#FF6B6B","#4ECDC4","#FFD93D","#6BCB77","#9B59B6","#FF9F43"]',
            type: 'png',
            alias: '色板',
          },
        },
        ui: {},
        icon: {},
        effect: {},
      },
      audio: { bgm: {}, effect: {}, voice: {} },
      video: {},
    },
  }
}

const DISPLAY = {
  memoryMatch: '翻牌配对',
  jewelMatch: '宝石消除',
  match3: '三消',
  beatDragon: '打龙',
  kingBaby: '国王宝贝',
  plantsVsZombies: '植物大战僵尸',
  plantZombieDefense2d: '植物僵尸 2D',
  plantZombieDefense: '植物僵尸 3D',
  cuteTankBattle: '萌坦克',
  rpgShooter: 'RPG 射击',
  rpgShooterTD: 'RPG 塔防',
  contraRpg: '魂斗罗',
  wangzheRpg: '王者 RPG',
  dnfRpg: 'DNF',
  skyFrenzy: '天空狂飙',
  cloudBallRush3d: '云球冲刺 3D',
}

const ids = extractFrameworkIds(fs.readFileSync(REGISTRY, 'utf8'))
const created = []
for (const gameId of ids) {
  const dir = path.join(THEMES, gameId)
  const file = path.join(dir, 'gtrs.json')
  if (fs.existsSync(file)) continue
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(buildGtrs(gameId, DISPLAY[gameId]), null, 2)}\n`)
  created.push(gameId)
}
console.log(created.length ? `Created gtrs.json for:\n${created.map((id) => '  ' + id).join('\n')}` : 'No missing gtrs.json (all framework games covered).')