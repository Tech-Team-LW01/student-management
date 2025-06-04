import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
apiKey: "AIzaSyC1JINociJurruzDn-0y9uqHuzCUOAsTeo",
  authDomain: "student-announcement-30beb.firebaseapp.com",
  projectId: "student-announcement-30beb",
  storageBucket: "student-announcement-30beb.firebasestorage.app",
  messagingSenderId: "108872021277",
  appId: "1:108872021277:web:e06f5eda182afed837ddf4"
}

// Validate Firebase config
const requiredKeys = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])

if (missingKeys.length > 0) {
  console.error("Missing Firebase configuration keys:", missingKeys)
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
