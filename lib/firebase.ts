import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {

  apiKey: "AIzaSyAe4NsIfpJBYmdAXc1AQkbTsQRM4Wi4boE",
  authDomain: "lw-students-management.firebaseapp.com",
  projectId: "lw-students-management",
  storageBucket: "lw-students-management.firebasestorage.app",
  messagingSenderId: "53560055195",
  appId: "1:53560055195:web:38087c947c8126d47e3d3e",
  measurementId: "G-NSPEN834JG"

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
