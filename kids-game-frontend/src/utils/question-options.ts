/**
 * 题干选项解析（与后端 JSON / 逗号分隔格式一致）
 */
export function parseQuestionOptions(options: string | undefined | null): string[] {
  if (!options?.trim()) return [];
  const trimmed = options.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((o) => String(o).trim()).filter(Boolean);
    }
  } catch {
    /* fall through */
  }
  return trimmed
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 判断题默认选项 */
export const JUDGMENT_OPTIONS = ['对', '错'];

export function optionsForQuestion(type: string | undefined, optionsRaw: string): string[] {
  const parsed = parseQuestionOptions(optionsRaw);
  if (type === 'judgment' && parsed.length === 0) {
    return [...JUDGMENT_OPTIONS];
  }
  return parsed;
}