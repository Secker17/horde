import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAqtqQtGtbY-foEtjoEz7kj1m3sUnyzh_w',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hordejakten-ddb64.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hordejakten-ddb64',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hordejakten-ddb64.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '152383190641',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:152383190641:web:a9404868b575b12da70dd0',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-22F6SHL2FY',
}

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
export const app = firebaseReady ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? initializeFirestore(app, { experimentalForceLongPolling: true }) : null
export const adminUid = import.meta.env.VITE_ADMIN_UID || 'QxVrDWjUPSV6Z8MlDqaYsivC74V2'

// Analytics is browser-only and may be unavailable when cookies are blocked.
export const analyticsPromise = app && firebaseConfig.measurementId
  ? isSupported().then((supported) => supported ? getAnalytics(app) : null).catch(() => null)
  : Promise.resolve(null)
