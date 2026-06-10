/**
 * 管理端与创作者中心路由路径（双前端统一）
 */
export const ADMIN_PATHS = {
  dashboard: '/admin/dashboard',
  parent: '/admin/parent',
  creatorCenter: '/admin/creator-center',
  gtrsEditor: '/admin/creator-center/gtrs-editor',
} as const;

export function gtrsEditorQuery(params: {
  mode?: 'view' | 'edit' | 'create';
  themeId?: number | string;
  [key: string]: string | number | undefined;
}): { path: string; query: Record<string, string> } {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) query[k] = String(v);
  }
  return { path: ADMIN_PATHS.gtrsEditor, query };
}