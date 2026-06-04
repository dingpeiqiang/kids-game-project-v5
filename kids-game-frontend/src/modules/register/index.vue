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

      <!-- 角色选择 -->
      <div class="role-selector">
        <button
          class="role-btn"
          :class="{ active: currentRole === 'kid' }"
          @click="currentRole = 'kid'"
        >
          👶 儿童
        </button>
        <button
          class="role-btn"
          :class="{ active: currentRole === 'parent' }"
          @click="currentRole = 'parent'"
        >
          👨‍👩‍👧 家长
        </button>
      </div>

      <!-- 家长注册表单 -->
      <form v-if="currentRole === 'parent'" @submit.prevent="handleParentRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="parentForm.username"
            type="text"
            placeholder="输入用户名（2-20个字符）"
            maxlength="20"
            :disabled="isLoading"
            :class="{ error: errors.parentUsername }"
            @blur="validateParentUsername"
          />
          <span v-if="errors.parentUsername" class="error-text">{{ errors.parentUsername }}</span>
        </div>

        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="parentForm.phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
            :disabled="isLoading"
            :class="{ error: errors.parentPhone }"
            @blur="validateParentPhone"
          />
          <span v-if="errors.parentPhone" class="error-text">{{ errors.parentPhone }}</span>
        </div>

        <div class="form-group">
          <label for="realName">真实姓名</label>
          <input
            id="realName"
            v-model="parentForm.realName"
            type="text"
            placeholder="请输入真实姓名（可选）"
            maxlength="20"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="parentPassword">密码</label>
          <input
            id="parentPassword"
            v-model="parentForm.password"
            type="password"
            placeholder="请设置密码（至少6位）"
            :disabled="isLoading"
            :class="{ error: errors.parentPassword }"
            @blur="validateParentPassword"
          />
          <span v-if="errors.parentPassword" class="error-text">{{ errors.parentPassword }}</span>
        </div>

        <div class="form-group">
          <label for="parentConfirmPassword">确认密码</label>
          <input
            id="parentConfirmPassword"
            v-model="parentForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :disabled="isLoading"
            :class="{ error: errors.parentConfirmPassword }"
            @blur="validateParentConfirmPassword"
          />
          <span v-if="errors.parentConfirmPassword" class="error-text">{{ errors.parentConfirmPassword }}</span>
        </div>

        <div class="form-group">
          <label for="parentNickname">昵称</label>
          <input
            id="parentNickname"
            v-model="parentForm.nickname"
            type="text"
            placeholder="请输入昵称"
            maxlength="20"
            :disabled="isLoading"
            :class="{ error: errors.parentNickname }"
            @blur="validateParentNickname"
          />
          <span v-if="errors.parentNickname" class="error-text">{{ errors.parentNickname }}</span>
        </div>

        <button type="submit" class="register-btn" :disabled="isLoading || !isParentFormValid">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </form>

      <!-- 儿童注册表单 -->
      <form v-else @submit.prevent="handleKidRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="kidForm.username"
            type="text"
            placeholder="输入用户名（2-20个字符）"
            maxlength="20"
            :disabled="isLoading"
            :class="{ error: errors.kidUsername }"
            @blur="validateKidUsername"
          />
          <span v-if="errors.kidUsername" class="error-text">{{ errors.kidUsername }}</span>
        </div>

        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            id="nickname"
            v-model="kidForm.nickname"
            type="text"
            placeholder="输入昵称"
            maxlength="20"
            :disabled="isLoading"
            :class="{ error: errors.kidNickname }"
            @blur="validateKidNickname"
          />
          <span v-if="errors.kidNickname" class="error-text">{{ errors.kidNickname }}</span>
        </div>

        <div class="form-group">
          <label for="grade">年级</label>
          <select
            id="grade"
            v-model="kidForm.grade"
            :disabled="isLoading"
            :class="{ error: errors.kidGrade }"
            @change="validateKidGrade"
          >
            <option value="">请选择年级</option>
            <option value="1">一年级</option>
            <option value="2">二年级</option>
            <option value="3">三年级</option>
            <option value="4">四年级</option>
            <option value="5">五年级</option>
            <option value="6">六年级</option>
          </select>
          <span v-if="errors.kidGrade" class="error-text">{{ errors.kidGrade }}</span>
        </div>

        <div class="form-group">
          <label for="kidPassword">密码</label>
          <input
            id="kidPassword"
            v-model="kidForm.password"
            type="password"
            placeholder="设置密码（至少6位）"
            :disabled="isLoading"
            :class="{ error: errors.kidPassword }"
            @blur="validateKidPassword"
          />
          <span v-if="errors.kidPassword" class="error-text">{{ errors.kidPassword }}</span>
        </div>

        <div class="form-group">
          <label for="kidConfirmPassword">确认密码</label>
          <input
            id="kidConfirmPassword"
            v-model="kidForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :disabled="isLoading"
            :class="{ error: errors.kidConfirmPassword }"
            @blur="validateKidConfirmPassword"
          />
          <span v-if="errors.kidConfirmPassword" class="error-text">{{ errors.kidConfirmPassword }}</span>
        </div>

        <div class="form-group">
          <label>选择头像</label>

          <div class="avatar-grid">
            <div
              v-for="avatar in avatars"
              :key="avatar"
              class="avatar-option"
              :class="{ selected: kidForm.avatar === avatar, error: errors.kidAvatar }"
              @click="kidForm.avatar = avatar"
            >
              {{ avatar }}
            </div>
          </div>
          <span v-if="errors.kidAvatar" class="error-text">{{ errors.kidAvatar }}</span>
        </div>

        <div class="form-group">
          <label for="parentPhone">主要监护人手机号</label>
          <input
            id="parentPhone"
            v-model="kidForm.parentPhone"
            type="tel"
            placeholder="请输入家长手机号"
            maxlength="11"
            :disabled="isLoading"
            :class="{ error: errors.parentPhone }"
            @blur="validateKidParentPhone"
          />
          <span v-if="errors.parentPhone" class="error-text">{{ errors.parentPhone }}</span>
          <p class="form-tip">💡 请输入已注册的家长手机号，系统将自动绑定</p>
        </div>

        <button type="submit" class="register-btn" :disabled="isLoading || !isKidFormValid">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { parentApi } from '@/services/parent-api.service';
