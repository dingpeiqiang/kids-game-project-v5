import { apiClient } from '@/services/api-client.service'
import type { UserRelation as BackendUserRelation } from '@/types/user'

export interface UserRelation extends BackendUserRelation {
  relationId: number
  userA: number
  userB: number
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

export function getRelationList(params: RelationListParams) {
  return apiClient.get<{ records: UserRelation[]; total: number }>('/api/user-relation/list', {
    params,
  } as never)
}

export function bindRelation(data: {
  guardianUserId: number
  kidUserId: number
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'TUTOR'
  isPrimary?: boolean
  permissionLevel?: 'FULL' | 'PARTIAL' | 'VIEW_ONLY'
}) {
  return apiClient.post('/api/user-relation/bind', data)
}

export function unbindRelation(guardianUserId: number, kidUserId: number) {
  return apiClient.delete('/api/user-relation/unbind', {
    params: { guardianUserId, kidUserId },
  } as never)
}

export function setPrimaryGuardian(guardianUserId: number, kidUserId: number) {
  return apiClient.put('/api/user-relation/set-primary', undefined, {
    params: { guardianUserId, kidUserId },
  } as never)
}

export function updatePermissionLevel(
  relationId: number,
  permissionLevel: 'FULL' | 'PARTIAL' | 'VIEW_ONLY',
) {
  return apiClient.put('/api/user-relation/permission-level', undefined, {
    params: { relationId, permissionLevel },
  } as never)
}

export function getGuardianKids(guardianUserId: number) {
  return apiClient.get<UserRelation[]>(`/api/user-relation/guardian/${guardianUserId}/kids`)
}

export function getKidGuardians(kidUserId: number) {
  return apiClient.get<UserRelation[]>(`/api/user-relation/kid/${kidUserId}/guardians`)
}