#!/usr/bin/env node

/**
 * 验证路线文件完整性
 * 检查所有 JSON 文件格式是否正确
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROUTES_DIR = path.join(__dirname, 'routes')
const LEVELS_DIR = path.join(ROUTES_DIR, 'levels')
const CUSTOM_DIR = path.join(ROUTES_DIR, 'custom')
const INDEX_FILE = path.join(ROUTES_DIR, 'index.json')

// 验证结果
interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

// 主函数
async function main() {
  console.log('🔍 验证路线文件完整性...\n')
  
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  }
  
  // 1. 检查索引文件
  console.log('📄 检查索引文件...')
  if (!fs.existsSync(INDEX_FILE)) {
    result.errors.push('❌ 索引文件不存在: index.json')
    result.passed = false
  } else {
    try {
      const indexContent = fs.readFileSync(INDEX_FILE, 'utf8')
      const index = JSON.parse(indexContent)
      
      // 验证格式
      if (!index.version || !index.levels || !index.custom) {
        result.errors.push('❌ 索引文件格式错误：缺少必要字段')
        result.passed = false
      } else {
        console.log(`✅ 索引文件格式正确 (version: ${index.version})`)
        console.log(`   - 关卡数量: ${Object.keys(index.levels).length}`)
        console.log(`   - 自定义路线: ${index.custom.length}`)
      }
      
      // 2. 检查关卡文件
      console.log('\n📁 检查关卡文件...')
      for (const [level, filename] of Object.entries(index.levels)) {
        const filepath = path.join(LEVELS_DIR, filename as string)
        
        if (!fs.existsSync(filepath)) {
          result.errors.push(`❌ 第${level}关文件不存在: ${filename}`)
          result.passed = false
        } else {
          try {
            const content = fs.readFileSync(filepath, 'utf8')
            const data = JSON.parse(content)
            
            // 验证格式
            if (!data.route || !data.route.id || !data.route.name || !data.route.points) {
              result.errors.push(`❌ 第${level}关文件格式错误: ${filename}`)
              result.passed = false
            } else {
              const pointCount = data.route.points.length
              console.log(`✅ 第${level}关: ${data.route.name} (${pointCount}个点)`)
              
              // 警告：点数过多或过少
              if (pointCount < 100) {
                result.warnings.push(`⚠️  第${level}关点数过少: ${pointCount}`)
              }
              if (pointCount > 5000) {
                result.warnings.push(`⚠️  第${level}关点数过多: ${pointCount}`)
              }
            }
          } catch (error) {
            result.errors.push(`❌ 第${level}关文件解析失败: ${filename}`)
            result.passed = false
          }
        }
      }
      
      // 3. 检查自定义路线
      console.log('\n🎨 检查自定义路线...')
      if (index.custom.length === 0) {
        console.log('ℹ️  暂无自定义路线')
      } else {
        for (const filename of index.custom) {
          const filepath = path.join(CUSTOM_DIR, filename)
          
          if (!fs.existsSync(filepath)) {
            result.errors.push(`❌ 自定义路线文件不存在: ${filename}`)
            result.passed = false
          } else {
            try {
              const content = fs.readFileSync(filepath, 'utf8')
              const data = JSON.parse(content)
              
              if (!data.route || !data.route.id || !data.route.name || !data.route.points) {
                result.errors.push(`❌ 自定义路线文件格式错误: ${filename}`)
                result.passed = false
              } else {
                const pointCount = data.route.points.length
                console.log(`✅ ${data.route.name} (${pointCount}个点)`)
              }
            } catch (error) {
              result.errors.push(`❌ 自定义路线文件解析失败: ${filename}`)
              result.passed = false
            }
          }
        }
      }
      
      // 4. 检查孤儿文件（在目录中但不在索引中）
      console.log('\n🔎 检查孤儿文件...')
      const levelFiles = fs.readdirSync(LEVELS_DIR).filter(f => f.endsWith('.json'))
      const indexedLevelFiles = Object.values(index.levels)
      
      for (const file of levelFiles) {
        if (!indexedLevelFiles.includes(file)) {
          result.warnings.push(`⚠️  孤儿文件: levels/${file} (未在索引中)`)
        }
      }
      
      if (fs.existsSync(CUSTOM_DIR)) {
        const customFiles = fs.readdirSync(CUSTOM_DIR).filter(f => f.endsWith('.json'))
        for (const file of customFiles) {
          if (!index.custom.includes(file)) {
            result.warnings.push(`⚠️  孤儿文件: custom/${file} (未在索引中)`)
          }
        }
      }
      
    } catch (error) {
      result.errors.push(`❌ 索引文件解析失败: ${error}`)
      result.passed = false
    }
  }
  
  // 输出结果
  console.log('\n' + '='.repeat(60))
  console.log('验证结果:')
  console.log('='.repeat(60))
  
  if (result.errors.length > 0) {
    console.log('\n❌ 发现错误:')
    result.errors.forEach(err => console.log('  ' + err))
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告:')
    result.warnings.forEach(warn => console.log('  ' + warn))
  }
  
  if (result.passed && result.warnings.length === 0) {
    console.log('\n✅ 所有文件验证通过！')
  } else if (result.passed) {
    console.log('\n✅ 验证通过（有警告）')
  } else {
    console.log('\n❌ 验证失败，请修复错误后重试')
    process.exit(1)
  }
  
  console.log('='.repeat(60))
}

main().catch(error => {
  console.error('💥 验证过程出错:', error)
  process.exit(1)
})
