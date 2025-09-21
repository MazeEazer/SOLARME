// components/Tracker/SaveButton.jsx
import { useState } from "react"

export default function SaveButton({ onClick }) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      onClick()
      setIsSaving(false)
    }, 300)
  }

  return (
    <button
      className="save-button accent"
      onClick={handleSave}
      disabled={isSaving}
    >
      {isSaving ? "Сохраняю..." : "Сохранить день"}
    </button>
  )
}
