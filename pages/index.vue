<!-- pages/index.vue -->
<template>
  <div class="container">
    <h1>Welcome to the App</h1>
    <div v-if="!authChecked">
      <!-- Show a loading indicator while checking authentication -->
      <p>Loading...</p>
    </div>
    <div v-else-if="!user">
      <!-- Prompt the user to log in if not authenticated -->
      <p>Please log in to continue.</p>
      <button @click="signInWithGoogle">Sign In with Google</button>
    </div>
    <div v-else>
      <div v-if="isNewUser">
        <!-- Show nickname setup if the user is new -->
        <h2>Set Your Nickname</h2>
        <form @submit.prevent="handleSaveNickname">
          <input
            v-model="nickname"
            placeholder="Enter your nickname"
            required
          />
          <button type="submit">Save Nickname</button>
        </form>
        <p v-if="nicknameError" class="error">{{ nicknameError }}</p>
      </div>
      <div v-else>
        <!-- Greet the user and show the create room button -->
        <p>Hello, {{ displayName }}!</p>
        <button @click="signOut">Sign Out</button>

        <h2>Create a New Room</h2>
        <button @click="handleCreateRoom">Create Room</button>
        <p v-if="roomError" class="error">{{ roomError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/auth'
import { useRoom } from '~/composables/room'
import { generateRandomId } from '~/utils/generateId' // Import the function to generate random IDs

const {
  user,
  isNewUser,
  nickname,
  nicknameError,
  authChecked,
  signInWithGoogle,
  signOut,
  saveNickname,
} = useAuth()
const { addRoom } = useRoom()
const router = useRouter()

// Reactive state for error handling
const roomError = ref('')

// Computed property to determine the display name
const displayName = computed(
  () => nickname.value || user?.displayName || 'User'
)

// Handle saving the nickname
const handleSaveNickname = async () => {
  await saveNickname(nickname.value)
}

// Handle creating a new room

const handleCreateRoom = async () => {
  try {
    // Create the room and get the generated room ID
    const roomId = await addRoom('This is the room content')
    console.log('Navigating to room with ID:', roomId) // Log the correct room ID
    roomError.value = ''
    // Redirect to the newly created room using the correct room ID
    await router.push(`/room/${roomId}`)
  } catch (err) {
    console.error('Error creating room:', err)
    roomError.value = 'Failed to create room'
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 50px auto;
  text-align: center;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  margin-top: 10px;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
