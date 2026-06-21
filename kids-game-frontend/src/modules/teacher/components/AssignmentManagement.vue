<template>
  <div class="assignment-management">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>练习任务</span>
          <div>
            <el-select
              v-model="filterStatus"
              placeholder="全部状态"
              clearable
              style="width: 120px; margin-right: 8px"
              @change="handleSearch"
            >
              <el-option
                v-for="s in statusOptions"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
            <el-button type="primary" @click="openCreate">布置任务</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="assignmentList" border stripe>
        <el-table-column prop="title" label="任务标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="班级" width="140">
          <template #default="{ row }">{{ classLabel(row.classId) }}</template>
        </el-table-column>
        <el-table-column label="学科" width="100">
          <template #default="{ row }">{{ subjectLabel(row.subjectId) }}</template>
        </el-table-column>
        <el-table-column label="题量" width="80" align="center">
          <template #default="{ row }">{{ row.questionCount }}</template>
        </el-table-column>
        <el-table-column label="截止时间" width="170">
          <template #default="{ row }">{{ formatTime(row.dueTime) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openCompletions(row)">完成情况</el-button>
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该任务？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 创建/编辑任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '布置任务'"
      width="760px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="班级" prop="classId">
              <el-select v-model="form.classId" placeholder="请选择班级" style="width: 100%">
                <el-option
                  v-for="c in classOptions"
                  :key="c.classId"
                  :label="c.className"
                  :value="c.classId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学科">
              <el-select
                v-model="form.subjectId"
                placeholder="请选择学科"
                clearable
                filterable
                style="width: 100%"
                @change="onSubjectChange"
              >
                <el-option
                  v-for="s in subjectOptions"
                  :key="s.subjectId"
                  :label="s.subjectName"
                  :value="s.subjectId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="任务标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务标题" maxlength="100" />
        </el-form-item>

        <el-form-item label="任务说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="知识点范围">
          <el-tree-select
            v-model="form.knowledgePointIds"
            :data="knowledgeTree"
            :props="treeSelectProps"
            multiple
            :render-after-expand="false"
            show-checkbox
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            placeholder="不选则不限知识点"
            style="width: 100%"
            empty-text="请先选择学科"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="难度范围">
              <el-select v-model="form.difficultyRange" style="width: 100%">
                <el-option
                  v-for="d in difficultyOptions"
                  :key="d.value"
                  :label="d.label"
                  :value="d.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题型限制">
              <el-select v-model="form.questionType" style="width: 100%">
                <el-option
                  v-for="t in questionTypeOptions"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题目数量" prop="questionCount">
              <el-input-number v-model="form.questionCount" :min="1" :max="100" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="截止时间">
              <el-date-picker
                v-model="form.dueTime"
                type="datetime"
                placeholder="选择截止时间"
                format="YYYY-MM-DD HH:mm"
                value-format="x"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="奖励游学币">
              <el-input-number v-model="form.pointsReward" :min="0" :max="999" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option :value="0" label="草稿" />
                <el-option :value="1" label="发布" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 完成情况弹窗 -->
    <el-dialog
      v-model="completionsVisible"
      :title="`完成情况 - ${currentAssignment?.title || ''}`"
      width="860px"
    >
      <el-table v-loading="completionsLoading" :data="completionList" border stripe max-height="460">
        <el-table-column label="学生ID" prop="studentId" width="90" />
        <el-table-column label="完成状态" width="100">
          <template #default="{ row }">
            <el-tag :type="finishTagType(row.finishStatus)">
              {{ finishLabel(row.finishStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="答题数" width="90" align="center">
          <template #default="{ row }">{{ row.answeredCount }}/{{ row.totalCount }}</template>
        </el-table-column>
        <el-table-column label="正确数" width="90" align="center">
          <template #default="{ row }">{{ row.correctCount }}</template>
        </el-table-column>
        <el-table-column label="正确率" width="100" align="center">
          <template #default="{ row }">{{ accuracyText(row) }}</template>
        </el-table-column>
        <el-table-column label="用时" width="100" align="center">
          <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="获得游学币" width="100" align="center">
          <template #default="{ row }">{{ row.pointsEarned ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="完成时间" width="170">
          <template #default="{ row }">{{ formatTime(row.finishTime) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { assignmentApi, type AssignmentSavePayload } from '@/services/assignment-api.service';
import { classApi } from '@/services/class-api.service';
import { subjectApi } from '@/services/subject-api.service';
import { knowledgePointApi } from '@/services/knowledge-point-api.service';
import type {
  PracticeAssignment,
  AssignmentCompletion,
  SchoolClass,
  Subject,
  KnowledgePoint,
} from '@/services/api.types';
import { DIFFICULTY_RANGE } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const treeSelectProps = {
  label: 'name',
  value: 'knowledgePointId',
  children: 'children',
};

const difficultyOptions = [
  { value: DIFFICULTY_RANGE.ALL, label: '全部难度' },
  { value: DIFFICULTY_RANGE.EASY, label: '简单' },
  { value: DIFFICULTY_RANGE.MEDIUM, label: '中等' },
  { value: DIFFICULTY_RANGE.HARD, label: '困难' },
];

const questionTypeOptions = [
  { value: '', label: '全部题型' },
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'short_answer', label: '简答题' },
];

const statusOptions = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已发布' },
  { value: 2, label: '已截止' },
];

const pagination = reactive({ page: 1, size: 10, total: 0 });
const loading = ref(false);
const filterStatus = ref<number | undefined>(undefined);
const assignmentList = ref<PracticeAssignment[]>([]);

const classOptions = ref<SchoolClass[]>([]);
const subjectOptions = ref<Subject[]>([]);
const knowledgeTree = ref<KnowledgePoint[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  assignmentId: undefined as number | undefined,
  classId: undefined as number | undefined,
  title: '',
  description: '',
  subjectId: undefined as number | undefined,
  knowledgePointIds: [] as number[],
  difficultyRange: DIFFICULTY_RANGE.ALL as string,
  questionCount: 10,
  questionType: '' as string,
  dueTime: undefined as string | undefined,
  pointsReward: 5,
  status: 1,
});

