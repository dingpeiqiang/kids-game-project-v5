<template>
  <div class="control-config-management">
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="儿童 ID">
          <el-input v-model="searchForm.kidId" placeholder="请输入儿童 ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 管控配置列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>管控配置列表</span>
          <el-button type="primary" @click="handleAddConfig">新增配置</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="configList" border stripe>
        <el-table-column prop="configId" label="配置 ID" width="80" />
        <el-table-column prop="userId" label="儿童 ID" width="100" />
        <el-table-column prop="childNickname" label="儿童昵称" />
        <el-table-column prop="guardianId" label="监护人 ID" width="100" />
        <el-table-column prop="guardianNickname" label="监护人昵称" />
        <el-table-column label="每日时长 (分钟)" width="100">
          <template #default="{ row }">{{ row.dailyDuration }}</template>
        </el-table-column>
        <el-table-column label="单次时长 (分钟)" width="100">
          <template #default="{ row }">{{ row.singleDuration }}</template>
        </el-table-column>
        <el-table-column label="允许时间段" width="150">
          <template #default="{ row }">{{ row.allowedTimeStart }} ~ {{ row.allowedTimeEnd }}</template>
        </el-table-column>
        <el-table-column label="游学币阈值" width="100">
          <template #default="{ row }">{{ row.fatiguePointThreshold || '-' }}</template>
        </el-table-column>
        <el-table-column label="控制模式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.fatigueControlMode === 'SOFT' ? 'success' : 'danger'">
              {{ row.fatigueControlMode === 'SOFT' ? '软性' : '强制' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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
        @size-change="fetchConfigList"
        @current-change="fetchConfigList"
        class="pagination"
      />
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '新增配置'" width="700px">
      <el-form :model="form" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="儿童 ID" required>
              <el-input v-model="form.userId" :disabled="isEdit" placeholder="请输入儿童 ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="监护人 ID">
              <el-input v-model="form.guardianId" placeholder="请输入监护人 ID（可选）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="每日时长 (分钟)" required>
              <el-input-number v-model="form.dailyDuration" :min="0" :max="1440" :step="5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单次时长 (分钟)" required>
              <el-input-number v-model="form.singleDuration" :min="0" :max="1440" :step="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="允许开始时间" required>
              <el-time-picker
                v-model="form.allowedTimeStart"
                format="HH:mm"
                value-format="HH:mm:ss"
                placeholder="选择开始时间"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="允许结束时间" required>
              <el-time-picker
                v-model="form.allowedTimeEnd"
                format="HH:mm"
                value-format="HH:mm:ss"
                placeholder="选择结束时间"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="答题获得积分">
              <el-input-number v-model="form.answerGetPoints" :min="0" :max="100" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日答题上限">
              <el-input-number v-model="form.dailyAnswerLimit" :min="0" :max="1000" :step="1" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="游学币阈值 (分钟)">
              <el-input-number v-model="form.fatiguePointThreshold" :min="0" :max="1440" :step="5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="强制休息时长 (分钟)">
              <el-input-number v-model="form.restDuration" :min="0" :max="120" :step="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="游学币控制模式">
          <el-radio-group v-model="form.fatigueControlMode">
            <el-radio value="SOFT">软性控制（提醒但不强制）</el-radio>
            <el-radio value="FORCED">强制控制（到点强制下线）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="游戏白名单">
          <el-input
            v-model="form.blockedGames"
            type="textarea"
            :rows="3"
            placeholder="请输入禁止的游戏 ID，多个用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getConfigList,
  addConfig,
  updateConfig,
  deleteConfig
} from '@/api/controlConfig'
import type { UserControlConfig } from '@/api/controlConfig'

interface ControlConfig {
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
  fatigueControlMode: 'SOFT' | 'FORCED'
  blockedGames?: string
}

interface SearchForm {
  kidId?: string
}

interface Pagination {
  page: number
  size: number
  total: number
}

// 响应式数据
const loading = ref(false)
const configList = ref<UserControlConfig[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)

const searchForm = reactive<SearchForm>({
  kidId: undefined
})

const pagination = reactive<Pagination>({
  page: 1,
  size: 10,
  total: 0
})

const form = reactive<Partial<ControlConfig>>({
  userId: undefined,
  guardianId: undefined,
  dailyDuration: 60,
  singleDuration: 30,
  allowedTimeStart: '06:00:00',
  allowedTimeEnd: '22:00:00',
  answerGetPoints: 1,
  dailyAnswerLimit: 10,
  fatiguePointThreshold: 60,
  restDuration: 15,
  fatigueControlMode: 'SOFT',
  blockedGames: ''
})

// 获取配置列表
const fetchConfigList = async () => {
  loading.value = true
  try {
    const res = await getConfigList({
      kidId: searchForm.kidId ? Number(searchForm.kidId) : undefined,
      page: pagination.page,
      size: pagination.size
    })
    
    // 解析分页数据
    const resAny = res as any
    if (resAny && typeof resAny === 'object' && 'records' in resAny) {
      configList.value = resAny.records || []
      pagination.total = resAny.total !== undefined && resAny.total !== null ? resAny.total : resAny.records?.length || 0
    } else if (resAny.data && typeof resAny.data === 'object' && 'records' in resAny.data) {
      // 兼容旧格式
      configList.value = resAny.data.records || []
      pagination.total = resAny.data.total !== undefined && resAny.data.total !== null ? resAny.data.total : resAny.data.records?.length || 0
    }
    
    loading.value = false
  } catch (error) {
    ElMessage.error('获取配置列表失败：' + (error as any)?.message || '未知错误')
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchConfigList()
}

// 重置
const handleReset = () => {
  searchForm.kidId = undefined
  pagination.page = 1
  fetchConfigList()
}

// 新增配置
const handleAddConfig = () => {
  isEdit.value = false
  Object.assign(form, {
    configId: undefined,
    userId: undefined,
    guardianId: undefined,
    dailyDuration: 60,
    singleDuration: 30,
    allowedTimeStart: '06:00:00',
    allowedTimeEnd: '22:00:00',
    answerGetPoints: 1,
    dailyAnswerLimit: 10,
    fatiguePointThreshold: 60,
    restDuration: 15,
    fatigueControlMode: 'SOFT',
    blockedGames: ''
  })
  dialogVisible.value = true
}

// 编辑配置
const handleEdit = (row: UserControlConfig) => {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

// 删除配置
const handleDelete = async (row: UserControlConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.childNickname || '该儿童'} 的管控配置吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteConfig(row.configId)

    ElMessage.success('删除成功')
    fetchConfigList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error as any)?.message || '未知错误')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!form.userId) {
    ElMessage.warning('请选择儿童用户')
    return
  }

  try {
    if (isEdit.value) {
      await updateConfig(form)
    } else {
      await addConfig(form)
    }

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    fetchConfigList()
  } catch (error) {
    ElMessage.error((error as any)?.message || (isEdit.value ? '更新失败' : '创建失败'))
  }
}

// 生命周期
onMounted(() => {
  fetchConfigList()
})
</script>

<style scoped lang="scss">
.control-config-management {
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
