<!-- components/Room.vue -->
<template>
  <div class="room-container">
    <div v-if="loadingRoom">
      <p>Loading room...</p>
    </div>
    <div v-else-if="error">
      <p class="error">{{ error }}</p>
    </div>
    <div v-else-if="room">
      <h1>Room Content</h1>
      <p>{{ room.content }}</p>
      <p>Participants in this room: {{ participantCount }}</p>

      <div v-if="playersSelected">
        <TicTacToeGame
          :players="players"
          :currentUserId="currentUserId"
          :roomId="route.params.id"
        />
      </div>
      <div v-else>
        <button @click="setReady" :disabled="isReady">
          {{ isReady ? 'Ready!' : 'Click to Ready' }}
        </button>
        <h2>Players for Tic-Tac-Toe</h2>
        <p>Player 1: {{ players[0]?.userId || 'Waiting...' }}</p>
        <p>Player 2: {{ players[1]?.userId || 'Waiting...' }}</p>
      </div>
    </div>
    <div v-else>
      <p>Room not found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'
import { useRoom } from '~/composables/room'
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore'

// Reactive state variables
const room = ref<{ content: string } | null>(null)
const loadingRoom = ref<boolean>(true)
const error = ref<string | null>(null)
const participantCount = ref<number>(0)
const isReady = ref<boolean>(false)
const players = ref<Array<{ userId: string }>>([])
const playersSelected = ref<boolean>(false)
const currentUserId = ref<string | null>(null)

const { checkRoom } = useRoom()
const route = useRoute()
const { $firestore, $auth } = useNuxtApp()

let participantDocRef = null

onMounted(async () => {
  const roomId = route.params.id as string
  currentUserId.value = $auth.currentUser?.uid

  try {
    const roomData = await checkRoom(roomId)
    if (roomData) {
      room.value = roomData as { content: string }
      error.value = null

      participantDocRef = doc(
        $firestore,
        `rooms/${roomId}/room-participants`,
        currentUserId.value
      )
      await setDoc(participantDocRef, {
        userId: currentUserId.value,
        joinedAt: new Date(),
        ready: false,
      })

      onSnapshot(
        collection($firestore, `rooms/${roomId}/room-participants`),
        (snapshot) => {
          participantCount.value = snapshot.size
          const readyParticipants = snapshot.docs
            .filter((doc) => doc.data().ready)
            .map((doc) => doc.data())

          if (readyParticipants.length >= 2 && !playersSelected.value) {
            players.value = readyParticipants.slice(0, 2)
            playersSelected.value = true
          }
        }
      )

      window.addEventListener('beforeunload', cleanupParticipant)
    } else {
      error.value = 'Room not found'
    }
  } catch (err) {
    error.value = 'Failed to load room data'
  } finally {
    loadingRoom.value = false
  }
})

const setReady = async () => {
  if (participantDocRef) {
    await updateDoc(participantDocRef, {
      ready: true,
    })
    isReady.value = true
  }
}

const cleanupParticipant = async () => {
  if (participantDocRef) {
    await deleteDoc(participantDocRef)
    participantDocRef = null
  }
}

onBeforeUnmount(async () => {
  await cleanupParticipant()
  window.removeEventListener('beforeunload', cleanupParticipant)
})
</script>

<style scoped>
.room-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  margin-top: 10px;
}

button:disabled {
  background-color: #888;
}

.error {
  color: red;
  font-weight: bold;
}
</style>