import { kidApi } from '@/services/kid-api.service';
import { handleApiError } from '@/utils/error-handler.util';
import GlobalLoading from '@/components/GlobalLoading.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';

const router = useRouter();
const route = useRoute();

// ===== 状态 =====

const currentRole = ref<'kid' | 'parent'>(route.query.type === 'parent' ? 'parent' : 'kid');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const parentForm = ref({
  username: '',
  phone: '',
  realName: '',
  password: '',
  confirmPassword: '',
  nickname: '',
});

const kidForm = ref({
  username: '',
  password: '',
  nickname: '',
  grade: '',
  avatar: '🐱',
  parentPhone: '',
});
const avatars = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷'];

// 表单验证错误
const errors = ref({
  parentUsername: '',
  parentPhone: '',
  parentPassword: '',
  parentConfirmPassword: '',
  parentNickname: '',
  kidUsername: '',
  kidPassword: '',
  kidConfirmPassword: '',
  kidNickname: '',
  kidGrade: '',
  kidAvatar: '',
});

// ===== 计算属性 =====

const isParentFormValid = computed(() => {
  const { username, phone, password, confirmPassword, nickname } = parentForm.value;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return (
    username.length >= 2 &&
    username.length <= 20 &&
    phoneRegex.test(phone) &&
    password.length >= 6 &&
    password === confirmPassword &&
    confirmPassword.length >= 6 &&
    nickname.length > 0 &&
    nickname.length <= 20 &&
    !errors.value.parentUsername &&
    !errors.value.parentPhone &&
    !errors.value.parentPassword &&
    !errors.value.parentConfirmPassword &&
    !errors.value.parentNickname
  );
});

