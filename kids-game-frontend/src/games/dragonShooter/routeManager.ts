// ============================================
// Dragon Shooter 路线管理器
// 用于在 Node.js 环境中管理路线文件
// ============================================

import * as fs from 'fs'
import * as path from 'path'

const ROUTES_DIR = path.join(__dirname, 'routes')
const LEVEL_ROUTES_FILE = path.join(ROUTES_DIR, 'level_routes.json')
const CUSTOM_ROUTES_FILE = path.join(ROUTES_DIR, 'custom_routes.json')

// 确保目录存在
function ensureDir(): void {
  if (!fs.existsSync(ROUTES_DIR)) {
    fs.mkdirSync(ROUTES_DIR, { recursive: true })
  }
}

// 保存关卡专属路线
export function saveLevelRoutes(routes: Record<number, any>): void {
  ensureDir()
  
  const data = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    routes: routes
  }
  
  fs.writeFileSync(LEVEL_ROUTES_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// 加载关卡专属路线
export function loadLevelRoutes(): Record<number, any> {
  try {
    if (!fs.existsSync(LEVEL_ROUTES_FILE)) {
      return {}
    }
    
    const content = fs.readFileSync(LEVEL_ROUTES_FILE, 'utf8')
    const data = JSON.parse(content)
    
    return data.routes
  } catch (error) {
    console.error('❌ 加载关卡路线失败:', error)
    return {}
  }
}

// 保存自定义路线
export function saveCustomRoutes(routes: any[]): void {
  ensureDir()
  
  const data = {
    version: '1.0',
    lastModified: new Date().toISOString(),
    routes: routes
  }
  
  fs.writeFileSync(CUSTOM_ROUTES_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// 加载自定义路线
export function loadCustomRoutes(): any[] {
  try {
    if (!fs.existsSync(CUSTOM_ROUTES_FILE)) {
      return []
    }
    
    const content = fs.readFileSync(CUSTOM_ROUTES_FILE, 'utf8')
    const data = JSON.parse(content)
    
    return data.routes
  } catch (error) {
    console.error('❌ 加载自定义路线失败:', error)
    return []
  }
}

// 列出所有可用的路线文件
export function listRouteFiles(): string[] {
  ensureDir()
  
  const files = fs.readdirSync(ROUTES_DIR)
  return files.filter(f => f.endsWith('.json'))
}

// 获取路线文件内容
export function getRouteFile(filename: string): any {
  const filepath = path.join(ROUTES_DIR, filename)
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`文件不存在: ${filepath}`)
  }
  
  const content = fs.readFileSync(filepath, 'utf8')
  return JSON.parse(content)
}

// 删除路线文件
export function deleteRouteFile(filename: string): void {
  const filepath = path.join(ROUTES_DIR, filename)
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
}

// 备份所有路线文件
export function backupRoutes(): void {
  ensureDir()
  
  const backupDir = path.join(ROUTES_DIR, 'backup')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const files = listRouteFiles().filter(f => f !== 'backup')
  
  files.forEach(file => {
    const source = path.join(ROUTES_DIR, file)
    const backup = path.join(backupDir, file.replace('.json', `_${timestamp}.json`))
    fs.copyFileSync(source, backup)
  })
}

// 主函数：测试
if (require.main === module) {
}
