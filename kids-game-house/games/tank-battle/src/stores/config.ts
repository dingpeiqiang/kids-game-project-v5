import { defineStore } from 'pinia'

interface DifficultyConfig {
  key: string
  name: string
  enemyCount: number
  spawnInterval: number
  enemySpeed: number
  timeLimit?: number
  playerLives: number
}

interface ThemeConfig {
  themeCode: string
  themeName: string
}

interface ConfigState {
  selectedDifficulty: DifficultyConfig | null
  selectedTheme: ThemeConfig | null
  customConfig: Partial<DifficultyConfig>
}

const DIFFICULTY_PRESETS: Record<string, DifficultyConfig> = {
  easy: {
    key: 'easy',
    name: '简单',
    enemyCount: 5,
    spawnInterval: 3000,
    enemySpeed: 150,
    playerLives: 5,
  },
  medium: {
    key: 'medium',
    name: '中等',
    enemyCount: 10,
    spawnInterval: 2500,
    enemySpeed: 200,
    timeLimit: 180,
    playerLives: 3,
  },
  hard: {
    key: 'hard',
    name: '困难',
    enemyCount: 15,
    spawnInterval: 2000,
    enemySpeed: 250,
    timeLimit: 120,
    playerLives: 2,
  },
  expert: {
    key: 'expert',
    name: '专家',
    enemyCount: 20,
    spawnInterval: 1500,
    enemySpeed: 300,
    timeLimit: 90,
    playerLives: 1,
  },
}

const THEMES: ThemeConfig[] = [
  {
    themeCode: 'tank_default',
    themeName: '经典坦克',
  },
]

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    selectedDifficulty: null,
    selectedTheme: THEMES[0],
    customConfig: {},
  }),

  getters: {
    getCurrentDifficulty: (state) => state.selectedDifficulty,
    getCurrentTheme: (state) => state.selectedTheme,
    getEffectiveConfig(): DifficultyConfig {
      if (!this.selectedDifficulty) {
        return DIFFICULTY_PRESETS.medium
      }
      return {
        ...DIFFICULTY_PRESETS[this.selectedDifficulty.key],
        ...this.customConfig,
      }
    },
  },

  actions: {
    setDifficulty(key: string) {
      const preset = DIFFICULTY_PRESETS[key]
      if (preset) {
        this.selectedDifficulty = { ...preset }
      }
    },

    setTheme(themeCode: string) {
      const theme = THEMES.find(t => t.themeCode === themeCode)
      if (theme) {
        this.selectedTheme = theme
      }
    },

    updateCustomConfig(config: Partial<DifficultyConfig>) {
      this.customConfig = { ...this.customConfig, ...config }
    },

    reset() {
      this.selectedDifficulty = null
      this.selectedTheme = THEMES[0]
      this.customConfig = {}
    },
  },
})
