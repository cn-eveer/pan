<!-- pages/profile.vue -->
<template>
  <div class="container">
    <h1>User Profile</h1>
    <div v-if="user">
      <p>Welcome, {{ userName }}!</p>
    </div>
    <div v-else>
      <p>Please log in to view your profile.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '~/composables/auth'

const { user, loadUserName } = useAuth()
const userName = computed(() => loadUserName()) // Get the user's name
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
}
</style>
