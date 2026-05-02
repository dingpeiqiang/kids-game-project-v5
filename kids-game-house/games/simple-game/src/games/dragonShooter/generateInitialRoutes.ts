#!/usr/bin/env node

/**
 * 生成初始路线 JSON 文件
 * 将硬编码的路线转换为 JSON 格式
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CENTER_X = 180
const BASE_H = 640
const TOTAL_POINTS = 1600

// 生成路线点
function generateRoutePoints(type: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  
  for (let i = 0; i <= TOTAL_POINTS; i++) {
    const progress = i / TOTAL_POINTS
    
    switch (type) {
      case 'wave':
        // 简单波浪：振幅小，频率低
        points.push({
          x: CENTER_X + Math.sin(progress * Math.PI * 4) * 40,
          y: -200 + progress * (BASE_H + 400)
        })
        break
        
      case 'zigzag':
        // Z字形：左右快速切换
        const zigzag = Math.sin(progress * Math.PI * 12) > 0 ? 1 : -1
        points.push({
          x: CENTER_X + zigzag * 80,
          y: -200 + progress * (BASE_H + 400)
        })
        break
        
      case 'spiral':
        // 螺旋：旋转下降
        const radius = 60 + progress * 30
        points.push({
          x: CENTER_X + Math.cos(progress * Math.PI * 16) * radius,
          y: -200 + progress * (BASE_H + 400)
        })
        break
        
      case 'boss':
        // BOSS路线：复杂曲线
        const wave1 = Math.sin(progress * Math.PI * 6) * 50
        const wave2 = Math.cos(progress * Math.PI * 10) * 30
        points.push({
          x: CENTER_X + wave1 + wave2,
          y: -200 + progress * (BASE_H + 400)
        })
        break
        
      default:
        points.push({
          x: CENTER_X,
          y: -200 + progress * (BASE_H + 400)
        })
    }
  }
  
  return points
}

// 生成关卡路线文件
function generateLevelRoutes() {
  const routes = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    routes: {
      '1': {
        id: 'level_1_easy',
        name: '第1关 - 简单波浪',
        points: generateRoutePoints('wave')
      },
      '3': {
        id: 'level_3_zigzag',
        name: '第3关 - Z字形',
        points: generateRoutePoints('zigzag')
      },
      '5': {
        id: 'level_5_spiral',
        name: '第5关 - 螺旋挑战',
        points: generateRoutePoints('spiral')
      },
      '10': {
        id: 'level_10_boss',
        name: '第10关 - BOSS战场',
        points: generateRoutePoints('boss')
      }
    }
  }
  
  const outputPath = path.join(__dirname, 'routes', 'level_routes.json')
  fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2), 'utf8')
  
  console.log(`✅ 已生成关卡路线文件: ${outputPath}`)
  console.log(`   包含 ${Object.keys(routes.routes).length} 个关卡`)
  console.log(`   每个关卡 ${TOTAL_POINTS + 1} 个点`)
  
  // 统计总点数
  let totalPoints = 0
  Object.values(routes.routes).forEach((route: any) => {
    totalPoints += route.points.length
  })
  console.log(`   总计 ${totalPoints} 个点`)
}

// 生成空的自定义路线文件
function generateCustomRoutes() {
  const customRoutes = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    routes: []
  }
  
  const outputPath = path.join(__dirname, 'routes', 'custom_routes.json')
  
  // 如果文件不存在才创建
  if (!fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, JSON.stringify(customRoutes, null, 2), 'utf8')
    console.log(`✅ 已创建空的自定义路线文件: ${outputPath}`)
  } else {
    console.log(`⚠️  自定义路线文件已存在，跳过: ${outputPath}`)
  }
}

// 主函数
function main() {
  console.log('🐉 生成 Dragon Shooter 路线文件\n')
  
  generateLevelRoutes()
  console.log()
  generateCustomRoutes()
  
  console.log('\n✅ 所有文件生成完成！')
  console.log('\n下一步：')
  console.log('1. 启动游戏: npm run dev')
  console.log('2. 游戏会自动加载 routes/ 目录中的 JSON 文件')
  console.log('3. 修改 JSON 文件后刷新浏览器即可看到效果')
}

main()
