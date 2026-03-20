<template>
  <KidUnifiedModalV2
    v-model:show="show"
    :title="isEditing ? '编辑游戏' : '新建游戏'"
    :closable="true"
    :show-footer="false"
    class="game-form-modal"
    @update:show="$emit('update:show', $event)"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>游戏名称 *</label>
        <input v-model="formData.gameName" required class="form-input" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>分类 *</label>
          <select v-model="formData.category" required class="form-input">
            <option value="math">数学</option>
            <option value="chinese">语文</option>
            <option value="english">英语</option>
            <option value="science">科学</option>
          </select>
        </div>

        <div class="form-group">
          <label>适龄阶段 *</label>
          <input v-model="formData.grade" placeholder="如：幼儿园 - 小学三年级" required class="form-input" />
        </div>
      </div>

      <div class="form-group">
        <label>游戏编码</label>
        <input v-model="formData.gameCode" placeholder="留空自动生成" class="form-input" />
      </div>

      <div class="form-group">
        <label>图标 URL</label>
        <input v-model="formData.iconUrl" class="form-input" />
      </div>

      <div class="form-group">
        <label>封面 URL</label>
        <input v-model="formData.coverUrl" class="form-input" />
      </div>

      <div class="form-group">
        <label>资源 CDN 地址</label>
        <input v-model="formData.resourceUrl" class="form-input" />
      </div>

      <div class="form-group">
        <label>前端模块路径</label>
        <input v-model="formData.modulePath" placeholder="如：/modules/game/math-arithmetic" class="form-input" />
      </div>

      <div class="form-group">
        <label>游戏描述</label>
        <textarea v-model="formData.description" rows="3" class="form-input"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>排序</label>
          <input v-model.number="formData.sortOrder" type="number" class="form-input" />
        </div>

        <div class="form-group">
          <label>每分钟消耗疲劳点</label>
          <input v-model.number="formData.consumePointsPerMinute" type="number" class="form-input" />
        </div>
      </div>

      <div class="form-group">
        <label>状态</label>
        <select v-model="formData.status" class="form-input">
          <option :value="1">启用</option>
          <option :value="0">禁用</option>
        </select>
      </div>
    </form>

    <template #footer>
      <button type="button" @click="handleCancel" class="btn-cancel">取消</button>
      <button type="submit" @click="$emit('submit', formData)" class="btn-confirm">
        {{ isEditing ? '保存修改' : '创建游戏' }}
      </button>
    </template>
  </KidUnifiedModalV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import KidUnifiedModalV2 from './KidUnifiedModalV2.vue';

interface GameFormData {
  gameId?: number;
  gameName: string;
  category: string;
  grade: string;
  gameCode: string;
  iconUrl: string;
  coverUrl: string;
  resourceUrl: string;
  modulePath: string;
  description: string;
  sortOrder: number;
  consumePointsPerMinute: number;
  status: number;
}

interface Props {
  show?: boolean;
  isEditing?: boolean;
  initialData?: Partial<GameFormData>;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  isEditing: false,
  initialData: () => ({})
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submit: [data: GameFormData];
}>();

const show = ref(props.show);
const formData = ref<GameFormData>({
  gameId: undefined,
  gameName: '',
  category: 'math',
  grade: '',
  gameCode: '',
  iconUrl: '',
  coverUrl: '',
  resourceUrl: '',
  modulePath: '',
  description: '',
  sortOrder: 0,
  consumePointsPerMinute: 1,
  status: 1
});

watch(() => props.show, (val) => {
  show.value = val;
});

watch(() => props.initialData, (val) => {
  if (val && Object.keys(val).length > 0) {
    formData.value = { ...formData.value, ...val };
  }
}, { deep: true, immediate: true });

watch(show, (val) => {
  emit('update:show', val);
  if (!val) {
    // 重置表单
    formData.value = {
      gameId: undefined,
      gameName: '',
      category: 'math',
      grade: '',
      gameCode: '',
      iconUrl: '',
      coverUrl: '',
      resourceUrl: '',
      modulePath: '',
      description: '',
      sortOrder: 0,
      consumePointsPerMinute: 1,
      status: 1
    };
  }
});

function handleCancel() {
  show.value = false;
}

function handleSubmit() {
  emit('submit', formData.value);
}
</script>

<style scoped lang="scss">
.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  textarea.form-input {
    resize: vertical;
    min-height: 80px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #333;

  &:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
