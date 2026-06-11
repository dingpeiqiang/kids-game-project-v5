<template>
  <div class="register-container">
    <div class="register-content">
      <button @click="goBack" class="back-btn">
        ← 返回
      </button>

      <h1 class="register-title">🎮 注册新账号</h1>

      <!-- 错误提示 -->
      <ErrorDisplay v-if="errorMessage" :message="errorMessage" @close="errorMessage = ''" />

      <!-- 成功提示 -->
      <div v-if="successMessage" class="success-message">
        <span class="success-icon">🎉</span>
        <span>{{ successMessage }}</span>
      </div>

      <!-- 全屏Loading遮罩 -->
      <GlobalLoading :loading="isLoading" message="注册中..." />

      <!-- 注册表单 -->
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- 角色选择 -->
        <div class="form-group role-group">
          <label>角色 <span class="required">*</span></label>
          <div class="role-options">
            <label class="role-option" :class="{ selected: form.role === 'kid' }">
              <input
                type="radio"
                name="role"
                v-model="form.role"
                value="kid"
                :disabled="isLoading"
              />
              <span class="role-icon">👶</span>
              <span>儿童</span>
            </label>
            <label class="role-option" :class="{ selected: form.role === 'parent' }">
              <input
                type="radio"
                name="role"
                v-model="form.role"
                value="parent"
                :disabled="isLoading"
              />
              <span class="role-icon">👨‍👩‍👧</span>
              <span>家长</span>
            </label>
          </div>
          <span v-if="errors.role" class="error-text">{{ errors.role }}</span>
        </div>

        <!-- 账号 -->
        <div class="form-group">
          <label for="username">账号 <span class="required">*</span></label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="输入账号（2-20个字符）"
            maxlength="20"
            :disabled="isLoading"
            :class="{ error: errors.username, success: usernameAvailable }"
            @blur="validateUsername"
          />
          <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
          <span v-else-if="usernameAvailable" class="success-text">✓ 账号可用</span>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">密码 <span class="required">*</span></label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请设置密码（至少6位）"
            :disabled="isLoading"
            :class="{ error: errors.password }"
            @blur="validatePassword"
          />
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword">确认密码 <span class="required">*</span></label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :disabled="isLoading"
            :class="{ error: errors.confirmPassword }"
            @blur="validateConfirmPassword"
          />
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>

        <!-- 昵称 -->
        <div class="form-group">
          <label for="nickname">昵称（可选）</label>
          <input
            id="nickname"
            v-model="form.nickname"
            type="text"
            :disabled="isLoading"
          />
        </div>

        <button 
          type="submit" 
          class="register-btn" 
          :disabled="isLoading || !isFormValid"
        >
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/core/store/user.store';
import { authApi } from '@/services/auth-api.service';
import { kidApi } from '@/services/kid-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';

const router = useRouter();
const userStore = useUserStore();

// ===== 状态 =====
const isLoading = ref(false);
const isSubmitting = ref(false); // 额外的防重复提交锁
const errorMessage = ref('');
const successMessage = ref('');

// 注册表单
const form = ref({
  role: '',
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
});

// 账号可用性状态
const usernameAvailable = ref(false);

// 监听角色变化，动态生成昵称
watch(() => form.value.role, (newRole) => {
  if (newRole) {
    form.value.nickname = generateNicknameByRole(newRole);
  }
});

// 监听账号变化，重置可用性状态
watch(() => form.value.username, () => {
  usernameAvailable.value = false;
});

// 表单验证错误
const errors = ref({
  role: '',
  username: '',
  password: '',
  confirmPassword: '',
});

// ===== 计算属性 =====

const isFormValid = computed(() => {
  const { role, username, password, confirmPassword } = form.value;
  return (
    role !== '' &&
    username.length >= 2 &&
    username.length <= 20 &&
    password.length >= 6 &&
    password === confirmPassword &&
    confirmPassword.length >= 6 &&
    !errors.value.role &&
    !errors.value.username &&
    !errors.value.password &&
    !errors.value.confirmPassword
  );
});

// ===== 方法 =====

