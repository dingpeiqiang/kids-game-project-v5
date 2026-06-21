<template>
  <div class="class-report">
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="班级">
          <el-select
            v-model="selectedClassId"
            placeholder="请选择班级"
            style="width: 220px"
            @change="onClassChange"
          >
            <el-option
              v-for="c in classOptions"
              :key="c.classId"
              :label="c.className"
              :value="c.classId"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadReport">刷新学情</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 班级整体统计 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.studentCount }}</div>
          <div class="stat-label">班级学生数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.activeCount }}</div>
          <div class="stat-label">活跃学生数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.avgAccuracy }}%</div>
          <div class="stat-label">平均正确率</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.totalAnswered }}</div>
          <div class="stat-label">累计答题数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <span>学生学情列表</span>
      </template>
      <el-table v-loading="loading" :data="studentRows" border stripe>
        <el-table-column label="学生ID" prop="kidId" width="90" />
        <el-table-column label="昵称" prop="nickname" min-width="140" />
        <el-table-column label="年级" width="100">
          <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
        </el-table-column>
        <el-table-column label="答题数" width="90" align="center">
          <template #default="{ row }">{{ row.overview?.totalAnswered ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="正确数" width="90" align="center">
          <template #default="{ row }">{{ row.overview?.totalCorrect ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="正确率" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.overview">{{ row.overview.accuracy }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="游学币" width="90" align="center">
          <template #default="{ row }">{{ row.overview?.totalPoints ?? row.fatiguePoints }}</template>
        </el-table-column>
        <el-table-column label="连续天数" width="100" align="center">
          <template #default="{ row }">{{ row.overview?.streakDays ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <EmptyState
        v-if="!loading && studentRows.length === 0"
        description="请选择班级查看学情"
        height="320px"
      />
    </el-card>

    <!-- 学生个人学情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="`个人学情 - ${currentStudent?.nickname || ''}`"
      width="640px"
    >
      <el-descriptions v-if="currentOverview" :column="2" border>
        <el-descriptions-item label="学生ID">{{ currentStudent?.kidId }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentStudent?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ gradeLabel(currentStudent?.grade) }}</el-descriptions-item>
        <el-descriptions-item label="连续学习天数">{{ currentOverview.streakDays }}</el-descriptions-item>
        <el-descriptions-item label="累计答题数">{{ currentOverview.totalAnswered }}</el-descriptions-item>
        <el-descriptions-item label="累计正确数">{{ currentOverview.totalCorrect }}</el-descriptions-item>
        <el-descriptions-item label="正确率">{{ currentOverview.accuracy }}%</el-descriptions-item>
        <el-descriptions-item label="累计游学币">{{ currentOverview.totalPoints }}</el-descriptions-item>
        <el-descriptions-item label="累计用时">{{ formatDuration(currentOverview.totalDuration) }}</el-descriptions-item>
        <el-descriptions-item label="错题数">{{ currentOverview.wrongCount }}</el-descriptions-item>
        <el-descriptions-item label="已收藏数">{{ currentOverview.collectedCount }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无学情数据" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import EmptyState from '@/components/EmptyState.vue';
import { classApi } from '@/services/class-api.service';
import { parentReportApi } from '@/services/parent-report-api.service';
import type { SchoolClass, Kid } from '@/services/api.types';
import type { LearningOverview } from '@/services/learning-report-api.service';
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

interface StudentRow extends Kid {
  overview?: LearningOverview;
}

const classOptions = ref<SchoolClass[]>([]);
const selectedClassId = ref<number | undefined>(undefined);
const loading = ref(false);
const studentRows = ref<StudentRow[]>([]);

const detailVisible = ref(false);
const currentStudent = ref<StudentRow | null>(null);
const currentOverview = ref<LearningOverview | null>(null);

const stats = computed(() => {
  const total = studentRows.value.length;
  const withOverview = studentRows.value.filter((r) => r.overview);
  const activeCount = withOverview.filter((r) => (r.overview?.totalAnswered ?? 0) > 0).length;
  const totalAnswered = withOverview.reduce((sum, r) => sum + (r.overview?.totalAnswered ?? 0), 0);
  const avgAccuracy =
    withOverview.length > 0
      ? Math.round(
          withOverview.reduce((sum, r) => sum + (r.overview?.accuracy ?? 0), 0) /
            withOverview.length,
        )
      : 0;
  return {
    studentCount: total,
    activeCount,
    avgAccuracy,
    totalAnswered,
  };
});

function gradeLabel(grade?: string) {
  if (!grade) return '-';
  return gradeOptions.find((g) => g.value === grade)?.label ?? grade;
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return '-';
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

async function loadClasses() {
  try {
    classOptions.value = await classApi.myClasses();
    if (classOptions.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classOptions.value[0].classId;
      loadReport();
    }
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function onClassChange() {
  loadReport();
}

async function loadReport() {
  if (!selectedClassId.value) {
    studentRows.value = [];
    return;
  }
  loading.value = true;
  try {
    const students = await classApi.listStudents(selectedClassId.value);
    studentRows.value = students.map((s) => ({ ...s }));
    await loadOverviews();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
    studentRows.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadOverviews() {
  const results = await Promise.allSettled(
    studentRows.value.map((s) => parentReportApi.kidOverview(s.kidId)),
  );
  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      studentRows.value[idx].overview = res.value;
    }
  });
}

async function openDetail(row: StudentRow) {
  currentStudent.value = row;
  currentOverview.value = row.overview ?? null;
  if (!row.overview) {
    try {
      currentOverview.value = await parentReportApi.kidOverview(row.kidId);
      row.overview = currentOverview.value;
    } catch (e) {
      ElMessage.error(handleApiError(e).message);
      currentOverview.value = null;
    }
  }
  detailVisible.value = true;
}

onMounted(() => {
  loadClasses();
});
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #409eff;
}
.stat-label {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #909399;
}
.table-card {
  margin-bottom: 16px;
}
</style>
