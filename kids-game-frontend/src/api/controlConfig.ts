import { apiClient } from '@/services/api-client.service'

export interface UserControlConfig {
  configId: number
  userId: number
  childNickname?: string
  guardianId?: number
  guardianNickname?: string
  dailyDuration: number
  singleDuration: number
  allowedTimeStart: string
  allowedTimeEnd: string
  answerGetPoints: number
  dailyAnswerLimit: number
  fatiguePointThreshold?: number
  restDuration?: number
  fatigueControlMode?: 'SOFT' | 'FORCED'
  blockedGames?: string
  createTime: number
  updateTime: number
}

export interface ConfigListParams {
  kidId?: number
  page?: number
  size?: number
}

export function getConfigList(params: ConfigListParams) {
  return apiClient.get<{ records: UserControlConfig[]; total: number }>(
    '/api/user-control-config/list',
    { params } as never,
  )
}

export function getConfigByUserId(userId: number) {
  return apiClient.get<UserControlConfig>(`/api/user-control-config/user/${userId}`)
}

export function getConfigDetail(configId: number) {
  return apiClient.get<UserControlConfig>(`/api/user-control-config/${configId}`)
}

export function addConfig(data: Partial<UserControlConfig>) {
  return apiClient.post('/api/user-control-config/add', data)
}

export function updateConfig(data: Partial<UserControlConfig>) {
  return apiClient.put('/api/user-control-config/update', data)
}

export function deleteConfig(configId: number) {
  return apiClient.delete('/api/user-control-config/delete', {
    params: { configId },
  } as never)
}

export function getConfigByKidId(kidUserId: number) {
  return apiClient.get<UserControlConfig>(`/api/user-control-config/kid/${kidUserId}`)
}