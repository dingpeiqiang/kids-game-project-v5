# -*- coding: utf-8 -*-
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

file_path = r'd:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-house\snake-vue3\src\components\game\PhaserGame.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 新的函数代码
new_code = '''/**
 * ⭐ 将单个资源 src 路径归一化为根路径（/ 开头）
 *
 * 支持的输入格式及转换规则：
 *   http(s)://...   → 原样保留（外链 CDN）
 *   /themes/xxx    → 原样保留（推荐写法，public/themes/ 目录）
 *   /assets/xxx    → 原样保留（public/assets/ 目录）
 *   /public/xxx    → /xxx（旧格式兼容）
 *   @/xxx          → /xxx（Vite 别名转换）
 *   themes/xxx     → /themes/xxx（省略开头的 /，自动补充）
 *   assets/xxx     → /assets/xxx
 *   其余           → 原样保留（颜色值等）
 *
 * 最终所有本地资源均为 / 开头的根路径，基于当前域名+端口解析，
 * 与页面所在路由无关，任意部署均可正常访问。
 */
function normalizeOneSrc(src: string): string {
  if (!src || typeof src !== 'string') return src

  // 完整 URL（http/https）：直接返回
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  // 已经是 / 开头：直接返回（支持 /themes/, /assets/ 等）
  if (src.startsWith('/')) {
    // 旧格式 /public/xxx → /xxx
    if (src.startsWith('/public/')) return src.replace('/public/', '/')
    return src
  }

  // Vite 别名：@/xxx → /xxx
  if (src.startsWith('@/')) return src.replace(/^@\\//, '/')

  // 不带 / 前缀的相对路径 → 补充 / 前缀
  return '/' + src
}

/**
 * ⭐ 递归遍历 GTRS 对象，对所有 src 字段执行路径归一化
 */
function normalizeSrcPaths(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeSrcPaths)
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (key === 'src' && typeof value === 'string') {
      result[key] = normalizeOneSrc(value)
    } else if (typeof value === 'object') {
      result[key] = normalizeSrcPaths(value)
    } else {
      result[key] = value
    }
  }
  return result
}'''

# 使用正则表达式替换
pattern = r'/\*\*\s*\n\s*\* ⭐ 修复 GTRS 资源 src 路径.*?^\s*\}/'
new_content = re.sub(pattern, new_code, content, flags=re.MULTILINE | re.DOTALL)

if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Done!')
else:
    print('Pattern not found')
