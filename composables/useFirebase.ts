import { useNuxtApp } from '#app'
import { ref } from 'vue'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

export const useFirebase = () => {
  const { $auth } = useNuxtApp()

  const user = ref(null)
  const error = ref(null)

  // Method to handle sign-in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup($auth, provider)
      user.value = result.user
    } catch (err) {
      error.value = err.message
    }
  }

  // Return Firebase states and methods
  return {
    user,
    error,
    signInWithGoogle,
  }
}
