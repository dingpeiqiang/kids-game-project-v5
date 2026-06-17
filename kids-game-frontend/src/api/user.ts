import { apiClient } from '@/services/api-client.service'
import type { BaseUser } from '@/types/user'

export interface UserListParams {
  userType?: string
  status?: string
  page?: number
  size?: number
}

export async function getUserList(params: UserListParams) {
  return apiClient.get<{ list: BaseUser[]; total: number }>('/api/user/list', {
    params,
  } as never)
}

export function getUserDetail(userId: number) {
  return apiClient.get<BaseUser>(`/api/admin/users/${userId}`)
}

export function enableUser(userId: number) {
  return apiClient.put(`/api/admin/users/${userId}/enable`)
}

export function disableUser(userId: number) {
  return apiClient.put(`/api/admin/users/${userId}/disable`)
}

export function batchDisableUsers(userIds: number[]) {
  return apiClient.put('/api/admin/users/batch-disable', { userIds })
}

export function lockUser(userId: number, reason: string) {
  return apiClient.put(`/api/admin/users/${userId}/lock`, undefined, {
    params: { reason },
  } as never)
}

export function unlockUser(userId: number) {
  return apiClient.put(`/api/admin/users/${userId}/unlock`)
}

export function resetPassword(userId: number, newPassword: string) {
  return apiClient.put('/api/user/password', undefined, {
    params: {
      userId,
      oldPassword: '',
      newPassword,
    },
  } as never)
}

export function updateUser(data: Partial<BaseUser>) {
  return apiClient.put<BaseUser>('/api/user/update', data)
}