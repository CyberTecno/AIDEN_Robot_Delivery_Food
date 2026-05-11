import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getAnalytics, isSupported } from 'firebase/analytics'

function requiredEnv(name: string): string {
  const v = import.meta.env[name] as string | undefined
  if (!v) throw new Error(`Missing ${name} in .env`)
  return v
}

const firebaseConfig = {
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: requiredEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)

void (async () => {
  try {
    if (await isSupported()) {
      getAnalytics(app)
    }
  } catch {
    /* analytics optional */
  }
})()
