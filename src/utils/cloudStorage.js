// src/utils/cloudStorage.js
import { db } from "../firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

// Сохранить данные пользователя в Firestore
export const saveUserData = async (userId, key, data) => {
  if (!userId) throw new Error("No user ID")
  await setDoc(doc(db, "users", userId, "data", key), {
    data: data,
    updatedAt: new Date(),
  })
}

// Загрузить данные пользователя из Firestore
export const loadUserData = async (userId, key) => {
  if (!userId) return null
  const docRef = doc(db, "users", userId, "data", key)
  const snapshot = await getDoc(docRef)
  return snapshot.exists() ? snapshot.data().data : null
}
