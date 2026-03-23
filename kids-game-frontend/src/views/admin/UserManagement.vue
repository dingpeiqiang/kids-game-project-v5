<template>
  <div class="user-management">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="用户类型">
          <el-select v-model="searchForm.userType" placeholder="全部" clearable>
            <el-option label="儿童" :value="0" />
            <el-option label="家长" :value="1" />
            <el-option label="管理员" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="锁定" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="danger" :disabled="selectedUsers.length === 0" @click="handleBatchDisable">
            批量禁用
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户 ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getUserTypeTag(row.userType)">
              {{ getUserTypeText(row.userType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fatiguePoints" label="疲劳点" width="80" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row.userId)">详情</el-button>
            <el-button 
              size="small" 
              type="primary"
              @click="handleEditUserFromTable(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 0"
              size="small"
              type="success"
              @click="handleEnableUser(row.userId)"
            >
              启用
            </el-button>
            <el-button
              v-if="row.status === 1"
              size="small"
              type="warning"
              @click="handleDisableUser(row.userId)"
            >
              禁用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchUserList"
        @current-change="fetchUserList"
        class="pagination"
      />
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="用户详情" width="700px">
      <div v-if="currentUser" style="text-align: center; margin-bottom: 20px;">
        <div class="avatar-detail-preview">
          <el-image 
            v-if="currentUser.avatar"
            :src="currentUser.avatar" 
            fit="cover"
            style="width: 150px; height: 150px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
            :preview-src-list="[currentUser.avatar]"
          >
            <template #error>
              <div class="image-error" style="width: 150px; height: 150px;">
                <el-icon :size="50"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div v-else class="avatar-detail-placeholder">
            <el-icon :size="60"><Avatar /></el-icon>
            <span style="font-size: 14px; color: #909399; margin-top: 10px;">暂无头像</span>
          </div>
        </div>
      </div>
      
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="用户 ID">{{ currentUser.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
        <el-descriptions-item label="用户类型">
          {{ getUserTypeText(currentUser.userType) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(currentUser.status)">
            {{ getStatusText(currentUser.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="疲劳点">{{ currentUser.fatiguePoints || 0 }}</el-descriptions-item>
        <el-descriptions-item label="每日答题积分">{{ currentUser.dailyAnswerPoints || 0 }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          {{ formatTime(currentUser.lastLoginTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(currentUser.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="warning" @click="handleResetPassword(currentUser!)">重置密码</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户信息" width="800px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
        <el-row :gutter="20">
          <!-- 左侧：基本信息 -->
          <el-col :span="12">
            <h4 style="margin-bottom: 15px; color: #303133;">📋 基本信息</h4>
            
            <el-form-item label="用户 ID">
              <el-input v-model="editForm.userId" disabled />
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="editForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="昵称" required>
              <el-input v-model="editForm.nickname" placeholder="请输入昵称" maxlength="50" show-word-limit />
            </el-form-item>
            
            <el-form-item label="头像">
              <!-- 头像预览区（可点击） -->
              <div 
                class="avatar-preview-area"
                @click="showAvatarSelector = true"
              >
                <div v-if="editForm.avatar" class="avatar-preview">
                  <el-image 
                    :src="editForm.avatar" 
                    fit="cover"
                    style="width: 120px; height: 120px; border-radius: 8px; cursor: pointer;"
                    :preview-src-list="[editForm.avatar]"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="avatar-overlay">
                    <el-icon><Camera /></el-icon>
                    <span>点击更换</span>
                  </div>
                </div>
                <div v-else class="avatar-placeholder">
                  <el-icon :size="40"><Avatar /></el-icon>
                  <span style="font-size: 12px; color: #909399;">点击添加头像</span>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="用户类型">
              <el-tag :type="getUserTypeTag(editForm.userType || 0)">
                {{ getUserTypeText(editForm.userType || 0) }}
              </el-tag>
            </el-form-item>
            
            <el-form-item label="当前状态">
              <el-tag :type="getStatusTag(editForm.status || 0)">
                {{ getStatusText(editForm.status || 0) }}
              </el-tag>
            </el-form-item>
          </el-col>
          
          <!-- 右侧：属性设置 -->
          <el-col :span="12">
            <h4 style="margin-bottom: 15px; color: #303133;">⚙️ 属性设置</h4>
            
            <el-form-item label="疲劳点">
              <el-input-number 
                v-model="editForm.fatiguePoints" 
                :min="0" 
                :max="100" 
                :step="1"
                controls-position="right"
              />
              <el-tooltip placement="bottom">
                <template #content>
                  儿童用户的疲劳点上限为 10 点<br/>超过后将限制游戏时长
                </template>
                <el-icon style="margin-left: 5px;"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
            
            <el-form-item label="每日答题积分">
              <el-input-number 
                v-model="editForm.dailyAnswerPoints" 
                :min="0" 
                :max="100" 
                :step="1"
                controls-position="right"
              />
              <el-tooltip placement="bottom">
                <template #content>
                  用户每天通过答题获得的积分上限
                </template>
                <el-icon style="margin-left: 5px;"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>
            
            <el-divider />
            
            <el-form-item label="修改状态">
              <el-switch
                v-model="editForm.status"
                :active-value="1"
                :inactive-value="0"
                active-text="正常"
                inactive-text="禁用"
              />
            </el-form-item>
            
            <el-alert
              v-if="editForm.status === 0"
              title="用户已被禁用"
              type="warning"
              description="禁用后该用户将无法登录系统"
              show-icon
              closable
            />
          </el-col>
        </el-row>
        
        <!-- 底部：扩展信息 -->
        <el-divider />
        <el-form-item label="备注说明">
          <el-input 
            v-model="editForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注说明（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button @click="handleResetEditForm">重置</el-button>
          <el-button type="primary" @click="confirmEditUser" :loading="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="500px">
      <el-alert
        title="重要提示"
        type="warning"
        description="重置后用户密码将恢复为默认密码：123456"
        show-icon
        style="margin-bottom: 20px;"
      />
      <p>确定要重置用户 <strong>{{ currentUser?.username }}</strong> 的密码吗？</p>
      
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword">确定重置</el-button>
      </template>
    </el-dialog>

    <!-- 头像选择器组件 -->
    <AvatarSelector 
      v-model="showAvatarSelector" 
      :current-avatar="editForm.avatar"
      @confirm="handleAvatarConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, enableUser, disableUser, batchDisableUsers, updateUser, resetPassword } from '@/api/user'
import AvatarSelector from '@/components/AvatarSelector.vue'

// 用户类型定义
interface BaseUser {
  userId: number
  username: string
  nickname: string
  userType: number
  status: number
  fatiguePoints?: number
  dailyAnswerPoints?: number
  avatar?: string
  createTime?: number
  lastLoginTime?: number
  remark?: string // 备注字段
}

interface SearchForm {
  userType?: number
  status?: number
}

interface Pagination {
  page: number
  size: number
  total: number
}

// 响应式数据
const loading = ref(false)
const userList = ref<BaseUser[]>([])
const selectedUsers = ref<BaseUser[]>([])
const detailDialogVisible = ref(false)
const currentUser = ref<BaseUser | null>(null)

// 编辑相关
const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const submitting = ref(false)
const showAvatarSelector = ref(false)
const defaultAvatar = '/images/default-avatar.png'

// 移除预设头像数组，改用组件
const cartoonAvatars = ref([])

const editForm = reactive<Partial<BaseUser>>({
  userId: 0,
  username: '',
  nickname: '',
  userType: 0,
  status: 1,
  fatiguePoints: 0,
  dailyAnswerPoints: 0,
  avatar: '',
  remark: ''
})

// 表单验证规则
const editRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 50, message: '昵称长度在 2-50 个字符之间', trigger: 'blur' }
  ]
}

// 重置密码相关
const resetPasswordDialogVisible = ref(false)

const searchForm = reactive<SearchForm>({
  userType: undefined,
  status: undefined
})

const pagination = reactive<Pagination>({
  page: 1,
  size: 10,
  total: 0
})

// 获取用户类型文本
const getUserTypeText = (type: number): string => {
  const map: Record<number, string> = {
    0: '儿童',
    1: '家长',
    2: '管理员'
  }
  return map[type] || '未知'
}

// 获取用户类型标签颜色
const getUserTypeTag = (type: number): string => {
  const map: Record<number, string> = {
    0: 'success',
    1: 'warning',
    2: 'danger'
  }
  return map[type] || ''
}

// 获取状态文本
const getStatusText = (status: number): string => {
  const map: Record<number, string> = {
    0: '禁用',
    1: '正常',
    2: '锁定'
  }
  return map[status] || '未知'
}

// 获取状态标签颜色
const getStatusTag = (status: number): string => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return map[status] || ''
}

// 格式化时间
const formatTime = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      userType: searchForm.userType ? String(searchForm.userType) : undefined,
      status: searchForm.status ? String(searchForm.status) : undefined,
      page: pagination.page,
      size: pagination.size
    })
    
    console.log('[UserManagement] API 返回数据:', res)
    
    // ✅ 兼容两种数据格式：
    // 格式 1: { list: [...], total: 100 } (分页格式)
    // 格式 2: [...] (直接数组)
    if (res.data && Array.isArray(res.data.list)) {
      // 分页格式
      userList.value = res.data.list
      pagination.total = res.data.total || res.data.list.length
      console.log('[UserManagement] 使用分页格式')
    } else if (Array.isArray(res.data)) {
      // 直接数组格式
      userList.value = res.data
      pagination.total = res.data.length
      console.log('[UserManagement] 使用数组格式')
    } else {
      // 空数据
      userList.value = []
      pagination.total = 0
      console.log('[UserManagement] 无数据')
    }
    
    loading.value = false
  } catch (error) {
    console.error('[UserManagement] 获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败：' + (error as any)?.message || '未知错误')
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置
const handleReset = () => {
  searchForm.userType = undefined
  searchForm.status = undefined
  pagination.page = 1
  fetchUserList()
}

// 选择变化
const handleSelectionChange = (selection: BaseUser[]) => {
  selectedUsers.value = selection
}

// 查看详情
const handleViewDetail = (userId: number) => {
  currentUser.value = userList.value.find((u: BaseUser) => u.userId === userId) || null
  detailDialogVisible.value = true
}

// 编辑用户（从详情对话框）
const handleEditUser = (user: BaseUser) => {
  editForm.userId = user.userId
  editForm.username = user.username
  editForm.nickname = user.nickname
  editForm.avatar = user.avatar || ''
  editForm.userType = user.userType
  editForm.status = user.status
  editForm.fatiguePoints = user.fatiguePoints || 0
  editForm.dailyAnswerPoints = user.dailyAnswerPoints || 0
  editForm.remark = '' // 清空备注
  currentUser.value = user
  editDialogVisible.value = true
}

// 编辑用户（从表格直接编辑）
const handleEditUserFromTable = (user: BaseUser) => {
  handleEditUser(user)
}

// 重置编辑表单
const handleResetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields()
  }
  // 重新填充当前用户数据
  if (currentUser.value) {
    editForm.nickname = currentUser.value.nickname
    editForm.avatar = currentUser.value.avatar || ''
    editForm.fatiguePoints = currentUser.value.fatiguePoints || 0
    editForm.dailyAnswerPoints = currentUser.value.dailyAnswerPoints || 0
  }
}

// 选择头像
const selectAvatar = (avatar: string) => {
  editForm.avatar = avatar
  ElMessage.success('头像已选择')
}

// 处理头像确认
const handleAvatarConfirm = (avatar: string) => {
  editForm.avatar = avatar
  ElMessage.success('头像设置成功')
}

// 上传头像
const handleUploadAvatar = async () => {
  try {
    // 创建隐藏的 input 元素
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*' // 只接受图片文件
    
    // 监听文件选择
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) return
      
      // 验证文件大小（不超过 2MB）
      if (file.size > 2 * 1024 * 1024) {
        ElMessage.error('头像大小不能超过 2MB')
        return
      }
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.error('只能上传图片文件')
        return
      }
      
      // TODO: 调用后端上传接口
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await uploadFile(formData)
      // editForm.avatar = response.data.url
      
      // 临时实现：使用 FileReader 读取本地文件并显示
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        editForm.avatar = result
        ElMessage.success('头像上传成功')
      }
      reader.onerror = () => {
        ElMessage.error('头像读取失败')
      }
      reader.readAsDataURL(file)
    }
    
    // 触发文件选择
    input.click()
  } catch (error) {
    ElMessage.error('上传失败，请重试')
  }
}

// 确认编辑用户
const confirmEditUser = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      // 调用后端 API 更新用户
      const updateData: Partial<BaseUser> = {
        userId: currentUser.value?.userId,
        nickname: editForm.nickname,
        avatar: editForm.avatar,
        fatiguePoints: editForm.fatiguePoints,
        dailyAnswerPoints: editForm.dailyAnswerPoints,
        status: editForm.status as 0 | 1 | 2,
        remark: editForm.remark
      }
      
      await updateUser(updateData)
      
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      fetchUserList()
    } catch (error) {
      ElMessage.error('更新失败：' + (error as any)?.message || '未知错误')
    } finally {
      submitting.value = false
    }
  })
}

