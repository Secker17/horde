import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB-wPFAkn5eYf8lYB-0_kp9BWqp6lI8tsU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'horde-570cd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'horde-570cd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'horde-570cd.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '429136143079',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:429136143079:web:cd05965776680090def842',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-QQW2KQ0WX0',
}

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
export const app = firebaseReady ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const adminUid = import.meta.env.VITE_ADMIN_UID || 'QxVrDWjUPSV6Z8MlDqaYsivC74V2'

// Analytics is browser-only and may be unavailable when cookies are blocked.
export const analyticsPromise = app && firebaseConfig.measurementId
  ? isSupported().then((supported) => supported ? getAnalytics(app) : null).catch(() => null)
  : Promise.resolve(null)
