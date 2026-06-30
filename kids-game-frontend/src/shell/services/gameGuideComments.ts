import { apiGetComments, apiSubmitComment } from './apiClient'
import { convertGameIdToNumber } from '@shell/app/rank'
import { userService } from './userService'
import { showToast } from './userUI'

export async function fetchGameGuideComments(gameCode: string) {
  const numericId = convertGameIdToNumber(gameCode)
  const res = await apiGetComments(numericId, 0, 20)
  if (!res.ok || !res.data) return { comments: [], avgScore: 0, count: 0 }
  const comments = res.data
  const count = comments.length
  const avgScore =
    count > 0 ? Math.round((comments.reduce((s, c) => s + (c.score || 0), 0) / count) * 10) / 10 : 0
  return { comments, avgScore, count }
}

export async function submitGameGuideComment(
  gameCode: string,
  content: string,
  rating: number,
): Promise<boolean> {
  if (!userService.isLoggedIn) {
    showToast('请先登录后再评论', 'info')
    return false
  }
  const text = content.trim()
  if (!text) {
    showToast('请输入评论内容', 'info')
    return false
  }
  if (rating < 1 || rating > 5) {
    showToast('请选择评分', 'info')
    return false
  }
  const numericId = convertGameIdToNumber(gameCode)
  const res = await apiSubmitComment(numericId, text, rating)
  if (res.ok) {
    showToast('评论发布成功', 'success')
    return true
  }
  showToast(res.msg || '发布失败', 'error')
  return false
}