// composables/room.ts
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useNuxtApp } from '#app'
import { ref } from 'vue'
import { generateRandomId } from '~/utils/generateId' // Import the function to generate random IDs

export function useRoom() {
  const { $firestore, $auth } = useNuxtApp()
  const error = ref(null)

  // Function to add a new room with a custom ID
  const addRoom = async (content: string) => {
    error.value = null
    const roomId = generateRandomId(8) // Generate an 8-character random ID for the room
    const creatorId = $auth.currentUser?.uid // Get the current authenticated user's ID
    try {
      // Create the document in Firestore with the custom ID (roomId)
      await setDoc(doc($firestore, 'rooms', roomId), {
        content,
        creatorId, // Include the creatorId in the document
        createdAt: new Date(), // Optionally add a timestamp for when the room was created
      })
      console.log('Room added successfully with ID:', roomId)
      return roomId // Return the roomId after successfully creating the room
    } catch (err) {
      console.error('Error adding room:', err)
      error.value = 'Failed to add room'
      throw err // Throw the error to be handled by the caller
    }
  }

  // Function to check if a room exists
  const checkRoom = async (roomId: string) => {
    console.log('Checking room with ID:', roomId) // Debug log
    try {
      const roomRef = doc($firestore, 'rooms', roomId)
      const roomSnap = await getDoc(roomRef)
      if (roomSnap.exists()) {
        console.log('Room found:', roomSnap.data()) // Debug log
        return roomSnap.data() // Return the room data if it exists
      } else {
        console.warn('Room not found in Firestore') // Debug log
        return null // Room does not exist
      }
    } catch (err) {
      console.error('Error checking room:', err)
      throw new Error('Failed to check room')
    }
  }

  return {
    addRoom,
    checkRoom, // Export the checkRoom function
    error,
  }
}
