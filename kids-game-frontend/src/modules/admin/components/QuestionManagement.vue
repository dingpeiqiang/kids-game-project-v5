<template>
  <div class="question-management">
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="学龄">
          <el-select v-model="searchForm.grade" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学科">
          <el-select
            v-model="searchForm.subjectId"
            placeholder="全部"
            clearable
            filterable
            style="width: 140px"
            @change="onSearchSubjectChange"
          >
            <el-option
              v-for="s in subjectOptions"
              :key="s.subjectId"
              :label="s.subjectName"
              :value="s.subjectId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="t in questionTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="n in 5" :key="n" :label="`${n} 星`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="知识点">
          <el-tree-select
            v-model="searchForm.knowledgePointId"
            :data="knowledgeTreeData"
            :props="treeSelectProps"
            :render-after-expand="false"
            clearable
            check-strictly
            placeholder="全部"
            style="width: 180px"
            empty-text="请先选择学科"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="题干关键词"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
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
            <el-button type="info" @click="openImportDialog">批量导入</el-button>
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
        <el-table-column label="学科" width="100">
          <template #default="{ row }">{{ subjectLabel(row.subjectId) }}</template>
        </el-table-column>
        <el-table-column label="知识点" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ knowledgePointLabels(row.knowledgePoints) }}</template>
        </el-table-column>
        <el-table-column label="学龄" width="88">
          <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
        </el-table-column>
        <el-table-column label="题型" width="92">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagType(row.type)">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="120">
          <template #default="{ row }">
            <el-rate :model-value="row.difficulty ?? 1" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column label="分值" width="72">
          <template #default="{ row }">{{ row.score ?? '-' }}</template>
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
      width="820px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学科" prop="subjectId">
              <el-select
                v-model="form.subjectId"
                placeholder="请选择学科"
                filterable
                style="width: 100%"
                @change="onFormSubjectChange"
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
          <el-col :span="12">
            <el-form-item label="题型" prop="type">
              <el-select v-model="form.type" style="width: 100%" @change="onTypeChange">
                <el-option
                  v-for="t in questionTypeOptions"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="知识点" prop="knowledgePointIds">
          <el-tree-select
            v-model="form.knowledgePointIds"
            :data="formKnowledgeTreeData"
            :props="treeSelectProps"
            multiple
            :render-after-expand="false"
            show-checkbox
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            placeholder="请选择知识点"
            style="width: 100%"
            empty-text="请先选择学科"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="难度">
              <el-rate v-model="form.difficulty" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分值">
              <el-input-number v-model="form.score" :min="0" :max="999" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="限时(秒)">
              <el-input-number v-model="form.timeLimit" :min="0" :max="3600" :step="10" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="学龄" prop="grade">
          <el-select v-model="form.grade" style="width: 100%">
            <el-option v-for="g in gradeOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="题干" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item v-if="showOptionsEditor" label="选项">
          <div class="options-editor">
            <div v-for="(opt, idx) in form.options" :key="idx" class="option-row">
              <span class="option-letter">{{ letterOf(idx) }}</span>
              <el-input v-model="form.options[idx]" placeholder="请输入选项内容" />
              <el-button
                v-if="form.options.length > 2"
                type="danger"
                link
                @click="removeOption(idx)"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" link @click="addOption">+ 新增选项</el-button>
          </div>
        </el-form-item>

        <el-form-item label="正确答案" prop="correctAnswer">
          <template v-if="form.type === QuestionTypeEnum.SINGLE || form.type === QuestionTypeEnum.IMAGE || form.type === QuestionTypeEnum.AUDIO">
            <el-radio-group v-model="form.singleAnswer">
              <el-radio v-for="(opt, idx) in form.options" :key="idx" :value="letterOf(idx)">
                {{ letterOf(idx) }}. {{ opt }}
              </el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="form.type === QuestionTypeEnum.MULTIPLE">
            <el-checkbox-group v-model="form.multipleAnswer">
              <el-checkbox v-for="(opt, idx) in form.options" :key="idx" :value="letterOf(idx)">
                {{ letterOf(idx) }}. {{ opt }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
          <template v-else-if="form.type === QuestionTypeEnum.JUDGE">
            <el-radio-group v-model="form.judgeAnswer">
              <el-radio value="对">对</el-radio>
              <el-radio value="错">错</el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="form.type === QuestionTypeEnum.FILL">
            <div class="fill-blanks">
              <div v-for="(_, idx) in form.fillAnswers" :key="idx" class="fill-row">
                <span class="fill-label">空 {{ idx + 1 }}</span>
                <el-input
                  v-model="form.fillAnswers[idx]"
                  placeholder="标准答案（多个备选用 | 分隔）"
                />
                <el-select
                  v-model="form.fillToleranceModes[idx]"
                  placeholder="容错模式"
                  style="width: 140px"
                >
                  <el-option
                    v-for="m in fillToleranceModeOptions"
                    :key="m.value"
                    :label="m.label"
                    :value="m.value"
                  />
                </el-select>
                <el-button
                  v-if="form.fillAnswers.length > 1"
                  type="danger"
                  link
                  @click="removeFillBlank(idx)"
                >
                  删除
                </el-button>
              </div>
              <el-button type="primary" link @click="addFillBlank">+ 新增空</el-button>
            </div>
          </template>
          <template v-else-if="form.type === QuestionTypeEnum.SHORT_ANSWER">
            <el-input
              v-model="form.shortAnswer"
              type="textarea"
              :rows="3"
              placeholder="参考答案（人工阅卷）"
            />
          </template>
        </el-form-item>

        <el-form-item v-if="form.type === QuestionTypeEnum.SHORT_ANSWER" label="关键词">
          <div class="tag-input">
            <el-tag
              v-for="(tag, idx) in form.shortAnswerKeywords"
              :key="idx"
              closable
              @close="removeKeyword(idx)"
              style="margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="keywordInputVisible"
              ref="keywordInputRef"
              v-model="keywordInputValue"
              size="small"
              style="width: 160px"
              @keyup.enter="confirmKeyword"
              @blur="confirmKeyword"
            />
            <el-button v-else size="small" @click="showKeywordInput">+ 关键词</el-button>
          </div>
        </el-form-item>

        <el-form-item label="媒体附件">
          <div class="media-editor">
            <div v-for="(m, idx) in form.mediaList" :key="idx" class="media-row">
              <el-select v-model="m.type" placeholder="类型" style="width: 100px">
                <el-option label="图片" value="image" />
                <el-option label="音频" value="audio" />
                <el-option label="视频" value="video" />
              </el-select>
              <el-input v-model="m.url" placeholder="资源 URL" />
              <el-input v-model="m.description" placeholder="描述（可选）" style="width: 180px" />
              <el-button type="danger" link @click="removeMedia(idx)">删除</el-button>
            </div>
            <el-button type="primary" link @click="addMedia">+ 新增附件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="form.analysis" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tag-input">
            <el-tag
              v-for="(tag, idx) in form.tags"
              :key="idx"
              closable
              @close="removeTag(idx)"
              style="margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              style="width: 140px"
              @keyup.enter="confirmTag"
              @blur="confirmTag"
            />
            <el-button v-else size="small" @click="showTagInput">+ 标签</el-button>
          </div>
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

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入题目"
      width="900px"
      destroy-on-close
      @closed="resetImportState"
    >
      <div class="import-dialog-content">
        <div class="import-actions">
          <el-button @click="downloadTemplate">下载模板</el-button>
          <el-upload
            ref="importUploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="handleImportFile"
          >
            <el-button type="primary">选择 Excel 文件</el-button>
          </el-upload>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <div class="import-summary">
            共解析 <strong>{{ importPreview.length }}</strong> 条，
            校验通过 <strong>{{ importValidCount }}</strong> 条，
            校验失败 <strong>{{ importPreview.length - importValidCount }}</strong> 条
          </div>
          <el-table :data="importPreview" border stripe max-height="400" size="small">
            <el-table-column type="index" label="#" width="48" />
            <el-table-column prop="content" label="题干" min-width="160" show-overflow-tooltip />
            <el-table-column prop="type" label="题型" width="80">
              <template #default="{ row }">{{ typeLabel(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="correctAnswer" label="正确答案" width="100" show-overflow-tooltip />
            <el-table-column prop="difficulty" label="难度" width="60" />
            <el-table-column prop="subjectId" label="学科ID" width="72" />
            <el-table-column prop="score" label="分值" width="56" />
            <el-table-column label="校验" width="80">
              <template #default="{ row }">
                <el-tag v-if="row._valid" type="success" size="small">通过</el-tag>
                <el-tag v-else type="danger" size="small">{{ row._error || '失败' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="请选择 Excel 文件进行导入" />
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="importValidCount === 0"
          @click="confirmImport"
        >
          确认导入（{{ importValidCount }} 条）
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue';
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import EmptyState from '@/components/EmptyState.vue';
import { questionApi } from '@/services/question-api.service';
import { subjectApi } from '@/services/subject-api.service';
import { knowledgePointApi } from '@/services/knowledge-point-api.service';
import type { Question, Subject, KnowledgePoint, FillToleranceMode, QuestionType } from '@/services/api.types';
import { QUESTION_TYPE, FILL_TOLERANCE_MODE } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const QuestionTypeEnum = QUESTION_TYPE;

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

const questionTypeOptions = [
  { value: QUESTION_TYPE.SINGLE, label: '单选题' },
  { value: QUESTION_TYPE.MULTIPLE, label: '多选题' },
  { value: QUESTION_TYPE.JUDGE, label: '判断题' },
  { value: QUESTION_TYPE.FILL, label: '填空题' },
  { value: QUESTION_TYPE.SHORT_ANSWER, label: '简答题' },
  { value: QUESTION_TYPE.IMAGE, label: '图片题' },
  { value: QUESTION_TYPE.AUDIO, label: '音频题' },
];

const fillToleranceModeOptions: { value: FillToleranceMode; label: string }[] = [
  { value: FILL_TOLERANCE_MODE.EXACT, label: '精确匹配' },
  { value: FILL_TOLERANCE_MODE.IGNORE_CASE, label: '忽略大小写' },
  { value: FILL_TOLERANCE_MODE.IGNORE_WHITESPACE, label: '忽略空白' },
  { value: FILL_TOLERANCE_MODE.IGNORE_PUNCTUATION, label: '忽略标点' },
  { value: FILL_TOLERANCE_MODE.KEYWORD, label: '关键词包含' },
];

const treeSelectProps = {
  label: 'name',
  value: 'knowledgePointId',
  children: 'children',
};

interface MediaItem {
  type: 'image' | 'audio' | 'video';
  url: string;
  description?: string;
}

const searchForm = reactive({
  grade: '' as string | undefined,
  type: '' as string | undefined,
  status: undefined as number | undefined,
  subjectId: undefined as number | undefined,
  difficulty: undefined as number | undefined,
  keyword: '' as string,
  knowledgePointId: undefined as number | undefined,
});

const pagination = reactive({ page: 1, size: 10, total: 0 });
const loading = ref(false);
const questionList = ref<Question[]>([]);
const selectedIds = ref<number[]>([]);

const subjectOptions = ref<Subject[]>([]);
const searchKnowledgeTree = ref<KnowledgePoint[]>([]);
const formKnowledgeTree = ref<KnowledgePoint[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  questionId: undefined as number | undefined,
  subjectId: undefined as number | undefined,
  knowledgePointIds: [] as number[],
  content: '',
  options: [] as string[],
  singleAnswer: '' as string,
  multipleAnswer: [] as string[],
  judgeAnswer: '对' as string,
  fillAnswers: [''] as string[],
  fillToleranceModes: [FILL_TOLERANCE_MODE.IGNORE_CASE] as FillToleranceMode[],
  shortAnswer: '' as string,
  shortAnswerKeywords: [] as string[],
  mediaList: [] as MediaItem[],
  analysis: '',
  grade: '3',
  type: QUESTION_TYPE.SINGLE as string,
  difficulty: 1,
  score: 10,
  timeLimit: 0,
  tags: [] as string[],
  statusEnabled: true,
});

const rules: FormRules = {
  content: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择学龄', trigger: 'change' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
};

const keywordInputVisible = ref(false);
const keywordInputValue = ref('');
const keywordInputRef = ref<InstanceType<typeof import('element-plus')['ElInput']>>();

const tagInputVisible = ref(false);
const tagInputValue = ref('');
const tagInputRef = ref<InstanceType<typeof import('element-plus')['ElInput']>>();

const optionsEditorTypes: ReadonlySet<string> = new Set([
  QUESTION_TYPE.SINGLE,
  QUESTION_TYPE.MULTIPLE,
  QUESTION_TYPE.JUDGE,
  QUESTION_TYPE.IMAGE,
  QUESTION_TYPE.AUDIO,
]);

const showOptionsEditor = computed(() => optionsEditorTypes.has(form.type));

const knowledgeTreeData = computed(() => searchKnowledgeTree.value);
const formKnowledgeTreeData = computed(() => formKnowledgeTree.value);

watch(
  () => form.subjectId,
  async (subjectId) => {
    form.knowledgePointIds = [];
    if (!subjectId) {
      formKnowledgeTree.value = [];
      return;
    }
    try {
      formKnowledgeTree.value = await knowledgePointApi.tree(subjectId);
    } catch (e) {
      ElMessage.error(handleApiError(e).message);
    }
  },
);

function onTypeChange(type: string) {
  form.singleAnswer = '';
  form.multipleAnswer = [];
  form.judgeAnswer = '对';
  form.fillAnswers = [''];
  form.fillToleranceModes = [FILL_TOLERANCE_MODE.IGNORE_CASE];
  form.shortAnswer = '';
  form.shortAnswerKeywords = [];
  if (type === QUESTION_TYPE.JUDGE) {
    form.options = ['对', '错'];
  } else if (showOptionsEditor.value && form.options.length < 2) {
    form.options = ['', ''];
  } else if (!showOptionsEditor.value) {
    form.options = [];
  }
}

function onSearchSubjectChange(subjectId?: number) {
  searchForm.knowledgePointId = undefined;
  if (!subjectId) {
    searchKnowledgeTree.value = [];
    return;
  }
  loadKnowledgeTree(subjectId, searchKnowledgeTree);
}

function onFormSubjectChange() {
  // watch 会处理 tree 加载与清空
}

async function loadKnowledgeTree(subjectId: number, target: ReturnType<typeof ref<KnowledgePoint[]>>) {
  try {
    target.value = await knowledgePointApi.tree(subjectId);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function gradeLabel(grade?: string) {
  if (!grade) return '-';
  return gradeOptions.find((g) => g.value === grade)?.label ?? grade;
}

function typeLabel(type?: string) {
  const map: Record<string, string> = {
    [QUESTION_TYPE.SINGLE]: '单选题',
    [QUESTION_TYPE.MULTIPLE]: '多选题',
    [QUESTION_TYPE.JUDGE]: '判断题',
    [QUESTION_TYPE.FILL]: '填空题',
    [QUESTION_TYPE.SHORT_ANSWER]: '简答题',
    [QUESTION_TYPE.IMAGE]: '图片题',
    [QUESTION_TYPE.AUDIO]: '音频题',
    choice: '选择题',
    judgment: '判断题',
  };
  return map[type ?? ''] ?? type ?? '-';
}

function typeTagType(type?: string) {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    [QUESTION_TYPE.SINGLE]: '',
    [QUESTION_TYPE.MULTIPLE]: 'success',
    [QUESTION_TYPE.JUDGE]: 'warning',
    [QUESTION_TYPE.FILL]: 'info',
    [QUESTION_TYPE.SHORT_ANSWER]: 'danger',
    [QUESTION_TYPE.IMAGE]: '',
    [QUESTION_TYPE.AUDIO]: 'success',
  };
  return map[type ?? ''] ?? '';
}

function subjectLabel(subjectId?: number) {
  if (!subjectId) return '-';
  return subjectOptions.value.find((s) => s.subjectId === subjectId)?.subjectName ?? '-';
}

function knowledgePointLabels(knowledgePointsJson?: string) {
  if (!knowledgePointsJson) return '-';
  try {
    const ids = JSON.parse(knowledgePointsJson) as number[];
    if (!Array.isArray(ids) || ids.length === 0) return '-';
    const names: string[] = [];
    const collect = (nodes: KnowledgePoint[]) => {
      nodes.forEach((n) => {
        if (ids.includes(n.knowledgePointId)) names.push(n.name);
        if (n.children?.length) collect(n.children);
      });
    };
    const tree = formKnowledgeTree.value.length ? formKnowledgeTree.value : searchKnowledgeTree.value;
    collect(tree);
    return names.length ? names.join('、') : ids.join(',');
  } catch {
    return '-';
  }
}

function formatTime(ts?: number) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('zh-CN');
}

function letterOf(idx: number) {
  return String.fromCharCode(65 + idx);
}

function addOption() {
  form.options.push('');
}

function removeOption(idx: number) {
  form.options.splice(idx, 1);
  form.singleAnswer = '';
  form.multipleAnswer = form.multipleAnswer.filter((a) => a !== letterOf(idx));
}

function addFillBlank() {
  form.fillAnswers.push('');
  form.fillToleranceModes.push(FILL_TOLERANCE_MODE.IGNORE_CASE);
}

function removeFillBlank(idx: number) {
  form.fillAnswers.splice(idx, 1);
  form.fillToleranceModes.splice(idx, 1);
}

function addMedia() {
  form.mediaList.push({ type: 'image', url: '', description: '' });
}

function removeMedia(idx: number) {
  form.mediaList.splice(idx, 1);
}

function showKeywordInput() {
  keywordInputVisible.value = true;
  nextTick(() => keywordInputRef.value?.focus());
}

function confirmKeyword() {
  const v = keywordInputValue.value.trim();
  if (v && !form.shortAnswerKeywords.includes(v)) {
    form.shortAnswerKeywords.push(v);
  }
  keywordInputVisible.value = false;
  keywordInputValue.value = '';
}

function removeKeyword(idx: number) {
  form.shortAnswerKeywords.splice(idx, 1);
}

function showTagInput() {
  tagInputVisible.value = true;
  nextTick(() => tagInputRef.value?.focus());
}

function confirmTag() {
  const v = tagInputValue.value.trim();
  if (v && !form.tags.includes(v)) {
    form.tags.push(v);
  }
  tagInputVisible.value = false;
  tagInputValue.value = '';
}

function removeTag(idx: number) {
  form.tags.splice(idx, 1);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await questionApi.pageQuestions({
      grade: searchForm.grade || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status,
      subjectId: searchForm.subjectId,
      difficulty: searchForm.difficulty,
      keyword: searchForm.keyword || undefined,
      knowledgePointId: searchForm.knowledgePointId,
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
  searchForm.subjectId = undefined;
  searchForm.difficulty = undefined;
  searchForm.keyword = '';
  searchForm.knowledgePointId = undefined;
  searchKnowledgeTree.value = [];
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
    resetForm();
    form.questionId = q.questionId;
    form.subjectId = q.subjectId;
    form.content = q.content;
    form.analysis = q.analysis ?? '';
    form.grade = q.grade;
    form.type = q.type || QUESTION_TYPE.SINGLE;
    form.difficulty = q.difficulty ?? 1;
    form.score = q.score ?? 10;
    form.timeLimit = q.timeLimit ?? 0;
    form.statusEnabled = q.status !== 0;

    try {
      form.options = q.options ? JSON.parse(q.options) : [];
    } catch {
      form.options = [];
    }
    if (form.type === QUESTION_TYPE.JUDGE && form.options.length === 0) {
      form.options = ['对', '错'];
    }
    if (showOptionsEditor.value && form.options.length < 2) {
      while (form.options.length < 2) form.options.push('');
    }

    try {
      form.knowledgePointIds = q.knowledgePoints ? JSON.parse(q.knowledgePoints) : [];
    } catch {
      form.knowledgePointIds = [];
    }
    try {
      form.tags = q.tags ? JSON.parse(q.tags) : [];
    } catch {
      form.tags = [];
    }
    try {
      form.mediaList = q.mediaUrls ? JSON.parse(q.mediaUrls) : [];
    } catch {
      form.mediaList = [];
    }
    try {
      form.shortAnswerKeywords = q.shortAnswerKeywords ? JSON.parse(q.shortAnswerKeywords) : [];
    } catch {
      form.shortAnswerKeywords = [];
    }

    const correct = q.correctAnswer ?? '';
    if (form.type === QUESTION_TYPE.SINGLE || form.type === QUESTION_TYPE.IMAGE || form.type === QUESTION_TYPE.AUDIO) {
      form.singleAnswer = correct;
    } else if (form.type === QUESTION_TYPE.MULTIPLE) {
      form.multipleAnswer = correct.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (form.type === QUESTION_TYPE.JUDGE) {
      form.judgeAnswer = correct || '对';
    } else if (form.type === QUESTION_TYPE.FILL) {
      const blanks = correct.split('|||');
      form.fillAnswers = blanks.map((b) => b);
      try {
        const cfg = q.fillConfig ? JSON.parse(q.fillConfig) : null;
        if (cfg?.toleranceModes && Array.isArray(cfg.toleranceModes)) {
          form.fillToleranceModes = cfg.toleranceModes;
        } else {
          form.fillToleranceModes = blanks.map(() => FILL_TOLERANCE_MODE.IGNORE_CASE);
        }
      } catch {
        form.fillToleranceModes = blanks.map(() => FILL_TOLERANCE_MODE.IGNORE_CASE);
      }
      while (form.fillToleranceModes.length < form.fillAnswers.length) {
        form.fillToleranceModes.push(FILL_TOLERANCE_MODE.IGNORE_CASE);
      }
    } else if (form.type === QUESTION_TYPE.SHORT_ANSWER) {
      form.shortAnswer = correct;
    }

    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

function resetForm() {
  form.questionId = undefined;
  form.subjectId = undefined;
  form.knowledgePointIds = [];
  form.content = '';
  form.options = ['', ''];
  form.singleAnswer = '';
  form.multipleAnswer = [];
  form.judgeAnswer = '对';
  form.fillAnswers = [''];
  form.fillToleranceModes = [FILL_TOLERANCE_MODE.IGNORE_CASE];
  form.shortAnswer = '';
  form.shortAnswerKeywords = [];
  form.mediaList = [];
  form.analysis = '';
  form.grade = '3';
  form.type = QUESTION_TYPE.SINGLE;
  form.difficulty = 1;
  form.score = 10;
  form.timeLimit = 0;
  form.tags = [];
  form.statusEnabled = true;
  formKnowledgeTree.value = [];
}

function buildCorrectAnswer(): string {
  switch (form.type) {
    case QUESTION_TYPE.SINGLE:
    case QUESTION_TYPE.IMAGE:
    case QUESTION_TYPE.AUDIO:
      return form.singleAnswer;
    case QUESTION_TYPE.MULTIPLE:
      return [...form.multipleAnswer].sort().join(',');
    case QUESTION_TYPE.JUDGE:
      return form.judgeAnswer;
    case QUESTION_TYPE.FILL:
      return form.fillAnswers.join('|||');
    case QUESTION_TYPE.SHORT_ANSWER:
      return form.shortAnswer;
    default:
      return '';
  }
}

function buildAnswerMode(): string {
  if (form.type === QUESTION_TYPE.MULTIPLE) return 'multiple';
  if (form.type === QUESTION_TYPE.FILL || form.type === QUESTION_TYPE.SHORT_ANSWER) return 'text';
  return 'single';
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    const correctAnswer = buildCorrectAnswer();
    if (!correctAnswer && form.type !== QUESTION_TYPE.SHORT_ANSWER) {
      ElMessage.warning('请填写正确答案');
      return;
    }
    saving.value = true;
    try {
      const fillConfig =
        form.type === QUESTION_TYPE.FILL
          ? JSON.stringify({
              answers: form.fillAnswers.map((a) => a.split('|').map((s) => s.trim()).filter(Boolean)),
              toleranceModes: form.fillToleranceModes,
              multiBlank: form.fillAnswers.length > 1,
            })
          : undefined;
      const payload = {
        content: form.content,
        options: showOptionsEditor.value ? JSON.stringify(form.options.map((o) => o.trim()).filter((o) => o.length)) : '[]',
        correctAnswer,
        analysis: form.analysis,
        grade: form.grade,
        type: form.type,
        difficulty: form.difficulty,
        status: form.statusEnabled ? 1 : 0,
        subjectId: form.subjectId,
        knowledgePoints: JSON.stringify(form.knowledgePointIds),
        tags: JSON.stringify(form.tags),
        mediaUrls: form.mediaList.length ? JSON.stringify(form.mediaList) : undefined,
        score: form.score,
        timeLimit: form.timeLimit,
        answerMode: buildAnswerMode(),
        fillConfig,
        shortAnswerKeywords:
          form.type === QUESTION_TYPE.SHORT_ANSWER && form.shortAnswerKeywords.length
            ? JSON.stringify(form.shortAnswerKeywords)
            : undefined,
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

async function loadSubjects() {
  try {
    subjectOptions.value = await subjectApi.list();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

// ==================== 批量导入 ====================

/** 题型中文→英文映射 */
const TYPE_MAP: Record<string, string> = {
  '单选': 'single',
  '多选': 'multiple',
  '判断': 'judge',
  '填空': 'fill',
  '简答': 'short_answer',
};

interface ImportPreviewRow {
  content: string;
  type: string;
  options: string;
  correctAnswer: string;
  analysis: string;
  difficulty: number;
  subjectId: number | undefined;
  score: number;
  grade: string;
  _valid: boolean;
  _error: string;
}

const importDialogVisible = ref(false);
const importing = ref(false);
const importPreview = ref<ImportPreviewRow[]>([]);
const importUploadRef = ref();

const importValidCount = computed(() => importPreview.value.filter((r) => r._valid).length);

function openImportDialog() {
  importPreview.value = [];
  importDialogVisible.value = true;
}

function resetImportState() {
  importPreview.value = [];
}

/** 下载 Excel 导入模板 */
function downloadTemplate() {
  const headers = ['题干', '题型', '选项A', '选项B', '选项C', '选项D', '正确答案', '解析', '难度', '学科ID', '分值'];
  const exampleRow = ['1+1等于几？', '单选', '1', '2', '3', '4', 'B', '基础加法', '1', '1', '10'];
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  // 设置列宽
  ws['!cols'] = headers.map(() => ({ wch: 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '题目导入');
  XLSX.writeFile(wb, '题目导入模板.xlsx');
}

/** 解析上传的 Excel 文件 */
async function handleImportFile(file: UploadFile) {
  if (!file.raw) return;
  try {
    const data = await file.raw.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string | number | undefined>[] = XLSX.utils.sheet_to_json(ws);

    const preview: ImportPreviewRow[] = rows.map((row) => {
      const content = String(row['题干'] ?? '').trim();
      const typeCn = String(row['题型'] ?? '').trim();
      const type = TYPE_MAP[typeCn] || typeCn.toLowerCase();
      const optA = String(row['选项A'] ?? '').trim();
      const optB = String(row['选项B'] ?? '').trim();
      const optC = String(row['选项C'] ?? '').trim();
      const optD = String(row['选项D'] ?? '').trim();
      const correctAnswer = String(row['正确答案'] ?? '').trim();
      const analysis = String(row['解析'] ?? '').trim();
      const difficulty = Number(row['难度']) || 1;
      const subjectId = row['学科ID'] ? Number(row['学科ID']) : undefined;
      const score = Number(row['分值']) || 1;

      // 构建选项 JSON
      const optionsArr = [optA, optB, optC, optD].filter((o) => o.length > 0);
      const options = JSON.stringify(optionsArr);

      // 校验
      const errors: string[] = [];
      if (!content) errors.push('题干为空');
      if (!type) errors.push('题型为空');
      if (!TYPE_MAP[typeCn] && !Object.values(QUESTION_TYPE).includes(type as QuestionType)) {
        errors.push('题型无效');
      }
      if (['single', 'multiple', 'judge'].includes(type) && optionsArr.length < 2) {
        errors.push('选项不足');
      }
      if (!correctAnswer && type !== 'short_answer') {
        errors.push('答案为空');
      }

      return {
        content,
        type,
        options,
        correctAnswer,
        analysis,
        difficulty,
        subjectId,
        score,
        grade: '3',
        _valid: errors.length === 0,
        _error: errors.join('、'),
      };
    });

    importPreview.value = preview;
  } catch (e) {
    ElMessage.error('Excel 解析失败，请检查文件格式');
  }
}

/** 确认导入 */
async function confirmImport() {
  const validRows = importPreview.value.filter((r) => r._valid);
  if (validRows.length === 0) {
    ElMessage.warning('没有可导入的数据');
    return;
  }
  importing.value = true;
  try {
    const payloads = validRows.map((row) => ({
      content: row.content,
      type: row.type,
      options: row.options,
      correctAnswer: row.correctAnswer,
      analysis: row.analysis || undefined,
      difficulty: row.difficulty,
      subjectId: row.subjectId,
      score: row.score,
      grade: row.grade,
      status: 1,
    }));
    const result = await questionApi.batchImport(payloads);
    const skipped = validRows.length - result.count;
    let msg = `成功导入 ${result.count} 条`;
    if (skipped > 0) msg += `，跳过重复 ${skipped} 条`;
    ElMessage.success(msg);
    importDialogVisible.value = false;
    fetchList();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  loadSubjects();
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
.options-editor,
.fill-blanks,
.media-editor,
.tag-input {
  width: 100%;
}
.option-row,
.fill-row,
.media-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.option-letter,
.fill-label {
  flex-shrink: 0;
  width: 28px;
  font-weight: 600;
  color: #606266;
}
.fill-row .el-input,
.media-row .el-input {
  flex: 1;
}
.option-row .el-input {
  flex: 1;
}
.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.import-dialog-content {
  min-height: 200px;
}
.import-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.import-preview {
  margin-top: 12px;
}
.import-summary {
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}
</style>