// 根据角色生成随机昵称
function generateNicknameByRole(role: string): string {
  // 形容词前缀
  const adjectives = [
    '快乐', '阳光', '幸福', '温暖', '爱心', '智慧', '梦想', '星光', '彩虹', '甜蜜',
    '勇敢', '聪明', '可爱', '活泼', '善良', '纯真', '开朗', '自信', '勤奋', '坚强',
    '灵动', '甜美', '活力', '阳光', '梦幻', '浪漫', '温馨', '快乐', '幸福', '美好'
  ];
  
  // 根据角色选择后缀
  const kidSuffixes = [
    '小探险家', '小勇士', '小天才', '小精灵', '小太阳', '小星星', '小天使', '小可爱',
    '开心果', '小调皮', '小机灵', '小宝贝', '小萌主', '小达人', '小能手', '小飞侠',
    '小超人', '小英雄', '小科学家', '小艺术家'
  ];
  
  const parentSuffixes = [
    '家长', '守护者', '陪伴者', '领航员', '启蒙者', '导师', '引路人', '知心人',
    '暖心家长', '智慧家长', '爱心家长', '快乐家长', '阳光家长', '优秀家长', '模范家长'
  ];
  
  const prefix = adjectives[Math.floor(Math.random() * adjectives.length)];
  const suffixes = role === 'kid' ? kidSuffixes : parentSuffixes;
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const num = Math.floor(Math.random() * 1000);
  
  return `${prefix}${suffix}${num}`;
}

// 返回
function goBack() {
  router.back();
}

// 验证角色
function validateRole() {
  if (!form.value.role) {
    errors.value.role = '请选择角色';
  } else {
    errors.value.role = '';
  }
}

// 验证账号（包含唯一性检查）
async function validateUsername() {
  const { username } = form.value;
  // 重置可用性状态
  usernameAvailable.value = false;
  
  if (!username) {
    errors.value.username = '请输入账号';
  } else if (username.length < 2) {
    errors.value.username = '账号至少2个字符';
  } else if (username.length > 20) {
    errors.value.username = '账号最多20个字符';
  } else {
    // 检查用户名是否已存在
    try {
      const result = await authApi.checkUsername(username);
      if (result.exists) {
        errors.value.username = '该账号已被注册';
      } else {
        errors.value.username = '';
        usernameAvailable.value = true;
      }
    } catch (err) {
      console.error('检查用户名失败:', err);
      // 网络错误时不阻止表单提交，由后端再次验证
      errors.value.username = '';
    }
  }
}

// 验证密码
function validatePassword() {
  const { password } = form.value;
  if (!password) {
    errors.value.password = '请设置密码';
  } else if (password.length < 6) {
    errors.value.password = '密码至少6位';
  } else {
    errors.value.password = '';
    if (form.value.confirmPassword) {
      validateConfirmPassword();
    }
  }
}

// 验证确认密码
function validateConfirmPassword() {
  const { password, confirmPassword } = form.value;
  if (!confirmPassword) {
    errors.value.confirmPassword = '请确认密码';
  } else if (password !== confirmPassword) {
    errors.value.confirmPassword = '两次密码不一致';
  } else {
    errors.value.confirmPassword = '';
  }
}

// 注册 - 全局计数器追踪调用来源
let _registerCallId = 0;

