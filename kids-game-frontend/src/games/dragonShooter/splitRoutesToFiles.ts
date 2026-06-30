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
  }
  if (!fs.existsSync(CUSTOM_DIR)) {
    fs.mkdirSync(CUSTOM_DIR, { recursive: true })
  }
}

// 拆分关卡路线为独立文件
function splitLevelRoutes() {
  const levelRoutesFile = path.join(ROUTES_DIR, 'level_routes.json')
  
  if (!fs.existsSync(levelRoutesFile)) {
    return
  }
  
  const content = fs.readFileSync(levelRoutesFile, 'utf8')
  const data = JSON.parse(content)
  
  
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
  
}

// 拆分自定义路线为独立文件
function splitCustomRoutes() {
  const customRoutesFile = path.join(ROUTES_DIR, 'custom_routes.json')
  
  if (!fs.existsSync(customRoutesFile)) {
    return
  }
  
  const content = fs.readFileSync(customRoutesFile, 'utf8')
  const data = JSON.parse(content)
  
  if (!data.routes || data.routes.length === 0) {
    return
  }
  
  
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
  })
  
  // 更新索引文件中的自定义路线列表
  const indexPath = path.join(ROUTES_DIR, 'index.json')
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8')
    const index = JSON.parse(indexContent)
    index.custom = customFiles
    index.lastModified = new Date().toISOString()
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
  }
  
}

// 主函数
function main() {
  
  ensureDirs()
  splitLevelRoutes()
  splitCustomRoutes()
  
}

main()