const rules: FormRules = {
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  questionCount: [{ required: true, message: '请输入题目数量', trigger: 'blur' }],
};

const completionsVisible = ref(false);
const completionsLoading = ref(false);
const completionList = ref<AssignmentCompletion[]>([]);
const currentAssignment = ref<PracticeAssignment | null>(null);

watch(
  () => form.subjectId,
  async (subjectId) => {
    form.knowledgePointIds = [];
    if (!subjectId) {
      knowledgeTree.value = [];
      return;
    }
    try {
      knowledgeTree.value = await knowledgePointApi.tree(subjectId);
    } catch (e) {
      ElMessage.error(handleApiError(e).message);
    }
  },
);

function onSubjectChange() {
  // watch 会处理 tree 加载与清空
}

function classLabel(classId?: number) {
  if (!classId) return '-';
  return classOptions.value.find((c) => c.classId === classId)?.className ?? `#${classId}`;
}

function subjectLabel(subjectId?: number) {
  if (!subjectId) return '-';
  return subjectOptions.value.find((s) => s.subjectId === subjectId)?.subjectName ?? '-';
}

function statusLabel(status?: number) {
  const map: Record<number, string> = { 0: '草稿', 1: '已发布', 2: '已截止', 3: '已删除' };
  return map[status ?? -1] ?? '-';
}

function statusTagType(status?: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<number, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger',
  };
  return map[status ?? -1] ?? '';
}

function finishLabel(status?: number) {
  const map: Record<number, string> = { 0: '未开始', 1: '进行中', 2: '已完成' };
  return map[status ?? -1] ?? '-';
}

function finishTagType(status?: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<number, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    0: 'info',
    1: 'warning',
    2: 'success',
  };
  return map[status ?? -1] ?? '';
}

function accuracyText(row: AssignmentCompletion) {
  if (!row.totalCount || row.totalCount === 0) return '-';
  return `${Math.round((row.correctCount / row.totalCount) * 100)}%`;
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return '-';
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await assignmentApi.pageByTeacher({
      status: filterStatus.value,
      page: pagination.page,
      size: pagination.size,
    });
    assignmentList.value = res.list;
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

async function loadClasses() {
  try {
    classOptions.value = await classApi.myClasses();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function loadSubjects() {
  try {
    subjectOptions.value = await subjectApi.list();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

async function openEdit(row: PracticeAssignment) {
  isEdit.value = true;
  try {
    const detail = await assignmentApi.getById(row.assignmentId);
    resetForm();
    form.assignmentId = detail.assignmentId;
    form.classId = detail.classId;
    form.title = detail.title;
    form.description = detail.description ?? '';
    form.subjectId = detail.subjectId;
    try {
      form.knowledgePointIds = detail.knowledgePointIds
        ? (JSON.parse(detail.knowledgePointIds) as number[])
        : [];
    } catch {
      form.knowledgePointIds = [];
    }
    form.difficultyRange = detail.difficultyRange || DIFFICULTY_RANGE.ALL;
    form.questionCount = detail.questionCount;
    form.questionType = detail.questionType ?? '';
    form.dueTime = detail.dueTime ? String(detail.dueTime) : undefined;
    form.pointsReward = detail.pointsReward ?? 0;
    form.status = detail.status;
    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function resetForm() {
  form.assignmentId = undefined;
  form.classId = undefined;
  form.title = '';
  form.description = '';
  form.subjectId = undefined;
  form.knowledgePointIds = [];
  form.difficultyRange = DIFFICULTY_RANGE.ALL;
  form.questionCount = 10;
  form.questionType = '';
  form.dueTime = undefined;
  form.pointsReward = 5;
  form.status = 1;
  knowledgeTree.value = [];
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload: AssignmentSavePayload = {
        classId: form.classId as number,
        title: form.title,
        description: form.description || undefined,
        subjectId: form.subjectId,
        knowledgePointIds: form.knowledgePointIds.length ? form.knowledgePointIds : undefined,
        difficultyRange: form.difficultyRange,
        questionCount: form.questionCount,
        questionType: form.questionType || undefined,
        dueTime: form.dueTime ? Number(form.dueTime) : undefined,
        pointsReward: form.pointsReward,
        status: form.status,
      };
      if (isEdit.value && form.assignmentId) {
        await assignmentApi.update(form.assignmentId, payload);
        ElMessage.success('更新成功');
      } else {
        await assignmentApi.create(payload);
        ElMessage.success('布置成功');
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

async function handleDelete(row: PracticeAssignment) {
  try {
    await assignmentApi.delete(row.assignmentId);
    ElMessage.success('已删除');
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function openCompletions(row: PracticeAssignment) {
  currentAssignment.value = row;
  completionsVisible.value = true;
  completionsLoading.value = true;
  try {
    completionList.value = await assignmentApi.listCompletions(row.assignmentId);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
    completionList.value = [];
  } finally {
    completionsLoading.value = false;
  }
}

onMounted(() => {
  loadClasses();
  loadSubjects();
  fetchList();
});
</script>

<style scoped>
.table-card {
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
</style>
