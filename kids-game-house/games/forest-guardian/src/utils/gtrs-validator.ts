/**
 * GTRS v1.0.0 轻量级校验工具（模板内联版）
 *
 * ⭐ 设计理念：前端只做基本格式检查，完整校验交给后端
 * ⭐ 此文件内联了 shared/utils/gtrs-validator，无需外部依赖
 */

/** GTRS 主题数据类型（简化版，用于类型提示） */
export interface GTRSTheme {
  specMeta: {
    specName: 'GTRS'
    specVersion: string
    compatibleVersion: string
  }
  globalStyle: {
    primaryColor?: string
    secondaryColor?: string
    bgColor?: string
    textColor?: string
    fontFamily?: string
    borderRadius?: string
  }
  resources: {
    images: {
      login: Record<string, ImageResource>
      scene: Record<string, ImageResource>
      ui: Record<string, ImageResource>
      icon: Record<string, ImageResource>
      effect: Record<string, ImageResource>
    }
    audio: {
      bgm: Record<string, AudioResource>
      effect: Record<string, AudioResource>
      voice: Record<string, AudioResource>
    }
    video: Record<string, any>
  }
}

export interface ImageResource {
  src: string
  type: 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif'
  alias: string
}

export interface AudioResource {
  src: string
  type: 'mp3'
  volume: number
  alias: string
}

export interface ValidationResult {
  valid: boolean
  message: string
}

/**
 * 完整校验主题 JSON 是否符合 GTRS 规范
 * ⭐ 简化版：只做基本格式检查，完整校验请调用后端接口
 */
export function validateGTRSTheme(themeJson: string): ValidationResult {
  try {
    const theme = JSON.parse(themeJson)

    // 1. 检查基础结构
    if (!theme.specMeta || !theme.globalStyle || !theme.resources) {
      return {
        valid: false,
        message: '缺少必需的顶级字段：specMeta、globalStyle、resources',
      }
    }

    // 2. 检查规范名称
    if (theme.specMeta.specName !== 'GTRS') {
      return {
        valid: false,
        message: '规范名称必须为：GTRS',
      }
    }

    return {
      valid: true,
      message: '基本格式检查通过',
    }
  } catch (error) {
    return {
      valid: false,
      message: `JSON 解析失败：${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/** 检测主题 JSON 是否为 GTRS 规范 */
export function isGTRSFormat(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return theme.specMeta?.specName === 'GTRS'
  } catch {
    return false
  }
}

/** 快速校验（仅检查关键字段） */
export function quickValidate(themeJson: string): boolean {
  try {
    const theme = JSON.parse(themeJson)
    return !!(theme.specMeta && theme.globalStyle && theme.resources)
  } catch {
    return false
  }
}

// ── 资源完整性验证（开发期工具） ──────────────────────────────────────────────

export interface ResourceAuditEntry {
  key: string
  src: string
  group: string   // 'images.scene' / 'audio.bgm' 等
  exists: boolean
  error?: string
}

export interface ResourceAuditResult {
  /** 所有资源条目（含检查结果） */
  entries: ResourceAuditEntry[]
  /** 不存在的资源 */
  missing: ResourceAuditEntry[]
  /** 全部通过 */
  allOk: boolean
  /** 摘要文本 */
  summary: string
}

/**
 * ⭐ 验证 GTRS 中所有资源路径是否可访问（HTTP HEAD 请求）
 *
 * 仅在开发期使用。在 StartView 的检测流程或 preload() 中调用：
 *
 * @example
 *   // 在 StartView 的启动检测步骤中
 *   const result = await auditGTRSResources(themeStore.gtrsData)
 *   if (!result.allOk) {
 *     console.error('缺少资源：', result.missing)
 *   }
 *
 * @param gtrsData  已解析的 GTRS 对象（themeStore.gtrsData）
 * @param baseUrl   资源 base URL，默认为空（路径已是绝对路径）
 */
export async function auditGTRSResources(
  gtrsData: any,
  baseUrl = ''
): Promise<ResourceAuditResult> {
  const entries: ResourceAuditEntry[] = []

  if (!gtrsData?.resources) {
    return {
      entries: [],
      missing: [],
      allOk: true,
      summary: 'GTRS 资源为空，跳过检查',
    }
  }

  const resources = gtrsData.resources

  // 收集所有资源条目
  const collect = (groupPath: string, group: Record<string, any> | undefined) => {
    if (!group) return
    for (const [key, res] of Object.entries(group)) {
      if (!res?.src) continue
      let src = res.src as string
      if (src.startsWith('/public/')) src = src.replace('/public/', '/')
      entries.push({ key, src: baseUrl + src, group: groupPath, exists: false })
    }
  }

  collect('images.scene',  resources.images?.scene)
  collect('images.ui',     resources.images?.ui)
  collect('images.icon',   resources.images?.icon)
  collect('images.effect', resources.images?.effect)
  collect('audio.bgm',     resources.audio?.bgm)
  collect('audio.effect',  resources.audio?.effect)
  collect('audio.voice',   resources.audio?.voice)

  if (entries.length === 0) {
    return {
      entries: [],
      missing: [],
      allOk: true,
      summary: 'GTRS 中没有配置任何资源（resources 全为空对象）',
    }
  }

  // 并发 HEAD 检查（最多 6 并发）
  const checkOne = async (entry: ResourceAuditEntry): Promise<void> => {
    try {
      const resp = await fetch(entry.src, { method: 'HEAD' })
      entry.exists = resp.ok
      if (!resp.ok) entry.error = `HTTP ${resp.status}`
    } catch (e: any) {
      entry.exists = false
      entry.error = e?.message || '网络错误'
    }
  }

  // 分批并发
  const BATCH = 6
  for (let i = 0; i < entries.length; i += BATCH) {
    await Promise.all(entries.slice(i, i + BATCH).map(checkOne))
  }

  const missing = entries.filter(e => !e.exists)
  const allOk   = missing.length === 0
  const summary = allOk
    ? `✅ 全部 ${entries.length} 个资源均可访问`
    : `❌ ${missing.length}/${entries.length} 个资源不可访问：\n` +
      missing.map(e => `  [${e.group}] ${e.key} → ${e.src}（${e.error}）`).join('\n')

  return { entries, missing, allOk, summary }
}
