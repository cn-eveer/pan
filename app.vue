<!-- app.vue -->
<template>
  <div>
    <div v-if="!authChecked">
      <!-- Show a global loading indicator while checking authentication -->
      <p>Loading...</p>
    </div>
    <div v-else>
      <!-- Render the main application content after authentication is checked -->
      <header>
        <nav>
          <ul>
            <li><NuxtLink to="/">Home</NuxtLink></li>
            <li><NuxtLink to="/profile">Profile</NuxtLink></li>
            <li v-if="user">
              <button @click="signOut">Sign Out</button>
            </li>
            <li v-else>
              <button @click="signInWithGoogle">Sign In</button>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <NuxtPage />
      </main>
      <footer>
        <p>© 2024 My Nuxt App</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/auth'

const { user, authChecked, signInWithGoogle, signOut } = useAuth()
</script>

<style scoped>
header {
  background-color: #333;
  color: #fff;
  padding: 10px;
}

nav ul {
  list-style: none;
  display: flex;
  gap: 10px;
}

nav a {
  color: white;
  text-decoration: none;
}

main {
  min-height: calc(100vh - 100px);
}

footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 20px;
  position: absolute;
  bottom: 0;
  width: 100%;
}
</style>
