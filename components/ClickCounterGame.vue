<!-- components/ClickCounterGame.vue -->
<template>
  <div class="game-container">
    <h1>Click Counter Game</h1>

    <div v-if="loadingRoom">
      <p>Loading game...</p>
    </div>

    <div v-else-if="error">
      <p class="error">{{ error }}</p>
    </div>

    <div v-else>
      <p v-if="players.length >= 2">
        <span :class="{ 'current-turn': true }"
          >Current Turn: {{ currentPlayerName }}</span
        >
      </p>
      <p>Total Clicks: {{ totalClicks }}</p>

      <div class="player-section">
        <div class="player">
          <h2>Player 1 ({{ players[0]?.name || 'Player 1' }})</h2>
          <p>Clicks: {{ player1Clicks }}</p>
        </div>
        <div class="player">
          <h2>Player 2 ({{ players[1]?.name || 'Player 2' }})</h2>
          <p>Clicks: {{ player2Clicks }}</p>
        </div>
        <div class="action-section">
          <button @click="handleClick" :disabled="!isCurrentPlayer">
            Click Me!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'

// Props
const props = defineProps({
  players: Array,
  currentUserId: String,
})

// State variables for game management
const loadingRoom = ref<boolean>(true)
const error = ref<string | null>(null)
const currentTurn = ref<number>(1) // 1 for Player 1, 2 for Player 2
const player1Clicks = ref<number>(0)
const player2Clicks = ref<number>(0)
const totalClicks = ref<number>(0)
const roomDocRef = ref(null)

// Firestore setup
const route = useRoute()
const { $firestore } = useNuxtApp()

onMounted(async () => {
  const roomId = route.params.id as string
  roomDocRef.value = doc($firestore, `rooms/${roomId}`)

  console.log('Loading Click Counter Game for room ID:', roomId)

  try {
    // Listen for real-time updates on the game state
    onSnapshot(roomDocRef.value, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data()
        console.log('Real-time update received:', data)

        currentTurn.value = data.currentTurn || 1
        player1Clicks.value = data.player1Clicks || 0
        player2Clicks.value = data.player2Clicks || 0
        totalClicks.value = data.totalClicks || 0
      } else {
        console.warn('Room document does not exist.')
        error.value = 'Room does not exist.'
      }
    })
  } catch (err) {
    console.error('Error fetching room data:', err)
    error.value = 'Failed to load room data'
  } finally {
    loadingRoom.value = false
    console.log('Loading room finished.')
  }
})

// Computed property to check if it's the current player's turn
const isCurrentPlayer = computed(() => {
  const playerId = props.players[currentTurn.value - 1]?.userId
  return playerId === props.currentUserId
})

// Computed property to get the current player's name
const currentPlayerName = computed(() => {
  return props.players[currentTurn.value - 1]?.name || 'Unknown Player'
})

// Handle player click
const handleClick = async () => {
  console.log(`Player ${currentTurn.value} clicked the button.`)

  try {
    // Prepare updates
    const updates: any = {
      totalClicks: totalClicks.value + 1,
      currentTurn: currentTurn.value === 1 ? 2 : 1, // Switch turns
    }

    // Increment the respective player's clicks
    if (currentTurn.value === 1) {
      updates.player1Clicks = player1Clicks.value + 1
      console.log(`Incrementing Player 1 clicks to ${updates.player1Clicks}`)
    } else {
      updates.player2Clicks = player2Clicks.value + 1
      console.log(`Incrementing Player 2 clicks to ${updates.player2Clicks}`)
    }

    // Update the game state in Firestore
    await updateDoc(roomDocRef.value, updates)
    console.log('Game state updated in Firestore:', updates)
  } catch (error) {
    console.error('Failed to update game state:', error)
  }
}
</script>

<style scoped>
.game-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  font-family: Arial, sans-serif;
}

.player-section {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 20px;
}

.player {
  width: 40%;
}

.action-section {
  margin-top: 20px;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 15px 30px;
  cursor: pointer;
  font-size: 18px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #888;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #45a049;
}

.current-turn {
  color: red;
  font-weight: bold;
}

.error {
  color: red;
  font-weight: bold;
}
</style>
