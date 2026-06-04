/**
 * 关卡目标类型定义
 */

export interface Objective {
  id: string                    // 唯一标识
  type: ObjectiveType           // 目标类型
  title: string                 // 标题
  description: string           // 描述
  target: number                // 目标值
  current: number               // 当前值
  completed: boolean            // 是否完成
}

export type ObjectiveType = 
  | 'collect'       // 收集类目标
  | 'score'         // 分数目标
  | 'time'          // 时间目标
  | 'survival'      // 生存目标
  | 'length'        // 长度目标
  | 'avoid'         // 躲避目标
  | 'combo'         // 连击目标
