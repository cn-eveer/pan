<template>
<div>
    <h1>Welcome to Nuxt + Firebase</h1>
    <button @click="signInWithGoogle">Sign In with Google</button>
    <div v-if="user">
      <p>Welcome, {{ user.displayName }}</p>
    </div>
    <div v-if="error">
      <p>Error: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { useFirebase } from '~/composables/useFirebase'
const { user, error, signInWithGoogle } = useFirebase()
</script>
