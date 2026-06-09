export interface BackgroundConfig {
  color: string
  parallaxLayers?: { image: string; speed: number; y: number }[]
  stars?: { count: number; speed: number; colors: string[] }
  clouds?: { count: number; speed: number; sizes: number[] }
}