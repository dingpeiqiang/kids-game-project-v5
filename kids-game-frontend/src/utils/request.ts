import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { API_CONSTANTS } from '@/services/api.types'
import { envConfig } from '@/core/config/env'

// 创建 axios 实例
// 注意：production 使用空字符串 baseURL，API 路径带完整 /api/ 前缀
// 开发环境 baseURL 为 http://localhost:8080/api
const service: AxiosInstance = axios.create({
  baseURL: envConfig.apiBaseUrl,
  timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加 token（使用统一的常量）
    const token = localStorage.getItem(API_CONSTANTS.TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 如果返回的状态码不是 200，说明接口有错误
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      
      // 401: 未授权，跳转到登录页
      if (res.code === 401) {
        localStorage.removeItem(API_CONSTANTS.TOKEN_KEY)
        window.location.href = API_CONSTANTS.LOGIN_PATH || '/login'
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  (error) => {
    console.error('响应错误:', error)
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem(API_CONSTANTS.TOKEN_KEY)
          window.location.href = API_CONSTANTS.LOGIN_PATH || '/login'
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求地址不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时')
    } else if (error.message.includes('Network')) {
      ElMessage.error('网络连接失败')
    }
    
    return Promise.reject(error)
  }
)

// 导出请求方法
export default service
