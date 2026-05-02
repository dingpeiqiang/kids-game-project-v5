#!/usr/bin/env node

/**
 * 将路线拆分为独立文件（一个路线一个文件）
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROUTES_DIR = path.join(__dirname, 'routes')
const LEVELS_DIR = path.join(ROUTES_DIR, 'levels')
const CUSTOM_DIR = path.join(ROUTES_DIR, 'custom')

// 确保目录存在
function ensureDirs() {
  if (!fs.existsSync(LEVELS_DIR)) {
    fs.mkdirSync(LEVELS_DIR, { recursive: true })
    console.log('✅ 创建目录:', LEVELS_DIR)
  }
  if (!fs.existsSync(CUSTOM_DIR)) {
    fs.mkdirSync(CUSTOM_DIR, { recursive: true })
    console.log('✅ 创建目录:', CUSTOM_DIR)
  }
}

// 拆分关卡路线为独立文件
function splitLevelRoutes() {
  const levelRoutesFile = path.join(ROUTES_DIR, 'level_routes.json')
  
  if (!fs.existsSync(levelRoutesFile)) {
    console.log('⚠️  level_routes.json 不存在，跳过')
    return
  }
  
  const content = fs.readFileSync(levelRoutesFile, 'utf8')
  const data = JSON.parse(content)
  
  console.log(`📦 拆分 ${Object.keys(data.routes).length} 个关卡路线...`)
  
  const indexLevels: Record<number, string> = {}
  
  Object.entries(data.routes).forEach(([levelStr, route]: [string, any]) => {
    const level = parseInt(levelStr)
    const filename = `level_${level}.json`
    
    // 创建单个路线文件
    const singleFile = {
      version: '1.0',
      lastModified: new Date().toISOString(),
      route: route
    }
    
    const outputPath = path.join(LEVELS_DIR, filename)
    fs.writeFileSync(outputPath, JSON.stringify(singleFile, null, 2), 'utf8')
    
    indexLevels[level] = filename
    console.log(`  ✅ ${filename} (${route.name})`)
  })
  
  // 创建索引文件
  const indexFile = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    levels: indexLevels,
    custom: []
  }
  
  const indexPath = path.join(ROUTES_DIR, 'index.json')
  fs.writeFileSync(indexPath, JSON.stringify(indexFile, null, 2), 'utf8')
  console.log(`  ✅ index.json (索引文件)`)
  
  console.log(`\n✅ 已拆分 ${Object.keys(indexLevels).length} 个关卡路线到 levels/ 目录`)
}

// 拆分自定义路线为独立文件
function splitCustomRoutes() {
  const customRoutesFile = path.join(ROUTES_DIR, 'custom_routes.json')
  
  if (!fs.existsSync(customRoutesFile)) {
    console.log('⚠️  custom_routes.json 不存在，跳过')
    return
  }
  
  const content = fs.readFileSync(customRoutesFile, 'utf8')
  const data = JSON.parse(content)
  
  if (!data.routes || data.routes.length === 0) {
    console.log('⚠️  没有自定义路线，跳过')
    return
  }
  
  console.log(`\n📦 拆分 ${data.routes.length} 条自定义路线...`)
  
  const customFiles: string[] = []
  
  data.routes.forEach((route: any, index: number) => {
    const filename = `custom_${index + 1}.json`
    
    const singleFile = {
      version: '1.0',
      lastModified: new Date().toISOString(),
      route: route
    }
    
    const outputPath = path.join(CUSTOM_DIR, filename)
    fs.writeFileSync(outputPath, JSON.stringify(singleFile, null, 2), 'utf8')
    
    customFiles.push(filename)
    console.log(`  ✅ ${filename} (${route.name})`)
  })
  
  // 更新索引文件中的自定义路线列表
  const indexPath = path.join(ROUTES_DIR, 'index.json')
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8')
    const index = JSON.parse(indexContent)
    index.custom = customFiles
    index.lastModified = new Date().toISOString()
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
    console.log(`  ✅ 更新 index.json`)
  }
  
  console.log(`\n✅ 已拆分 ${customFiles.length} 条自定义路线到 custom/ 目录`)
}

// 主函数
function main() {
  console.log('🐉 拆分路线为独立文件\n')
  
  ensureDirs()
  console.log()
  splitLevelRoutes()
  splitCustomRoutes()
  
  console.log('\n✅ 所有路线已拆分为独立文件！')
  console.log('\n目录结构:')
  console.log('routes/')
  console.log('├── index.json          # 索引文件')
  console.log('├── levels/             # 关卡路线')
  console.log('│   ├── level_1.json')
  console.log('│   ├── level_3.json')
  console.log('│   └── ...')
  console.log('└── custom/             # 自定义路线')
  console.log('    ├── custom_1.json')
  console.log('    └── ...')
  console.log('\n下一步:')
  console.log('1. 启动游戏: npm run dev')
  console.log('2. 游戏会自动从 levels/ 和 custom/ 加载路线')
  console.log('3. 每个路线都是独立的 JSON 文件，便于管理')
}

main()
