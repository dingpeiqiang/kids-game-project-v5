/**
 * 程序化地形生成器
 * 使用 Value Noise + FBM（分形布朗运动）生成自然地形曲线
 * 替代手写 SVG 路径，支持多种地形风格
 */

/** 地形风格类型 */
export type TerrainStyle = 'gentle' | 'hilly' | 'mountain' | 'canyon' | 'desert'

/** 地形配置 */
export interface TerrainConfig {
  style: TerrainStyle
  totalWidth: number          // 地形总宽度（世界坐标，水平方向）
  segments: number            // 曲线段数
  baseY: number               // 基准 Y 坐标（高度）
  amplitude: number           // 振幅（地形起伏高度）
  frequency: number           // 频率（起伏频率）
  roughness: number           // 粗糙度（0-1，越大越崎岖）
  downwardSlope: number       // 下行坡度（0 = 水平，正数 = 向下倾斜）
  smoothing: number           // 平滑度（0-1，越大越平滑）
}

/** 预设地形配置 */
export const TERRAIN_PRESETS: Record<TerrainStyle, Omit<TerrainConfig, 'totalWidth' | 'segments' | 'baseY'>> = {
  gentle: {
    style: 'gentle',
    amplitude: 15,
    frequency: 0.003,
    roughness: 0.2,
    downwardSlope: 0.015,
    smoothing: 0.8
  },
  hilly: {
    style: 'hilly',
    amplitude: 35,
    frequency: 0.006,
    roughness: 0.4,
    downwardSlope: 0.02,
    smoothing: 0.6
  },
  mountain: {
    style: 'mountain',
    amplitude: 55,
    frequency: 0.005,
    roughness: 0.6,
    downwardSlope: 0.025,
    smoothing: 0.5
  },
  canyon: {
    style: 'canyon',
    amplitude: 70,
    frequency: 0.008,
    roughness: 0.8,
    downwardSlope: 0.03,
    smoothing: 0.3
  },
  desert: {
    style: 'desert',
    amplitude: 20,
    frequency: 0.002,
    roughness: 0.3,
    downwardSlope: 0.01,
    smoothing: 0.9
  }
}

/**
 * Value Noise 实现
 */
class ValueNoise {
  private seed: number

  constructor(seed: number = 42) {
    this.seed = seed
  }

  /** 伪随机哈希 */
  private hash(n: number): number {
    const x = Math.sin(n * 127.1 + this.seed * 311.7) * 43758.5453123
    return x - Math.floor(x)
  }

  /** 平滑插值 */
  private lerp(a: number, b: number, t: number): number {
    const s = t * t * (3 - 2 * t)
    return a + (b - a) * s
  }

  /** 一维噪声 */
  noise1D(x: number): number {
    const i = Math.floor(x)
    const f = x - i
    return this.lerp(this.hash(i), this.hash(i + 1), f)
  }

  /** 分形布朗运动（多层噪声叠加） */
  fbm(x: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
    let value = 0
    let amp = 1
    let freq = 1
    let maxAmp = 0

    for (let i = 0; i < octaves; i++) {
      value += this.noise1D(x * freq) * amp
      maxAmp += amp
      amp *= gain
      freq *= lacunarity
    }

    return value / maxAmp
  }
}

/**
 * 地形生成器
 */
export class TerrainGenerator {
  private noise: ValueNoise

  constructor(seed?: number) {
    this.noise = new ValueNoise(seed)
  }

  /**
   * 生成地形 SVG path
   * 
   * SVG path 格式参考原始关卡数据：
   *   M -10,400 C 50,405 100,408 150,410 ...
   *   第一个坐标 = 水平位置（X）
   *   第二个坐标 = 高度位置（Y，向下增大）
   */
  generatePath(config: TerrainConfig): string {
    const { totalWidth, segments, baseY, amplitude, frequency, roughness, downwardSlope, smoothing } = config

    // 生成高度采样点：[水平x, 高度y]
    const step = totalWidth / segments
    const samples: number[][] = []

    for (let i = 0; i <= segments; i++) {
      const hX = -10 + i * step  // 水平坐标，从 -10 开始
      const noiseVal = this.noise.fbm(hX * frequency, Math.ceil(roughness * 6), 2, roughness)
      const hY = baseY + (noiseVal - 0.5) * 2 * amplitude + hX * downwardSlope
      samples.push([Math.round(hX * 10) / 10, Math.round(hY * 10) / 10])
    }

    // 平滑
    const smoothed = this.smoothSamples(samples, Math.max(1, Math.round(smoothing * 5)))

    // 转换为 SVG path
    return this.samplesToSvgPath(smoothed)
  }

  /**
   * 生成两段连续地形
   */
  generateDualPaths(
    config: TerrainConfig,
    terrain1Ratio: number = 0.6
  ): { terrain1Path: string; terrain2Path: string; terrain1Width: number; terrain2Width: number; endY: number } {
    const terrain1Width = Math.floor(config.totalWidth * terrain1Ratio)
    const terrain2Width = config.totalWidth - terrain1Width

    // 第一段
    const config1: TerrainConfig = { ...config, totalWidth: terrain1Width }
    const terrain1Path = this.generatePath(config1)

    // 获取第一段末尾高度
    const points1 = this.extractPoints(terrain1Path)
    const lastPt1 = points1[points1.length - 1]
    const endY1 = lastPt1 ? lastPt1[1] : config.baseY

    // 第二段（从第一段末尾高度继续）
    const config2: TerrainConfig = {
      ...config,
      totalWidth: terrain2Width,
      baseY: endY1 - (terrain1Width * config.downwardSlope) // 补偿：扣除第一段已产生的坡度
    }
    const terrain2Path = this.generatePath(config2)

    const points2 = this.extractPoints(terrain2Path)
    const lastPt2 = points2[points2.length - 1]
    const endY = lastPt2 ? lastPt2[1] : endY1

    return { terrain1Path, terrain2Path, terrain1Width, terrain2Width, endY }
  }

  /**
   * 根据目标距离计算终点 X 坐标
   * 与 ScoreManager 一致：distance = (carX - startX) / 10
   */
  getFinishX(targetDistance: number): number {
    return targetDistance * 10
  }

  /**
   * 平滑采样点
   */
  private smoothSamples(samples: number[][], passes: number): number[][] {
    let result = samples.map(s => [...s])

    for (let p = 0; p < passes; p++) {
      const smoothed: number[][] = [result[0]]
      for (let i = 1; i < result.length - 1; i++) {
        smoothed.push([
          (result[i - 1][0] + result[i][0] * 2 + result[i + 1][0]) / 4,
          (result[i - 1][1] + result[i][1] * 2 + result[i + 1][1]) / 4
        ])
      }
      smoothed.push(result[result.length - 1])
      result = smoothed
    }

    return result
  }

  /**
   * 将采样点转为 SVG path
   * 格式：M x0,y0 L x1,y1 L x2,y2 ...
   */
  private samplesToSvgPath(samples: number[][]): string {
    if (samples.length < 2) return ''

    let path = `M ${samples[0][0]},${samples[0][1]}`
    for (let i = 1; i < samples.length; i++) {
      path += ` L ${samples[i][0]},${samples[i][1]}`
    }
    return path
  }

  /**
   * 从 SVG path 提取坐标点
   */
  extractPoints(path: string): number[][] {
    const points: number[][] = []
    const regex = /[ML]\s*([-\d.]+)\s*,\s*([-\d.]+)/g
    let match
    while ((match = regex.exec(path)) !== null) {
      points.push([parseFloat(match[1]), parseFloat(match[2])])
    }
    return points
  }
}
