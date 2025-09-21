// src/firebase.js
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCVphCYs8ASb5yqKLxEcHEal4tAQd-tEUg",
  authDomain: "solar-me-f6614.firebaseapp.com",
  projectId: "solar-me-f6614",
  storageBucket: "solar-me-f6614.firebasestorage.app",
  messagingSenderId: "3414791158",
  appId: "1:3414791158:web:98b68416147fb3f3936dd7",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Автоматический вход анонимно
export const autoSignIn = async () => {
  const user = auth.currentUser
  if (!user) {
    await signInAnonymously(auth)
  }
}

export { db, auth, onAuthStateChanged }