async function handleRegister() {
  const callId = ++_registerCallId;
  const callStack = new Error().stack?.split('\n').slice(2, 6).join(' | ') || 'no-stack';
  console.log(`[Register:${callId}] handleRegister 被调用 at ${new Date().toISOString()}`);
  console.log(`[Register:${callId}] 调用堆栈: ${callStack}`);
  console.log(`[Register:${callId}] isSubmitting=${isSubmitting.value}, isLoading=${isLoading.value}`);
  
  // 双重锁防止重复提交
  if (isSubmitting.value || isLoading.value) {
    console.log(`[Register:${callId}] ⛔ 防重复锁拦截 - 已有请求在进行中`);
    return;
  }

  // 立即设置提交锁，阻止后续点击
  isSubmitting.value = true;
  isLoading.value = true;
  console.log(`[Register:${callId}] ✅ 通过防重复锁，isSubmitting=${isSubmitting.value}`);

  errorMessage.value = '';
  successMessage.value = '';

  try {
    // 验证所有字段（validateUsername是异步的）
    validateRole();
    console.log(`[Register:${callId}] 开始异步验证用户名...`);
    await validateUsername();
    console.log(`[Register:${callId}] 验证用户名完成`);
    validatePassword();
    validateConfirmPassword();

    if (!isFormValid.value) {
      console.log(`[Register:${callId}] ❌ 表单验证失败`);
      errorMessage.value = '请填写完整信息';
      // 验证失败时也要重置状态，允许重新提交
      isSubmitting.value = false;
      isLoading.value = false;
      return;
    }

    console.log(`[Register:${callId}] ✅ 表单验证通过，role=${form.value.role}`);

    if (form.value.role === 'parent') {
      // 家长注册
      console.log(`[Register:${callId}] 🚀 开始调用 authApi.registerParent...`);
      const result = await authApi.registerParent({
        username: form.value.username,
        phone: '',
        password: form.value.password,
        nickname: form.value.nickname || '家长',
        realName: '',
      });
      console.log(`[Register:${callId}] ✅ authApi.registerParent 返回成功, userId=${result.userId}`);

      userStore.parentUser = {
        parentId: result.userId,
        username: result.username || form.value.username,
        nickname: form.value.nickname || result.nickname || '家长',
        phone: '',
        fatiguePoints: 10,
        dailyAnswerPoints: 0,
      };
      localStorage.setItem('parentInfo', JSON.stringify(userStore.parentUser));
    } else {
      // 儿童注册
      console.log(`[Register:${callId}] 🚀 开始调用 kidApi.register...`);
      await kidApi.register({
        username: form.value.username,
        password: form.value.password,
        nickname: form.value.nickname,
      });
      console.log(`[Register:${callId}] ✅ kidApi.register 返回成功`);
    }

    successMessage.value = '注册成功！正在跳转到登录页...';
    console.log(`[Register:${callId}] 🎉 注册流程全部完成`);
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: unknown) {
    console.log(`[Register:${callId}] ❌ 注册异常:`, err);
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
    isSubmitting.value = false;
    console.log(`[Register:${callId}] 🔓 锁已释放, isSubmitting=${isSubmitting.value}, isLoading=${isLoading.value}`);
  }
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
}

.register-content {
  box-sizing: border-box;
  background: white;
  border-radius: clamp(16px, 3vw, 24px);
  padding: clamp(1rem, 3vh, 2rem) clamp(1rem, 4vw, 2.5rem);
  padding-top: clamp(2.75rem, 6vh, 3.25rem);
  max-width: min(520px, 100%);
  width: 100%;
  max-height: calc(100dvh - 1.5rem);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

.register-content::-webkit-scrollbar {
  width: 6px;
}

.register-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.35);
  border-radius: 3px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  position: absolute;
  top: clamp(1rem, 2vh, 1.5rem);
  left: clamp(1rem, 3vw, 1.5rem);
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
  }
}

.register-title {
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  color: #333;
  margin: 0 0 1.5rem;
  font-weight: 700;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.success-icon {
  font-size: 1.25rem;
}

.register-form {
  width: 100%;
  text-align: left;
}

.form-group {
  margin-bottom: 1rem;

  &.role-group {
    margin-bottom: 1.25rem;
  }
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &.error {
    border-color: #fc8181;
  }

  &.success {
    border-color: #48bb78;
  }

  &:disabled {
    background: #f7fafc;
    cursor: not-allowed;
  }
}

.form-group input::placeholder {
  color: #a0aec0;
}

.error-text {
  display: block;
  color: #fc8181;
  font-size: 0.8rem;
  margin-top: 0.375rem;
}

.success-text {
  display: block;
  color: #48bb78;
  font-size: 0.8rem;
  margin-top: 0.375rem;
  font-weight: 500;
}

.role-options {
  display: flex;
  gap: 1rem;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: white;

  input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
  }

  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }

  &.selected {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);

    .role-icon {
      transform: scale(1.1);
    }

    span:last-child {
      color: #667eea;
      font-weight: 600;
    }
  }
}

.role-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  transition: transform 0.2s ease;
}

.role-option span:last-child {
  font-size: 0.95rem;
  color: #555;
  transition: all 0.2s ease;
}

.register-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.required {
  color: #fc8181;
  margin-left: 0.25rem;
}
</style>
