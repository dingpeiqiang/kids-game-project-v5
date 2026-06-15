#!/usr/bin/env node

/**
 * Dragon Shooter 路线保存脚本
 * 
 * 使用方法：
 * 1. 在游戏中绘制路线并点击"保存"
 * 2. 浏览器会下载 JSON 文件
 * 3. 将文件放到 routes/ 目录
 * 4. 运行此脚本自动整合到代码中
 * 
 * 或者：
 * npm run save-routes [关卡号] [路线文件名]
 */

import * as fs from 'fs'
import * as path from 'path'
import { saveLevelRoutes, loadLevelRoutes, saveCustomRoutes, loadCustomRoutes } from './routeManager'

const ROUTES_DIR = path.join(__dirname, 'routes')
const INBOX_DIR = path.join(ROUTES_DIR, 'inbox')  // 待处理文件目录

// 确保目录存在
function ensureDirs() {
  if (!fs.existsSync(ROUTES_DIR)) {
    fs.mkdirSync(ROUTES_DIR, { recursive: true })
  }
  if (!fs.existsSync(INBOX_DIR)) {
    fs.mkdirSync(INBOX_DIR, { recursive: true })
  }
}

// 处理 inbox 中的路线文件
function processInbox(): void {
  ensureDirs()
  
  const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json'))
  
  if (files.length === 0) {
    return
  }
  
  
  files.forEach(file => {
    const filepath = path.join(INBOX_DIR, file)
    
    try {
      const content = fs.readFileSync(filepath, 'utf8')
      const data = JSON.parse(content)
      
      // 判断是关卡路线还是自定义路线
      if (data.levelSpecificRoutes) {
        // 关卡专属路线
        const existingRoutes = loadLevelRoutes()
        const mergedRoutes = { ...existingRoutes, ...data.levelSpecificRoutes }
        saveLevelRoutes(mergedRoutes)
      } else if (data.customRoutes) {
        // 自定义路线
        const existingRoutes = loadCustomRoutes()
        const mergedRoutes = [...existingRoutes, ...data.customRoutes]
        saveCustomRoutes(mergedRoutes)
      } else {
        console.warn(`⚠️  未知格式的文件: ${file}`)
      }
      
      // 移动到 processed 目录
      const processedDir = path.join(INBOX_DIR, 'processed')
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const processedFile = path.join(processedDir, file.replace('.json', `_${timestamp}.json`))
      fs.renameSync(filepath, processedFile)
      
    } catch (error) {
      console.error(`❌ 处理文件失败 ${file}:`, error)
    }
  })
}

// 生成 TypeScript 代码片段
function generateTypeScriptCode(): void {
  const levelRoutes = loadLevelRoutes()
  const customRoutes = loadCustomRoutes()
  
  let code = '// ============================================\n'
  code += '// Dragon Shooter 关卡路线配置\n'
  code += '// 自动生成，请勿手动修改\n'
  code += `// 生成时间: ${new Date().toISOString()}\n`
  code += '// ============================================\n\n'
  
  code += 'import type { CustomRoute } from \'./types\'\n\n'
  code += '// 关卡专属路线配置\n'
  code += 'export const LEVEL_SPECIFIC_ROUTES: Record<number, CustomRoute> = {\n'
  
  const levels = Object.keys(levelRoutes).map(Number).sort((a, b) => a - b)
  levels.forEach((level, index) => {
    const route = levelRoutes[level]
    code += `  // 第${level}关\n`
    code += `  ${level}: {\n`
    code += `    id: '${route.id}',\n`
    code += `    name: '${route.name}',\n`
    code += `    points: [\n`
    
    // 输出所有点（完整数据）
    route.points.forEach((point: any, pointIndex: number) => {
      const comma = pointIndex < route.points.length - 1 ? ',' : ''
      code += `      { x: ${point.x.toFixed(2)}, y: ${point.y.toFixed(2)} }${comma}\n`
    })
    
    code += `    ]\n`
    code += `  }${index < levels.length - 1 ? ',' : ''}\n\n`
  })
  
  code += '} as const\n'
  
  // 写入文件
  const outputFile = path.join(__dirname, 'generated_routes.ts')
  fs.writeFileSync(outputFile, code, 'utf8')
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    // 默认行为：处理 inbox 并生成代码
    processInbox()
    generateTypeScriptCode()
  } else if (args[0] === '--help' || args[0] === '-h') {
Dragon Shooter 路线保存工具

用法:
  npm run save-routes                    # 处理 inbox 并生成代码
  npm run save-routes -- --process       # 仅处理 inbox
  npm run save-routes -- --generate      # 仅生成代码
  npm run save-routes -- --list          # 列出所有路线文件
  npm run save-routes -- --backup        # 备份所有路线

选项:
  --process    处理 inbox 中的路线文件
  --generate   生成 TypeScript 代码
  --list       列出所有可用的路线文件
  --backup     备份所有路线文件
  --help, -h   显示帮助信息

工作流程:
  1. 在游戏中绘制路线并保存（下载到 inbox/）
  2. 运行此脚本处理文件
  3. 生成的代码会自动更新到 generated_routes.ts
  4. 在 index.ts 中导入 generated_routes.ts
    `)
  } else if (args[0] === '--process') {
    processInbox()
  } else if (args[0] === '--generate') {
    generateTypeScriptCode()
  } else if (args[0] === '--list') {
    ensureDirs()
    const { listRouteFiles } = require('./routeManager')
    const files = listRouteFiles()
    files.forEach((file: string) => {
      const stats = fs.statSync(path.join(ROUTES_DIR, file))
      const size = (stats.size / 1024).toFixed(2)
    })
  } else if (args[0] === '--backup') {
    const { backupRoutes } = require('./routeManager')
    backupRoutes()
  } else {
    console.error('❌ 未知参数:', args[0])
  }
}

main()
