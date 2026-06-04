import request from '@/utils/request'
import type { UserRelation as BackendUserRelation } from '@/types/user'

// 使用后端实际的 UserRelation 类型
export interface UserRelation extends BackendUserRelation {
  relationId: number
  userA: number  // 监护人 ID
  userB: number  // 儿童 ID
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'TUTOR'
  isPrimary: boolean
  permissionLevel: 'FULL' | 'PARTIAL' | 'VIEW_ONLY'
  status: number
  createTime: number
  updateTime: number
}

export interface RelationListParams {
  guardianId?: number
  kidId?: number
  page?: number
  size?: number
}

/**
 * 获取关系列表
 */
export function getRelationList(params: RelationListParams) {
  return request<any, { records: UserRelation[]; total: number }>({
    url: '/api/user-relation/list',
    method: 'get',
    params
  })
}

/**
 * 绑定关系
 */
export function bindRelation(data: {
  guardianUserId: number
  kidUserId: number
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'TUTOR'
  isPrimary?: boolean
  permissionLevel?: 'FULL' | 'PARTIAL' | 'VIEW_ONLY'
}) {
  return request({
    url: '/api/user-relation/bind',
    method: 'post',
    data
  })
}

/**
 * 解绑关系
 */
export function unbindRelation(guardianUserId: number, kidUserId: number) {
  return request({
    url: '/api/user-relation/unbind',
    method: 'delete',
    params: { guardianUserId, kidUserId }
  })
}

/**
 * 设置主监护人
 */
export function setPrimaryGuardian(guardianUserId: number, kidUserId: number) {
  return request({
    url: '/api/user-relation/set-primary',
    method: 'put',
    params: { guardianUserId, kidUserId }
  })
}

/**
 * 更新权限级别
 */
export function updatePermissionLevel(relationId: number, permissionLevel: 'FULL' | 'PARTIAL' | 'VIEW_ONLY') {
  return request({
    url: '/api/user-relation/permission-level',
    method: 'put',
    params: { relationId, permissionLevel }
  })
}

/**
 * 获取监护人的所有儿童
 */
export function getGuardianKids(guardianUserId: number) {
  return request<UserRelation[]>({
    url: `/api/user-relation/guardian/${guardianUserId}/kids`,
    method: 'get'
  })
}

/**
 * 获取儿童的所有监护人
 */
export function getKidGuardians(kidUserId: number) {
  return request<UserRelation[]>({
    url: `/api/user-relation/kid/${kidUserId}/guardians`,
    method: 'get'
  })
}
