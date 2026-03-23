import request from '@/utils/request'
import type { BaseUser } from '@/types/user'
import { catchError } from '@/utils/errorHandler'

export interface UserListParams {
  userType?: string
  status?: string
  page?: number
  size?: number
}

/**
 * 获取用户列表（管理员）
 */
export async function getUserList(params: UserListParams) {
  try {
    return await request<any, { list: BaseUser[]; total: number }>({
      url: '/api/user/list',
      method: 'get',
      params
    })
  } catch (error) {
    console.error('[API Error] getUserList:', error)
    throw error
  }
}

/**
 * 获取用户详情
 */
export function getUserDetail(userId: number) {
  return request<any, BaseUser>({
    url: `/api/admin/users/${userId}`,
    method: 'get'
  })
}

/**
 * 启用用户
 */
export function enableUser(userId: number) {
  return request({
    url: `/api/admin/users/${userId}/enable`,
    method: 'put'
  })
}

/**
 * 禁用用户
 */
export function disableUser(userId: number) {
  return request({
    url: `/api/admin/users/${userId}/disable`,
    method: 'put'
  })
}

/**
 * 批量禁用用户
 */
export function batchDisableUsers(userIds: number[]) {
  return request({
    url: '/api/admin/users/batch-disable',
    method: 'put',
    data: { userIds }
  })
}

/**
 * 锁定用户
 */
export function lockUser(userId: number, reason: string) {
  return request({
    url: `/api/admin/users/${userId}/lock`,
    method: 'put',
    params: { reason }
  })
}

/**
 * 解锁用户
 */
export function unlockUser(userId: number) {
  return request({
    url: `/api/admin/users/${userId}/unlock`,
    method: 'put'
  })
}

/**
 * 重置用户密码
 */
export function resetPassword(userId: number, newPassword: string) {
  return request({
    url: `/api/user/password`,
    method: 'put',
    params: {
      userId,
      oldPassword: '', // 管理员重置不需要旧密码
      newPassword
    }
  })
}

/**
 * 更新用户信息
 */
export function updateUser(data: Partial<BaseUser>) {
  return request<BaseUser>({
    url: '/api/user/update',
    method: 'put',
    data
  })
}
