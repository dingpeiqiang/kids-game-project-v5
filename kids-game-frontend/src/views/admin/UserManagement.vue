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
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row.userId)">详情</el-button>
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
    <el-dialog v-model="detailDialogVisible" title="用户详情" width="600px">
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="用户 ID">{{ currentUser.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
        <el-descriptions-item label="用户类型">
          {{ getUserTypeText(currentUser.userType) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusText(currentUser.status) }}
        </el-descriptions-item>
        <el-descriptions-item label="疲劳点">{{ currentUser.fatiguePoints }}</el-descriptions-item>
        <el-descriptions-item label="每日答题积分">{{ currentUser.dailyAnswerPoints }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          {{ formatTime(currentUser.lastLoginTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(currentUser.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 用户类型定义
interface BaseUser {
  userId: number
  username: string
  nickname: string
  userType: number
  status: number
  fatiguePoints?: number
  dailyAnswerPoints?: number
  createTime?: number
  lastLoginTime?: number
}

// API 导入（暂时使用 mock 数据）
// import { getUserList, enableUser, disableUser } from '@/api/user'

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
    // TODO: 调用真实 API
    // const res = await getUserList({
    //   userType: searchForm.userType ? String(searchForm.userType) : undefined,
    //   status: searchForm.status ? String(searchForm.status) : undefined,
    //   page: pagination.page,
    //   size: pagination.size
    // })
    
    // Mock 数据
    setTimeout(() => {
      userList.value = [
        {
          userId: 1,
          username: 'admin',
          nickname: '管理员',
          userType: 2,
          status: 1,
          fatiguePoints: 10,
          dailyAnswerPoints: 0,
          createTime: Date.now(),
          lastLoginTime: Date.now()
        },
        {
          userId: 2,
          username: 'parent1',
          nickname: '张三',
          userType: 1,
          status: 1,
          fatiguePoints: 10,
          dailyAnswerPoints: 0,
          createTime: Date.now() - 86400000,
          lastLoginTime: Date.now() - 3600000
        },
        {
          userId: 3,
          username: 'kid001',
          nickname: '小明',
          userType: 0,
          status: 1,
          fatiguePoints: 5,
          dailyAnswerPoints: 3,
          createTime: Date.now() - 172800000,
          lastLoginTime: Date.now() - 7200000
        }
      ] as any
      pagination.total = userList.value.length
      loading.value = false
    }, 500)
  } catch (error) {
    ElMessage.error('获取用户列表失败')
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

// 启用用户
const handleEnableUser = async (userId: number) => {
  try {
    await ElMessageBox.confirm('确定要启用该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // TODO: 调用 API
    // await enableUser(userId)
    
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
    
    // TODO: 调用 API
    // await disableUser(userId)
    
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
    
    // TODO: 调用 API
    // await batchDisableUsers(userIds)
    
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
}
</style>
