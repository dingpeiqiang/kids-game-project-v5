#!/usr/bin/env node

/**
 * 自动修复脚本 - 将 CommonJS require() 转换为 ES Module import
 * 
 * 使用方法:
 * node fix-require.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 扫描 src 目录下的所有 .ts 和 .vue 文件
const srcDir = path.join(__dirname, 'src')

console.log('🔍 开始扫描并修复 require() 语句...\n')

let fixedCount = 0

function scanDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      scanDirectory(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      fixFile(filePath)
    }
  })
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const originalContent = content
  
  // 查找 require('@/config/...') 的模式
  const requirePattern = /const\s+(\w+)\s*=\s*require\(['"](@\/config\/[^'"]+)['"]\)/g
  
  let match
  while ((match = requirePattern.exec(content)) !== null) {
    const [fullMatch, varName, modulePath] = match
    
    console.log(`📝 发现 require(): ${filePath}`)
    console.log(`   ${fullMatch}`)
    
    // 替换为动态 import
    const importStatement = `import('${modulePath}').then(m => ${varName} = m.default)`
    
    // 如果是 Vue 文件，需要在 script 标签内处理
    if (filePath.endsWith('.vue')) {
      // Vue 文件中可能需要不同的处理方式
      console.log(`   ⚠️  Vue 文件中的 require 需要手动检查`)
    } else {
      content = content.replace(fullMatch, `// TODO: 需要重构为异步加载\n  let ${varName}\n  // ${importStatement}`)
      fixedCount++
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ 已修复：${filePath}\n`)
  }
}

// 执行扫描
scanDirectory(srcDir)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✨ 修复完成！共修复 ${fixedCount} 处 require() 语句`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('💡 提示:')
console.log('1. 请检查 TODO 注释并手动调整为异步加载逻辑')
console.log('2. Phaser 的 preload 方法中应使用 this.load 系列 API')
console.log('3. JSON 配置建议在场景启动前预先加载\n')
