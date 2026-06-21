<template>
  <div class="subject-management">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>学科列表</span>
          <el-button type="primary" @click="openCreate">新增学科</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="subjectList" border stripe>
        <el-table-column prop="subjectId" label="ID" width="72" />
        <el-table-column prop="subjectCode" label="学科编码" width="140" />
        <el-table-column prop="subjectName" label="学科名称" width="160" />
        <el-table-column label="图标" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.iconUrl"
              :src="row.iconUrl"
              style="width: 32px; height: 32px"
              fit="cover"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              @change="(val: boolean) => toggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              :title="`确定删除学科「${row.subjectName}」？`"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <EmptyState
        v-if="!loading && subjectList.length === 0"
        description="暂无学科"
        height="320px"
        show-refresh
        @refresh="fetchList"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑学科' : '新增学科'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="学科编码" prop="subjectCode">
          <el-input
            v-model="form.subjectCode"
            placeholder="如 MATH、CHINESE"
            :disabled="isEdit"
            maxlength="32"
          />
        </el-form-item>
        <el-form-item label="学科名称" prop="subjectName">
          <el-input v-model="form.subjectName" placeholder="如 数学" maxlength="64" />
        </el-form-item>
        <el-form-item label="图标 URL">
          <el-input v-model="form.iconUrl" placeholder="学科图标地址" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.statusEnabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import EmptyState from '@/components/EmptyState.vue';
import { subjectApi } from '@/services/subject-api.service';
import type { Subject } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const loading = ref(false);
const subjectList = ref<Subject[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  subjectId: undefined as number | undefined,
  subjectCode: '',
  subjectName: '',
  iconUrl: '',
  description: '',
  sortOrder: 0,
  statusEnabled: true,
});

const rules: FormRules = {
  subjectCode: [{ required: true, message: '请输入学科编码', trigger: 'blur' }],
  subjectName: [{ required: true, message: '请输入学科名称', trigger: 'blur' }],
};

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

async function fetchList() {
  loading.value = true;
  try {
    subjectList.value = await subjectApi.listAll();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: Subject) {
  isEdit.value = true;
  resetForm();
  form.subjectId = row.subjectId;
  form.subjectCode = row.subjectCode;
  form.subjectName = row.subjectName;
  form.iconUrl = row.iconUrl ?? '';
  form.description = row.description ?? '';
  form.sortOrder = row.sortOrder ?? 0;
  form.statusEnabled = row.status !== 0;
  dialogVisible.value = true;
}

function resetForm() {
  form.subjectId = undefined;
  form.subjectCode = '';
  form.subjectName = '';
  form.iconUrl = '';
  form.description = '';
  form.sortOrder = 0;
  form.statusEnabled = true;
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        subjectCode: form.subjectCode.trim(),
        subjectName: form.subjectName.trim(),
        iconUrl: form.iconUrl.trim() || undefined,
        description: form.description.trim() || undefined,
        sortOrder: form.sortOrder,
        status: form.statusEnabled ? 1 : 0,
      };
      if (isEdit.value && form.subjectId) {
        await subjectApi.update(form.subjectId, payload);
        ElMessage.success('更新成功');
      } else {
        await subjectApi.create(payload);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchList();
    } catch (e) {
      ElMessage.error(handleApiError(e).message);
    } finally {
      saving.value = false;
    }
  });
}

async function handleDelete(row: Subject) {
  try {
    await subjectApi.delete(row.subjectId);
    ElMessage.success('已删除');
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function toggleStatus(row: Subject, enabled: boolean) {
  try {
    await subjectApi.update(row.subjectId, {
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      iconUrl: row.iconUrl,
      description: row.description,
      sortOrder: row.sortOrder,
      status: enabled ? 1 : 0,
    });
    ElMessage.success(enabled ? '已启用' : '已禁用');
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
.subject-management {
  padding: 0;
}
.table-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