const isKidFormValid = computed(() => {
  const { username, password, confirmPassword, nickname, grade, avatar, parentPhone } = kidForm.value;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return (
    username.length >= 2 &&
    username.length <= 20 &&
    password.length >= 6 &&
    password === confirmPassword &&
    confirmPassword.length >= 6 &&
    nickname.length > 0 &&
    nickname.length <= 20 &&
    grade !== '' &&
    avatar !== '' &&
    phoneRegex.test(parentPhone) &&
    !errors.value.kidUsername &&
    !errors.value.kidPassword &&
    !errors.value.kidConfirmPassword &&
    !errors.value.kidNickname &&
    !errors.value.kidGrade &&
    !errors.value.kidAvatar &&
    !errors.value.parentPhone
  );
});



// ===== 验证方法 =====

function validateParentUsername() {
  const { username } = parentForm.value;
  if (!username) {
    errors.value.parentUsername = '请输入用户名';
  } else if (username.length < 2) {
    errors.value.parentUsername = '用户名至少2个字符';
  } else if (username.length > 20) {
    errors.value.parentUsername = '用户名最多20个字符';
  } else {
    errors.value.parentUsername = '';
  }
}

function validateParentPhone() {
  const { phone } = parentForm.value;
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phone) {
    errors.value.parentPhone = '请输入手机号';
  } else if (!phoneRegex.test(phone)) {
    errors.value.parentPhone = '手机号格式不正确';
  } else {
    errors.value.parentPhone = '';
  }
}

function validateParentPassword() {
  const { password } = parentForm.value;
  if (!password) {
    errors.value.parentPassword = '请设置密码';
  } else if (password.length < 6) {
    errors.value.parentPassword = '密码至少6位';
  } else {
    errors.value.parentPassword = '';
    if (parentForm.value.confirmPassword) {
      validateParentConfirmPassword();
    }
  }
}

function validateParentConfirmPassword() {
  const { password, confirmPassword } = parentForm.value;
  if (!confirmPassword) {
    errors.value.parentConfirmPassword = '请确认密码';
  } else if (password !== confirmPassword) {
    errors.value.parentConfirmPassword = '两次密码不一致';
  } else {
    errors.value.parentConfirmPassword = '';
  }
}

function validateParentNickname() {
  const { nickname } = parentForm.value;
  if (!nickname) {
    errors.value.parentNickname = '请输入昵称';
  } else if (nickname.length < 1) {
    errors.value.parentNickname = '昵称不能为空';
  } else if (nickname.length > 20) {
    errors.value.parentNickname = '昵称最多20个字符';
  } else {
    errors.value.parentNickname = '';
  }
}

function validateKidUsername() {
  const { username } = kidForm.value;
  if (!username) {
    errors.value.kidUsername = '请输入用户名';
  } else if (username.length < 2) {
    errors.value.kidUsername = '用户名至少2个字符';
  } else if (username.length > 20) {
    errors.value.kidUsername = '用户名最多20个字符';
  } else {
    errors.value.kidUsername = '';
  }
}

function validateKidPassword() {
  const { password } = kidForm.value;
  if (!password) {
    errors.value.kidPassword = '请设置密码';
  } else if (password.length < 6) {
    errors.value.kidPassword = '密码至少6位';
  } else {
    errors.value.kidPassword = '';
    if (kidForm.value.confirmPassword) {
      validateKidConfirmPassword();
    }
  }
}

function validateKidConfirmPassword() {
  const { password, confirmPassword } = kidForm.value;
  if (!confirmPassword) {
    errors.value.kidConfirmPassword = '请确认密码';
  } else if (password !== confirmPassword) {
    errors.value.kidConfirmPassword = '两次密码不一致';
  } else {
    errors.value.kidConfirmPassword = '';
  }
}

function validateKidGrade() {
  const { grade } = kidForm.value;
  if (!grade) {
    errors.value.kidGrade = '请选择年级';
  } else {
    errors.value.kidGrade = '';
  }
}

function validateKidNickname() {
  const { nickname } = kidForm.value;
  if (!nickname) {
    errors.value.kidNickname = '请输入昵称';
  } else if (nickname.length < 1) {
    errors.value.kidNickname = '昵称不能为空';
  } else if (nickname.length > 20) {
    errors.value.kidNickname = '昵称最多20个字符';
  } else {
    errors.value.kidNickname = '';
  }
}

function validateKidAvatar() {
  const { avatar } = kidForm.value;
  if (!avatar) {
    errors.value.kidAvatar = '请选择头像';
  } else {
    errors.value.kidAvatar = '';
  }
}

