<!-- pages/room/[id].vue -->
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
        <p>
          Player 1: {{ players[0]?.name || players[0]?.userId }} ({{
            players[0]?.connected ? 'Connected' : 'Disconnected'
          }})
        </p>
        <p>
          Player 2: {{ players[1]?.name || players[1]?.userId }} ({{
            players[1]?.connected ? 'Connected' : 'Disconnected'
          }})
        </p>
        <ClickCounterGame :players="players" :currentUserId="currentUserId" />
      </div>
      <div v-else>
        <button @click="toggleReady">
          {{ isReady ? 'Unready' : 'Ready' }}
        </button>
        <h2>Waiting for players to get ready...</h2>
        <ul>
          <li
            v-for="participant in readyParticipants"
            :key="participant.userId"
          >
            {{ participant.name || participant.userId }} is ready
          </li>
        </ul>
      </div>
    </div>
    <div v-else>
      <p>Room not found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'
import {
  doc,
  getDoc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore'
import ClickCounterGame from '~/components/ClickCounterGame.vue' // Import ClickCounterGame

// State variables for room management
const room = ref<{ content: string } | null>(null)
const loadingRoom = ref<boolean>(true)
const error = ref<string | null>(null)
const participantCount = ref<number>(0)
const isReady = ref<boolean>(false)
const players = ref<
  Array<{ userId: string; name?: string; connected: boolean }>
>([])
const playersSelected = ref<boolean>(false)
const readyParticipants = ref<
  Array<{ userId: string; name?: string; connected: boolean }>
>([])
const currentUserId = ref<string | null>(null)
const gameStarted = ref<boolean>(false) // Track if the game has already started

// Firestore setup
const route = useRoute()
const { $firestore, $auth } = useNuxtApp()
let participantDocRef = null

// Fetch room data from Firestore
const fetchRoomData = async (roomId: string) => {
  const roomDocRef = doc($firestore, `rooms/${roomId}`)
  try {
    const roomSnapshot = await getDoc(roomDocRef)
    if (roomSnapshot.exists()) {
      return roomSnapshot.data()
    } else {
      console.warn('Room document does not exist for room ID:', roomId)
      return null
    }
  } catch (err) {
    console.error('Error fetching room document from Firestore:', err)
    throw err
  }
}

// Room and participant initialization
onMounted(async () => {
  const roomId = route.params.id as string
  currentUserId.value = $auth.currentUser?.uid

  console.log('Attempting to load room data for room ID:', roomId)

  try {
    const roomData = await fetchRoomData(roomId)
    if (roomData) {
      console.log('Room data loaded successfully:', roomData)
      room.value = roomData
      error.value = null

      // Check if the game has already started
      gameStarted.value = roomData.gameStarted || false
      console.log('Game started status:', gameStarted.value)

      // Add or update participant in room
      participantDocRef = doc(
        $firestore,
        `rooms/${roomId}/room-participants`,
        currentUserId.value
      )
      await setDoc(
        participantDocRef,
        {
          userId: currentUserId.value,
          name: $auth.currentUser?.displayName || 'Anonymous',
          joinedAt: new Date(),
          connected: true,
          ready: false,
        },
        { merge: true }
      )
      console.log(
        'Participant added or updated in room with user ID:',
        currentUserId.value
      )

      // Listen for participant updates
      onSnapshot(
        collection($firestore, `rooms/${roomId}/room-participants`),
        (snapshot) => {
          participantCount.value = snapshot.size
          readyParticipants.value = snapshot.docs
            .filter((doc) => doc.data().ready)
            .map((doc) => doc.data())
          console.log('Ready participants:', readyParticipants.value)

          // Load players if the game is ongoing
          if (gameStarted.value) {
            players.value = readyParticipants.value.slice(0, 2)
            playersSelected.value = true
            console.log('Players loaded for ongoing game:', players.value)
          }

          // Select players when two participants are ready
          if (
            !gameStarted.value &&
            readyParticipants.value.length >= 2 &&
            !playersSelected.value
          ) {
            players.value = readyParticipants.value.slice(0, 2)
            playersSelected.value = true
            startGame(roomId)
            console.log(
              'Players selected and game ready to start:',
              players.value
            )
          } else if (readyParticipants.value.length < 2) {
            playersSelected.value = false
            console.log(
              'Not enough players ready yet. Players selected:',
              playersSelected.value
            )
          }
        }
      )

      // Update the user's connected status to true
      await updateDoc(participantDocRef, { connected: true })
      console.log(
        'User connected status set to true for user ID:',
        currentUserId.value
      )

      // Handle disconnection
      window.addEventListener('beforeunload', () => {
        updateDoc(participantDocRef, { connected: false })
        console.log(
          'User set as disconnected for user ID:',
          currentUserId.value
        )
      })
    } else {
      console.warn('Room data not found in Firestore for room ID:', roomId)
      error.value = 'Room not found'
    }
  } catch (err) {
    console.error('Error fetching room data:', err)
    error.value = 'Failed to load room data'
  } finally {
    loadingRoom.value = false
    console.log('Loading room finished. Status:', loadingRoom.value)
  }
})

// Function to start the game
const startGame = async (roomId: string) => {
  console.log('Starting the game...')
  try {
    const roomDocRef = doc($firestore, `rooms/${roomId}`)
    await updateDoc(roomDocRef, {
      gameStarted: true,
    })
    gameStarted.value = true
    console.log('Game started successfully.')
  } catch (error) {
    console.error('Failed to start the game:', error)
  }
}

// Function to toggle the participant's ready status
const toggleReady = async () => {
  console.log('Attempting to toggle ready status...')
  try {
    if (participantDocRef) {
      const newReadyStatus = !isReady.value
      await updateDoc(participantDocRef, {
        ready: newReadyStatus,
      })
      isReady.value = newReadyStatus
      console.log('User ready status updated:', isReady.value)
    } else {
      console.warn('Participant document reference is not set.')
    }
  } catch (error) {
    console.error('Failed to toggle ready status:', error)
  }
}

// Cleanup when component is destroyed
onBeforeUnmount(async () => {
  if (participantDocRef) {
    await updateDoc(participantDocRef, { connected: false })
  }
  window.removeEventListener('beforeunload', () =>
    updateDoc(participantDocRef, { connected: false })
  )
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

if the player is disconnected from the game do not stop the game
