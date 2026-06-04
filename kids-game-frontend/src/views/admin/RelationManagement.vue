<template>
  <div class="relation-management">
    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="监护人 ID">
          <el-input v-model="searchForm.guardianId" placeholder="请输入监护人 ID" clearable />
        </el-form-item>
        <el-form-item label="儿童 ID">
          <el-input v-model="searchForm.kidId" placeholder="请输入儿童 ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关系列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>监护关系列表</span>
          <el-button type="primary" @click="handleBindRelation">绑定关系</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="relationList" border stripe>
        <el-table-column prop="relationId" label="关系 ID" width="80" />
        <el-table-column prop="userA" label="监护人 ID" width="100" />
        <el-table-column prop="userB" label="儿童 ID" width="100" />
        <el-table-column label="关系类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getRelationTypeText(row.relationType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主监护人" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isPrimary ? 'success' : 'info'">
              {{ row.isPrimary ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限级别" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionLevelTag(row.permissionLevel)">
              {{ getPermissionLevelText(row.permissionLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleSetPrimary(row)" :disabled="row.isPrimary">
              设为主监护人
            </el-button>
            <el-button size="small" type="danger" @click="handleUnbind(row)">解绑</el-button>
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
        @size-change="fetchRelationList"
        @current-change="fetchRelationList"
        class="pagination"
      />
    </el-card>

    <!-- 绑定关系对话框 -->
    <el-dialog v-model="bindDialogVisible" title="绑定监护关系" width="500px">
      <el-form :model="bindForm" label-width="100px">
        <el-form-item label="监护人用户" required>
          <el-select v-model="bindForm.guardianUserId" placeholder="请选择监护人" filterable>
            <el-option
              v-for="user in guardianUsers"
              :key="user.userId"
              :label="`${user.nickname} (${user.username})`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="儿童用户" required>
          <el-select v-model="bindForm.kidUserId" placeholder="请选择儿童" filterable>
            <el-option
              v-for="user in kidUsers"
              :key="user.userId"
              :label="`${user.nickname} (${user.username})`"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系类型" required>
          <el-select v-model="bindForm.relationType" placeholder="请选择关系类型">
            <el-option label="父亲" value="FATHER" />
            <el-option label="母亲" value="MOTHER" />
            <el-option label="其他监护人" value="GUARDIAN" />
            <el-option label="导师" value="TUTOR" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否主监护人">
          <el-switch v-model="bindForm.isPrimary" />
        </el-form-item>
        <el-form-item label="权限级别">
          <el-select v-model="bindForm.permissionLevel" placeholder="请选择权限级别">
            <el-option label="完全权限" value="FULL" />
            <el-option label="部分权限" value="PARTIAL" />
            <el-option label="仅查看" value="VIEW_ONLY" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBindRelation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getRelationList,
  bindRelation,
  unbindRelation,
  setPrimaryGuardian
} from '@/api/relation'
import { getUserList } from '@/api/user'
import type { UserRelation as APIUserRelation } from '@/api/relation'
import type { BaseUser } from '@/types/user'

interface RelationUserRelation extends APIUserRelation {
  guardianUserId: number
  guardianNickname: string
  kidUserId: number
  kidNickname: string
}

interface SearchForm {
  guardianId?: string
  kidId?: string
}

interface BindForm {
  guardianUserId: string
  kidUserId: string
  relationType: string
  isPrimary: boolean
  permissionLevel: string
}

interface Pagination {
  page: number
  size: number
  total: number
}

// 响应式数据
const loading = ref(false)
const relationList = ref<APIUserRelation[]>([])
const bindDialogVisible = ref(false)

// 用户列表（用于下拉选择）
const guardianUsers = ref<BaseUser[]>([]) // 家长用户
const kidUsers = ref<BaseUser[]>([]) // 儿童用户

const searchForm = reactive<SearchForm>({
  guardianId: undefined,
  kidId: undefined
})

const pagination = reactive<Pagination>({
  page: 1,
  size: 10,
  total: 0
})

const bindForm = reactive<BindForm>({
  guardianUserId: '',
  kidUserId: '',
  relationType: 'FATHER',
  isPrimary: false,
  permissionLevel: 'FULL'
})

// 获取关系类型文本
const getRelationTypeText = (type: string): string => {
  const map: Record<string, string> = {
    FATHER: '父亲',
    MOTHER: '母亲',
    GUARDIAN: '其他监护人',
    TUTOR: '导师'
  }
  return map[type] || type
}

// 获取权限级别文本
const getPermissionLevelText = (level: string): string => {
  const map: Record<string, string> = {
    FULL: '完全权限',
    PARTIAL: '部分权限',
    VIEW_ONLY: '仅查看'
  }
  return map[level] || level
}

// 获取权限级别标签颜色
const getPermissionLevelTag = (level: string): string => {
  const map: Record<string, string> = {
    FULL: 'danger',
    PARTIAL: 'warning',
    VIEW_ONLY: 'info'
  }
  return map[level] || ''
}

// 加载用户列表（用于下拉选择）
const loadUsersForSelect = async () => {
  try {
    // 加载所有家长用户（userType: 1）
    const guardianRes = await getUserList({ page: 1, size: 100 })
    // 过滤出家长用户
    guardianUsers.value = (guardianRes.list || []).filter(u => u.userType === 1)
    
    // 加载所有儿童用户（userType: 0）
    const kidRes = await getUserList({ page: 1, size: 100 })
    // 过滤出儿童用户
    kidUsers.value = (kidRes.list || []).filter(u => u.userType === 0)
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

// 获取关系列表
const fetchRelationList = async () => {
  loading.value = true
  try {
    const res = await getRelationList({
      guardianId: searchForm.guardianId,
      kidId: searchForm.kidId,
      page: pagination.page,
      size: pagination.size
    })
    
    console.log('[RelationManagement] API 返回数据:', res)
    
    // 后端返回分页对象 { records: [...], total: 100 }
    if (res && typeof res === 'object' && 'records' in res) {
      relationList.value = res.records || []
      pagination.total = res.total || res.records?.length || 0
    } else if (res && typeof res === 'object' && 'data' in res) {
      // 兼容旧格式 { data: [...] }
      const data = (res as any).data
      if (Array.isArray(data)) {
        relationList.value = data
        pagination.total = data.length
      } else if (data && typeof data === 'object' && 'records' in data) {
        // { data: { records: [...], total: 100 } }
        relationList.value = data.records || []
        pagination.total = data.total || data.records?.length || 0
      }
    } else if (Array.isArray(res)) {
      // 直接数组
      relationList.value = res as any[]
      pagination.total = (res as any[]).length
    } else {
      relationList.value = []
      pagination.total = 0
    }
    
    loading.value = false
  } catch (error) {
    console.error('[RelationManagement] 获取关系列表失败:', error)
    ElMessage.error('获取关系列表失败')
    loading.value = false
    relationList.value = []
    pagination.total = 0
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchRelationList()
}

// 重置
const handleReset = () => {
  searchForm.guardianId = undefined
  searchForm.kidId = undefined
  pagination.page = 1
  fetchRelationList()
}

// 绑定关系
const handleBindRelation = () => {
  bindDialogVisible.value = true
}

// 确认绑定
const confirmBindRelation = async () => {
  if (!bindForm.guardianUserId || !bindForm.kidUserId || !bindForm.relationType) {
    ElMessage.warning('请选择监护人和儿童')
    return
  }

  try {
    await bindRelation({
      guardianUserId: Number(bindForm.guardianUserId),
      kidUserId: Number(bindForm.kidUserId),
      relationType: bindForm.relationType as 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'TUTOR',
      isPrimary: bindForm.isPrimary,
      permissionLevel: bindForm.permissionLevel as 'FULL' | 'PARTIAL' | 'VIEW_ONLY'
    })

    ElMessage.success('绑定关系成功')
    bindDialogVisible.value = false
    fetchRelationList()
    // 重置表单
    bindForm.guardianUserId = ''
    bindForm.kidUserId = ''
    bindForm.relationType = 'FATHER'
    bindForm.isPrimary = false
    bindForm.permissionLevel = 'FULL'
  } catch (error) {
    ElMessage.error('绑定关系失败：' + (error as any)?.message || '未知错误')
  }
}

// 设置主监护人
const handleSetPrimary = async (row: RelationUserRelation) => {
  try {
    await setPrimaryGuardian(row.userA, row.userB)
    ElMessage.success('设置成功')
    fetchRelationList()
  } catch (error) {
    ElMessage.error('设置失败')
  }
}

// 解绑关系
const handleUnbind = async (row: RelationUserRelation) => {
  try {
    await ElMessageBox.confirm(
      `确定要解绑用户 ${row.userA} 和 ${row.userB} 的监护关系吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await unbindRelation(row.userA, row.userB)
    ElMessage.success('解绑成功')
    fetchRelationList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('解绑失败：' + (error as any)?.message || '未知错误')
    }
  }
}

// 初始化
onMounted(() => {
  fetchRelationList()
  loadUsersForSelect() // 加载用户列表用于下拉选择
})

</script>

<style scoped lang="scss">
.relation-management {
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
