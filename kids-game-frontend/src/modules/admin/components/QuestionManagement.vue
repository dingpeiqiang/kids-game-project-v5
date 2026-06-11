<template>
  <div class="question-management">
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="学龄">
          <el-select v-model="searchForm.grade" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="选择题" value="choice" />
            <el-option label="填空题" value="fill" />
            <el-option label="判断题" value="judgment" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>题库列表</span>
          <div>
            <el-button type="primary" @click="openCreate">新增题目</el-button>
            <el-button
              type="warning"
              :disabled="selectedIds.length === 0"
              @click="batchDisable"
            >
              批量禁用
            </el-button>
            <el-button
              type="success"
              :disabled="selectedIds.length === 0"
              @click="batchEnable"
            >
              批量启用
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="questionList"
        border
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="questionId" label="ID" width="72" />
        <el-table-column prop="content" label="题干" min-width="220" show-overflow-tooltip />
        <el-table-column label="学龄" width="88">
          <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
        </el-table-column>
        <el-table-column label="题型" width="88">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column label="难度" width="72">
          <template #default="{ row }">{{ row.difficulty ?? 1 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168">
          <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row.questionId)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <EmptyState
        v-if="!loading && questionList.length === 0"
        description="暂无题目"
        height="320px"
        show-refresh
        @refresh="fetchList"
      />

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pagination"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑题目' : '新增题目'"
      width="640px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="题干" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item v-if="form.type !== 'fill'" label="选项" prop="options">
          <el-input
            v-model="form.options"
            type="textarea"
            :rows="form.type === 'judgment' ? 2 : 4"
            :placeholder="form.type === 'judgment' ? '默认对/错，可留空' : 'JSON 数组或逗号分隔，如 8个,7个,9个,6个'"
          />
          <div class="form-hint">
            {{ form.type === 'judgment' ? '判断题默认「对/错」；正确答案填 对、错 或 A/B' : '选择题必填；正确答案填选项全文或 A/B/C/D' }}
          </div>
        </el-form-item>
        <el-form-item label="正确答案" prop="correctAnswer">
          <el-input
            v-model="form.correctAnswer"
            :placeholder="correctAnswerPlaceholder"
          />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="form.analysis" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="学龄" prop="grade">
          <el-select v-model="form.grade" style="width: 100%">
            <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="选择题" value="choice" />
            <el-option label="填空题" value="fill" />
            <el-option label="判断题" value="judgment" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-slider v-model="form.difficulty" :min="1" :max="5" show-stops />
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import EmptyState from '@/components/EmptyState.vue';
import { questionApi } from '@/services/question-api.service';
import type { Question } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const gradeOptions = [
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' },
  { value: '7', label: '初一' },
  { value: '8', label: '初二' },
  { value: '9', label: '初三' },
];

const searchForm = reactive({
  grade: '' as string | undefined,
  type: '' as string | undefined,
  status: undefined as number | undefined,
});

const pagination = reactive({ page: 1, size: 10, total: 0 });
const loading = ref(false);
const questionList = ref<Question[]>([]);
const selectedIds = ref<number[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  questionId: undefined as number | undefined,
  content: '',
  options: '[]',
  correctAnswer: '',
  analysis: '',
  grade: '3',
  type: 'choice',
  difficulty: 1,
  statusEnabled: true,
});

const rules: FormRules = {
  content: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  correctAnswer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择学龄', trigger: 'change' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
};

const correctAnswerPlaceholder = computed(() => {
  if (form.type === 'fill') return '填空标准答案（忽略首尾空格，不区分大小写）';
  if (form.type === 'judgment') return '对 / 错，或 A/B';
  return '选项全文或 A/B/C/D';
});

watch(
  () => form.type,
  (type) => {
    if (type === 'fill') {
      form.options = '[]';
    } else if (type === 'judgment' && !form.options.trim()) {
      form.options = JSON.stringify(['对', '错']);
    }
  },
);

function gradeLabel(grade: string) {
  return gradeOptions.find((g) => g.value === grade)?.label ?? grade;
}

function typeLabel(type: string) {
  const map: Record<string, string> = { choice: '选择题', fill: '填空题', judgment: '判断题' };
  return map[type] ?? type;
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

function normalizeOptions(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '[]';
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const parts = trimmed.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    return JSON.stringify(parts);
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await questionApi.pageQuestions({
      grade: searchForm.grade || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status,
      page: pagination.page,
      size: pagination.size,
    });
    questionList.value = res.list;
    pagination.total = res.total;
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  fetchList();
}

function handleReset() {
  searchForm.grade = '';
  searchForm.type = '';
  searchForm.status = undefined;
  pagination.page = 1;
  fetchList();
}

function onSelectionChange(rows: Question[]) {
  selectedIds.value = rows.map((r) => r.questionId);
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

async function openEdit(questionId: number) {
  isEdit.value = true;
  try {
    const q = await questionApi.getDetail(questionId);
    form.questionId = q.questionId;
    form.content = q.content;
    form.options = q.options || '[]';
    form.correctAnswer = q.correctAnswer ?? '';
    form.analysis = q.analysis ?? '';
    form.grade = q.grade;
    form.type = q.type || 'choice';
    form.difficulty = q.difficulty ?? 1;
    form.statusEnabled = q.status !== 0;
    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function resetForm() {
  form.questionId = undefined;
  form.content = '';
  form.options = '[]';
  form.correctAnswer = '';
  form.analysis = '';
  form.grade = '3';
  form.type = 'choice';
  form.difficulty = 1;
  form.statusEnabled = true;
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        content: form.content,
        options: form.type === 'fill' ? '[]' : normalizeOptions(form.options),
        correctAnswer: form.correctAnswer.trim(),
        analysis: form.analysis,
        grade: form.grade,
        type: form.type,
        difficulty: form.difficulty,
        status: form.statusEnabled ? 1 : 0,
      };
      if (isEdit.value && form.questionId) {
        await questionApi.updateQuestion(form.questionId, payload);
        ElMessage.success('更新成功');
      } else {
        await questionApi.createQuestion(payload);
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

async function handleDelete(row: Question) {
  try {
    await ElMessageBox.confirm(`确定删除题目 #${row.questionId}？`, '提示', { type: 'warning' });
    await questionApi.deleteQuestion(row.questionId);
    ElMessage.success('已删除');
    fetchList();
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(handleApiError(e).message);
    }
  }
}

async function batchEnable() {
  try {
    await questionApi.batchUpdateStatus(selectedIds.value, 1);
    ElMessage.success('已启用');
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function batchDisable() {
  try {
    await questionApi.batchUpdateStatus(selectedIds.value, 0);
    ElMessage.success('已禁用');
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
.question-management {
  padding: 0;
}
.search-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>