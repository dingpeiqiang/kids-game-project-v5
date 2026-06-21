<template>
  <div class="class-management">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>我的班级</span>
          <el-button type="primary" @click="openCreate">创建班级</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="classList" border stripe>
        <el-table-column prop="className" label="班级名称" min-width="160" />
        <el-table-column label="年级" width="100">
          <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
        </el-table-column>
        <el-table-column label="学年" width="120">
          <template #default="{ row }">{{ row.schoolYear || '-' }}</template>
        </el-table-column>
        <el-table-column label="邀请码" width="180">
          <template #default="{ row }">
            <span v-if="row.inviteCode" class="invite-code">{{ row.inviteCode }}</span>
            <span v-else>-</span>
            <el-button
              v-if="row.inviteCode"
              link
              type="primary"
              size="small"
              @click="copyCode(row.inviteCode)"
            >
              复制
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="学生数" width="90" align="center">
          <template #default="{ row }">{{ studentCountMap[row.classId] ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '已解散' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openMembers(row)">成员</el-button>
            <el-button size="small" @click="openStudents(row)">学生</el-button>
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm
              title="确定解散该班级？解散后不可恢复"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger">解散</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <EmptyState
        v-if="!loading && classList.length === 0"
        description="暂无班级，点击右上角创建"
        height="320px"
        show-refresh
        @refresh="fetchList"
      />
    </el-card>

    <!-- 创建/编辑班级弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑班级' : '创建班级'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="form.className" placeholder="如：三年级2班" maxlength="50" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
            <el-option
              v-for="g in gradeOptions"
              :key="g.value"
              :label="g.label"
              :value="g.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学年" prop="schoolYear">
          <el-input v-model="form.schoolYear" placeholder="如：2025-2026" maxlength="20" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 班级成员弹窗 -->
    <el-dialog
      v-model="membersVisible"
      :title="`班级成员 - ${currentClass?.className || ''}`"
      width="720px"
    >
      <el-table v-loading="membersLoading" :data="memberList" border stripe max-height="420">
        <el-table-column label="用户ID" prop="userId" width="90" />
        <el-table-column label="昵称" min-width="140">
          <template #default="{ row }">{{ row.kid?.nickname || `用户${row.userId}` }}</template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'TEACHER' ? 'warning' : 'success'">
              {{ row.role === 'TEACHER' ? '教师' : '学生' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '已退出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="加入时间" width="180">
          <template #default="{ row }">{{ formatTime(row.joinTime) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 班级学生弹窗 -->
    <el-dialog
      v-model="studentsVisible"
      :title="`班级学生 - ${currentClass?.className || ''}`"
      width="720px"
    >
      <el-table v-loading="studentsLoading" :data="studentList" border stripe max-height="420">
        <el-table-column label="学生ID" prop="kidId" width="90" />
        <el-table-column label="昵称" prop="nickname" min-width="140" />
        <el-table-column label="用户名" prop="username" min-width="120" />
        <el-table-column label="年级" width="100">
          <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
        </el-table-column>
        <el-table-column label="游学币" prop="fatiguePoints" width="90" align="center" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import EmptyState from '@/components/EmptyState.vue';
import { classApi, type ClassSavePayload } from '@/services/class-api.service';
import type { SchoolClass, ClassMember, Kid } from '@/services/api.types';
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

const loading = ref(false);
const classList = ref<SchoolClass[]>([]);
const studentCountMap = ref<Record<number, number>>({});

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  classId: undefined as number | undefined,
  className: '',
  grade: '3',
  schoolYear: '',
  description: '',
});

const rules: FormRules = {
  className: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
};

const membersVisible = ref(false);
const membersLoading = ref(false);
const memberList = ref<ClassMember[]>([]);
const studentsVisible = ref(false);
const studentsLoading = ref(false);
const studentList = ref<Kid[]>([]);
const currentClass = ref<SchoolClass | null>(null);

function gradeLabel(grade?: string) {
  if (!grade) return '-';
  return gradeOptions.find((g) => g.value === grade)?.label ?? grade;
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

async function fetchList() {
  loading.value = true;
  try {
    const list = await classApi.myClasses();
    classList.value = list;
    loadStudentCounts(list);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  } finally {
    loading.value = false;
  }
}

async function loadStudentCounts(list: SchoolClass[]) {
  await Promise.all(
    list.map(async (c) => {
      try {
        const students = await classApi.listStudents(c.classId);
        studentCountMap.value[c.classId] = students.length;
      } catch {
        studentCountMap.value[c.classId] = 0;
      }
    }),
  );
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success('邀请码已复制');
  } catch {
    ElMessage.warning(`复制失败，请手动复制：${code}`);
  }
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: SchoolClass) {
  isEdit.value = true;
  form.classId = row.classId;
  form.className = row.className;
  form.grade = row.grade || '3';
  form.schoolYear = row.schoolYear || '';
  form.description = row.description || '';
  dialogVisible.value = true;
}

function resetForm() {
  form.classId = undefined;
  form.className = '';
  form.grade = '3';
  form.schoolYear = '';
  form.description = '';
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload: ClassSavePayload = {
        className: form.className,
        grade: form.grade,
        schoolYear: form.schoolYear || undefined,
        description: form.description || undefined,
      };
      if (isEdit.value && form.classId) {
        await classApi.update(form.classId, payload);
        ElMessage.success('更新成功');
      } else {
        await classApi.create(payload);
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

async function handleDelete(row: SchoolClass) {
  try {
    await classApi.delete(row.classId);
    ElMessage.success('已解散');
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function openMembers(row: SchoolClass) {
  currentClass.value = row;
  membersVisible.value = true;
  membersLoading.value = true;
  try {
    memberList.value = await classApi.listMembers(row.classId);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
    memberList.value = [];
  } finally {
    membersLoading.value = false;
  }
}

async function openStudents(row: SchoolClass) {
  currentClass.value = row;
  studentsVisible.value = true;
  studentsLoading.value = true;
  try {
    studentList.value = await classApi.listStudents(row.classId);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
    studentList.value = [];
  } finally {
    studentsLoading.value = false;
  }
}

onMounted(() => {
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
.invite-code {
  font-family: monospace;
  font-weight: 600;
  margin-right: 8px;
}
</style>
