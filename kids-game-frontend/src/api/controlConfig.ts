import request from '@/utils/request'

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

/**
 * 获取管控配置列表
 */
export function getConfigList(params: ConfigListParams) {
  return request<any, { list: UserControlConfig[]; total: number }>({
    url: '/api/user-control-config/list',
    method: 'get',
    params
  })
}

/**
 * 获取管控配置详情
 */
export function getConfigDetail(configId: number) {
  return request<UserControlConfig>({
    url: `/api/user-control-config/${configId}`,
    method: 'get'
  })
}

/**
 * 新增管控配置
 */
export function addConfig(data: Partial<UserControlConfig>) {
  return request({
    url: '/api/user-control-config/add',
    method: 'post',
    data
  })
}

/**
 * 更新管控配置
 */
export function updateConfig(data: Partial<UserControlConfig>) {
  return request({
    url: '/api/user-control-config/update',
    method: 'put',
    data
  })
}

/**
 * 删除管控配置
 */
export function deleteConfig(configId: number) {
  return request({
    url: `/api/user-control-config/delete`,
    method: 'delete',
    params: { configId }
  })
}

/**
 * 根据儿童 ID 获取配置
 */
export function getConfigByKidId(kidUserId: number) {
  return request<UserControlConfig>({
    url: `/api/user-control-config/kid/${kidUserId}`,
    method: 'get'
  })
}