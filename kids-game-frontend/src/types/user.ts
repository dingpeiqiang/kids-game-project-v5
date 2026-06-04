/**
 * 用户类型定义
 */
export interface BaseUser {
  userId: number
  username: string
  nickname: string
  userType: 0 | 1 | 2 // 0-儿童，1-家长，2-管理员
  status: 0 | 1 | 2 // 0-禁用，1-正常，2-锁定
  avatar?: string
  fatiguePoints?: number
  dailyAnswerPoints?: number
  createTime?: number
  updateTime?: number
  lastLoginTime?: number
  lastLoginIp?: string
  deleted?: number
}

/**
 * 用户关系类型
 */
export interface UserRelation {
  relationId: number
  userA: number // 监护人 ID
  userB: number // 儿童 ID
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'TUTOR'
  isPrimary: boolean
  permissionLevel: 'FULL' | 'PARTIAL' | 'VIEW_ONLY'
  status: number
  createTime: number
  updateTime: number
}

/**
 * 管控配置类型
 */
export interface UserControlConfig {
  configId: number
  userId: number
  guardianId?: number
  dailyDuration: number
  singleDuration: number
  allowedTimeStart: string
  allowedTimeEnd: string
  answerGetPoints: number
  dailyAnswerLimit: number
  fatiguePointThreshold?: number
  restDuration?: number
  fatigueControlMode?: number
  blockedGames?: string
  createTime: number
  updateTime: number
}
