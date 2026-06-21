<template>
  <div class="knowledge-point-management">
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="学科">
          <el-select
            v-model="currentSubjectId"
            placeholder="请选择学科"
            filterable
            style="width: 220px"
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
        <el-form-item>
          <el-button
            type="primary"
            :disabled="!currentSubjectId"
            @click="openCreateRoot"
          >
            新增根知识点
          </el-button>
          <el-button :disabled="!currentSubjectId" @click="fetchTree">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="tree-card">
      <template #header>
        <div class="card-header">
          <span>知识点树</span>
          <span v-if="currentSubjectName" class="subject-tag">
            当前学科：{{ currentSubjectName }}
          </span>
        </div>
      </template>

      <el-empty
        v-if="!currentSubjectId"
        description="请先选择学科"
        :image-size="120"
      />
      <el-empty
        v-else-if="!loading && treeData.length === 0"
        description="暂无知识点，点击「新增根知识点」开始创建"
        :image-size="120"
      />
      <el-tree
        v-else
        ref="treeRef"
        v-loading="loading"
        :data="treeData"
        :props="treeProps"
        node-key="knowledgePointId"
        :default-expanded-keys="expandedKeys"
        :expand-on-click-node="false"
        highlight-current
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="node-label">
              <span class="node-name">{{ data.name }}</span>
              <el-tag v-if="data.code" size="small" type="info" class="node-code">
                {{ data.code }}
              </el-tag>
              <el-tag v-if="data.chapter" size="small" class="node-chapter">
                {{ data.chapter }}
              </el-tag>
              <el-tag
                v-if="data.status === 0"
                size="small"
                type="info"
                class="node-status"
              >
                禁用
              </el-tag>
            </span>
            <span class="node-actions" @click.stop>
              <el-button size="small" link @click="openCreateChild(data)">新增子节点</el-button>
              <el-button size="small" link @click="openEdit(data)">编辑</el-button>
              <el-popconfirm
                :title="`确定删除知识点「${data.name}」？`"
                @confirm="handleDelete(data)"
              >
                <template #reference>
                  <el-button size="small" link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item v-if="form.parentName" label="父节点">
          <el-input :model-value="form.parentName" disabled />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="知识点编码（可选）" maxlength="64" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="知识点名称" maxlength="128" />
        </el-form-item>
        <el-form-item label="章节">
          <el-input v-model="form.chapter" placeholder="如 第1章 第2节" maxlength="128" />
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
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { subjectApi } from '@/services/subject-api.service';
import { knowledgePointApi } from '@/services/knowledge-point-api.service';
import type { Subject, KnowledgePoint } from '@/services/api.types';
import { handleApiError } from '@/utils/error-handler.util';

const subjectOptions = ref<Subject[]>([]);
const currentSubjectId = ref<number | undefined>(undefined);
const treeData = ref<KnowledgePoint[]>([]);
const expandedKeys = ref<number[]>([]);
const loading = ref(false);
const treeRef = ref();

const treeProps = {
  label: 'name',
  children: 'children',
};

const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  knowledgePointId: undefined as number | undefined,
  parentId: undefined as number | undefined,
  parentName: '' as string,
  code: '',
  name: '',
  chapter: '',
  description: '',
  sortOrder: 0,
  statusEnabled: true,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入知识点名称', trigger: 'blur' }],
};

const currentSubjectName = computed(() =>
  subjectOptions.value.find((s) => s.subjectId === currentSubjectId.value)?.subjectName ?? '',
);

const dialogTitle = computed(() => {
  if (isEdit.value) return '编辑知识点';
  return form.parentId ? '新增子知识点' : '新增根知识点';
});

function collectAllIds(nodes: KnowledgePoint[]): number[] {
  const ids: number[] = [];
  const walk = (list: KnowledgePoint[]) => {
    list.forEach((n) => {
      ids.push(n.knowledgePointId);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return ids;
}

async function loadSubjects() {
  try {
    subjectOptions.value = await subjectApi.list();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

async function fetchTree() {
  if (!currentSubjectId.value) {
    treeData.value = [];
    expandedKeys.value = [];
    return;
  }
  loading.value = true;
  try {
    treeData.value = await knowledgePointApi.tree(currentSubjectId.value);
    expandedKeys.value = collectAllIds(treeData.value);
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  } finally {
    loading.value = false;
  }
}

function onSubjectChange() {
  fetchTree();
}

function resetForm() {
  form.knowledgePointId = undefined;
  form.parentId = undefined;
  form.parentName = '';
  form.code = '';
  form.name = '';
  form.chapter = '';
  form.description = '';
  form.sortOrder = 0;
  form.statusEnabled = true;
}

function openCreateRoot() {
  if (!currentSubjectId.value) {
    ElMessage.warning('请先选择学科');
    return;
  }
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
}

function openCreateChild(parent: KnowledgePoint) {
  isEdit.value = false;
  resetForm();
  form.parentId = parent.knowledgePointId;
  form.parentName = parent.name;
  dialogVisible.value = true;
}

function openEdit(node: KnowledgePoint) {
  isEdit.value = true;
  resetForm();
  form.knowledgePointId = node.knowledgePointId;
  form.parentId = node.parentId;
  form.code = node.code ?? '';
  form.name = node.name;
  form.chapter = node.chapter ?? '';
  form.description = node.description ?? '';
  form.sortOrder = node.sortOrder ?? 0;
  form.statusEnabled = node.status !== 0;
  const parent = findNodeById(treeData.value, node.parentId);
  form.parentName = parent?.name ?? '';
  dialogVisible.value = true;
}

function findNodeById(nodes: KnowledgePoint[], id?: number): KnowledgePoint | undefined {
  if (!id) return undefined;
  for (const n of nodes) {
    if (n.knowledgePointId === id) return n;
    if (n.children?.length) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

async function submitForm() {
  if (!formRef.value) return;
  if (!currentSubjectId.value) {
    ElMessage.warning('请先选择学科');
    return;
  }
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        subjectId: currentSubjectId.value!,
        parentId: form.parentId,
        code: form.code.trim() || undefined,
        name: form.name.trim(),
        chapter: form.chapter.trim() || undefined,
        description: form.description.trim() || undefined,
        sortOrder: form.sortOrder,
        status: form.statusEnabled ? 1 : 0,
      };
      if (isEdit.value && form.knowledgePointId) {
        await knowledgePointApi.update(form.knowledgePointId, payload);
        ElMessage.success('更新成功');
      } else {
        await knowledgePointApi.create(payload);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchTree();
    } catch (e) {
      ElMessage.error(handleApiError(e).message);
    } finally {
      saving.value = false;
    }
  });
}

async function handleDelete(node: KnowledgePoint) {
  try {
    await knowledgePointApi.delete(node.knowledgePointId);
    ElMessage.success('已删除');
    fetchTree();
  } catch (e) {
    ElMessage.error(handleApiError(e).message);
  }
}

onMounted(() => {
  loadSubjects();
});
</script>

<style scoped>
.knowledge-point-management {
  padding: 0;
}
.filter-card,
.tree-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.subject-tag {
  font-size: 13px;
  color: #606266;
}
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}
.node-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.node-name {
  font-weight: 500;
}
.node-code,
.node-chapter,
.node-status {
  flex-shrink: 0;
}
.node-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