function validateKidParentPhone() {
  const { parentPhone } = kidForm.value;
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!parentPhone) {
    errors.value.parentPhone = '请输入家长手机号';
  } else if (!phoneRegex.test(parentPhone)) {
    errors.value.parentPhone = '手机号格式不正确';
  } else {
    errors.value.parentPhone = '';
  }
}

// ===== 方法 =====

function goBack() {
  router.back();
}



async function handleParentRegister() {
  errorMessage.value = '';
  successMessage.value = '';

  // 验证所有字段
  validateParentUsername();
  validateParentPhone();
  validateParentPassword();
  validateParentConfirmPassword();
  validateParentNickname();

  if (!isParentFormValid.value) {
    errorMessage.value = '请填写完整信息';
    return;
  }

  try {
    isLoading.value = true;
    await parentApi.register(parentForm.value);
    successMessage.value = '注册成功！正在跳转到登录页...';
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: any) {
    console.error('家长注册失败:', err);
    // 提取更详细的错误信息
    if (err.response) {
      // 有响应的错误
      if (err.response.data && err.response.data.msg) {
        errorMessage.value = err.response.data.msg;
      } else if (err.response.data) {
        errorMessage.value = JSON.stringify(err.response.data);
      } else {
        errorMessage.value = `注册失败 (${err.response.status}): ${err.response.statusText}`;
      }
    } else if (err.request) {
      // 请求发送了但没有响应
      errorMessage.value = '网络连接失败,请检查网络后重试';
    } else {
      // 其他错误
      errorMessage.value = err.message || '注册失败,请稍后重试';
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleKidRegister() {
  errorMessage.value = '';
  successMessage.value = '';

  // 验证所有字段
  validateKidUsername();
  validateKidNickname();
  validateKidGrade();
  validateKidPassword();
  validateKidConfirmPassword();
  validateKidAvatar();
  validateKidParentPhone();

  if (!isKidFormValid.value) {
    errorMessage.value = '请填写完整信息';
    return;
  }

  try {
    isLoading.value = true;
    await kidApi.register(kidForm.value);
    successMessage.value = '注册成功！正在跳转到登录页...';
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: any) {
    const error = handleApiError(err);
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

// ===== 生命周期 =====

onMounted(() => {
  // 不需要加载家长列表了
});
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.register-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-25%, -25%) rotate(180deg);
  }
}

.register-content {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 520px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
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
  top: 1.5rem;
  left: 1.5rem;
  background: transparent;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #333;
}

.register-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

/* 角色选择 */
.role-selector {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.role-btn {
  flex: 1;
  padding: 1rem 2rem;
  background: white;
  color: #666;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.role-btn:hover {
  border-color: #667eea;
  background: #f8fafc;
}

.role-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 成功提示 */
.success-message {
  padding: 1.2rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 16px;
  margin-bottom: 1.5rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border: 3px solid rgba(34, 197, 94, 0.2);
  font-size: 1.1rem;
  font-weight: 600;
  color: #059669;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
}

.success-icon {
  font-size: 1.5rem;
  animation: bounce 0.6s ease-in-out;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-10px);
  }
  60% {
    transform: scale(1.05) translateY(5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.register-form {
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
  background: #f9fafb;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input::placeholder {
  color: #9ca3af;
}

.form-group input.error,
.form-group select.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-group input.error:focus,
.form-group select.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-text {
  display: block;
  margin-top: 0.5rem;
  color: #ef4444;
  font-size: 0.85rem;
}

/* 头像选择网格 */
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

.avatar-option {
  font-size: 2rem;
  text-align: center;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.avatar-option:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.avatar-option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.avatar-option.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.avatar-option.error.selected {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 表单提示 */
.form-tip {
  color: #666;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  padding: 0;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 全屏Loading遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-overlay-content {
  text-align: center;
  color: white;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

.loading-overlay-content p {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
}


.register-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .register-content {
    padding: 2rem;
    border-radius: 20px;
  }

  .register-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .register-content {
    padding: 1.5rem;
  }

  .register-title {
    font-size: 1.5rem;
  }

  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
