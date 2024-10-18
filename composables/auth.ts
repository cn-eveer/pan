// composables/useAuth.ts
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth'
import { getDoc, doc, setDoc } from 'firebase/firestore'

const user = ref<User | null>(null)
const isNewUser = ref<boolean>(false)
const nickname = ref('')
const nicknameError = ref('')
const authChecked = ref<boolean>(false) // Indicates if the auth check is complete

export function useAuth() {
  const { $auth, $firestore } = useNuxtApp()

  // Function to handle Google Sign-In
  const signInWithGoogle = async () => {
    console.log('Attempting Google sign-in')
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup($auth, provider)
      user.value = result.user // Set the logged-in user
      console.log('Google sign-in successful:', user.value)
      await checkUserInFirestore() // Check if the user exists in Firestore
    } catch (error) {
      console.error('Google sign-in failed:', error)
    }
  }

  // Function to handle Sign-Out
  const signOut = async () => {
    console.log('Attempting sign-out')
    try {
      await firebaseSignOut($auth)
      user.value = null // Clear the user data
      isNewUser.value = false // Reset the new user flag
      nickname.value = '' // Clear the nickname
      console.log('Sign-out successful')
    } catch (error) {
      console.error('Sign-out failed:', error)
    }
  }

  // Function to check if the user exists in Firestore
  const checkUserInFirestore = async () => {
    if (user.value) {
      const userRef = doc($firestore, 'users', user.value.uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        // User exists in Firestore, fetch the nickname
        const userData = userDoc.data()
        nickname.value = userData.nickname || '' // Set the nickname if available
        isNewUser.value = false // The user is not new
        console.log('User exists in Firestore with nickname:', nickname.value)
      } else {
        // User does not exist in Firestore, treat as new user
        isNewUser.value = true
        console.log('User is new, needs to set a nickname')
      }
    }
  }

  // Function to load the user's name
  const loadUserName = () => {
    return nickname.value || user.value?.displayName || 'User'
  }

  // Monitor the authentication state
  onMounted(() => {
    onAuthStateChanged($auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        console.log('User is logged in:', firebaseUser)
        await checkUserInFirestore() // Check if the user exists in Firestore
      } else {
        console.log('No user is logged in')
        isNewUser.value = false
        nickname.value = ''
      }
      authChecked.value = true // Mark authentication as checked
    })
  })

  // Function to handle saving the nickname
  const saveNickname = async (nicknameValue: string) => {
    console.log('Attempting to save nickname:', nicknameValue)
    if (!nicknameValue) {
      nicknameError.value = 'Nickname is required.'
      console.log('Nickname is required')
      return
    }

    try {
      const userRef = doc($firestore, 'users', user.value!.uid)
      await setDoc(userRef, { nickname: nicknameValue }, { merge: true })
      nickname.value = nicknameValue
      isNewUser.value = false // The user is no longer new
      nicknameError.value = '' // Clear the error message
      console.log('Nickname saved successfully:', nicknameValue)
    } catch (error) {
      nicknameError.value = 'Failed to save nickname. Please try again.'
      console.error('Error saving nickname:', error)
    }
  }

  return {
    user,
    isNewUser,
    nickname,
    nicknameError,
    authChecked, // Return the authChecked state
    signInWithGoogle,
    signOut,
    saveNickname,
    loadUserName, // Expose the loadUserName function
  }
}