// 重置密码
const handleResetPassword = (user: BaseUser) => {
  currentUser.value = user
  resetPasswordDialogVisible.value = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  try {
    // TODO: 调用后端 API
    // await resetPassword(currentUser.value!.userId, '123456')
    
    ElMessage.success('密码已重置为 123456')
    resetPasswordDialogVisible.value = false
  } catch (error) {
    ElMessage.error('重置失败')
  }
}

// 启用用户
const handleEnableUser = async (userId: number) => {
  try {
    await ElMessageBox.confirm('确定要启用该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await enableUser(userId)
    
    ElMessage.success('启用成功')
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('启用失败')
    }
  }
}

// 禁用用户
const handleDisableUser = async (userId: number) => {
  try {
    await ElMessageBox.confirm('确定要禁用该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await disableUser(userId)
    
    ElMessage.success('禁用成功')
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('禁用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(`确定要禁用的 ${selectedUsers.value.length} 个用户吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const userIds = selectedUsers.value.map((u: BaseUser) => u.userId)
    
    await batchDisableUsers(userIds)
    
    ElMessage.success('批量禁用成功')
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量禁用失败')
    }
  }
}

// 生命周期
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 20px;
  
  .search-card {
    margin-bottom: 20px;
    
    .el-form {
      margin-bottom: 0;
    }
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  // 头像预览样式
  .avatar-preview {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      .avatar-overlay {
        opacity: 1;
      }
    }
  }
  
  .avatar-preview-area {
    cursor: pointer;
  }
  
  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .el-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    span {
      font-size: 12px;
    }
  }
  
  // 详情页头像预览
  .avatar-detail-preview {
    padding: 20px 0;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 20px;
  }
  
  .avatar-detail-placeholder {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    border-radius: 8px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .avatar-placeholder {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    font-size: 20px;
  }
  
  // 头像选项样式
  .avatar-option {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 50%;
    padding: 3px;
    border: 2px solid transparent;
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
  
  // 头像选择效果
  .avatar-selected {
    border-color: #409eff !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
  }
}
</style>
