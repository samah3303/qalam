<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Logo Card -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4 transform hover:scale-105 transition-transform">
          <span class="text-5xl">✒️</span>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2">Qalam</h1>
        <p class="text-blue-200 text-lg font-arabic">قلم • Modern Accounting</p>
        <p class="text-blue-300 text-sm mt-2">Simple, Powerful, Offline-First</p>
      </div>

      <!-- Login/Signup Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>
          <p class="text-gray-600 text-sm mt-1">{{ isLogin ? 'Sign in to continue to your account' : 'Create a new account to get started' }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ errorMessage }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {{ successMessage }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {{ loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <button
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            {{ isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in' }}
          </button>
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>© 2025 Qalam. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isLogin = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const emit = defineEmits<{
  authenticated: [user: any];
}>();

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMessage.value = '';
  successMessage.value = '';
  password.value = '';
  confirmPassword.value = '';
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!username.value || !password.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  if (!isLogin.value && password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    if (isLogin.value) {
      // Login
      const result = await window.api.auth.login(username.value, password.value);

      if (result.success) {
        successMessage.value = 'Login successful!';
        setTimeout(() => {
          emit('authenticated', result.user);
        }, 500);
      } else {
        errorMessage.value = result.error || 'Login failed';
      }
    } else {
      // Signup
      const result = await window.api.auth.signup(username.value, password.value, email.value || undefined);

      if (result.success) {
        successMessage.value = 'Account created successfully! You can now sign in.';
        setTimeout(() => {
          isLogin.value = true;
          password.value = '';
          confirmPassword.value = '';
        }, 1500);
      } else {
        errorMessage.value = result.error || 'Signup failed';
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    errorMessage.value = 'An unexpected error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>
