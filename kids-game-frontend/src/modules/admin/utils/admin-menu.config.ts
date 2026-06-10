/**
 * 后台管理菜单配置（按角色过滤，定义见 @kids-game/shared）
 */
import {
  getMenuItemsForRole,
  type AdminMenuItemDef,
  type AdminPortalRole,
} from '@kids-game/shared';

export type MenuItem = AdminMenuItemDef;

export function getAdminMenuForRole(role: AdminPortalRole): MenuItem[] {
  return getMenuItemsForRole(role);
}

/** @deprecated 使用 getAdminMenuForRole */
export const adminMenuItems: MenuItem[] = getMenuItemsForRole('admin');