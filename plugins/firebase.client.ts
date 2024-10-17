import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  console.log('Firebase Config:', config.public)

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId
  }

  const firebaseApp = initializeApp(firebaseConfig)

  const auth = getAuth(firebaseApp)
  const firestore = getFirestore(firebaseApp)

  return {
    provide: {
      firebaseApp,
      auth,
      firestore
    }
  }
})
