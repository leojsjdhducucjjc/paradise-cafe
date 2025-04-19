import { useState, useEffect } from "react"
import { IconX, IconPin } from "@tabler/icons"

export default function StickyNoteAnnouncement() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const announcementDismissed = localStorage.getItem("announcementDismissed")

    if (!announcementDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("announcementDismissed", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="z-0 bg-gray-200 dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-start space-x-4 mb-6 relative">
      <img
        src="/favicon-32x32.png"
        alt="Orbit"
        className="w-10 h-10 rounded-full bg-primary flex-shrink-0"
      />
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1">
          <IconPin className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          Planetary
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0"> </p>
        <div className="text-gray-800 dark:text-gray-300 text-sm space-y-2">
          <p>
            👋 <strong>Welcome to Orbit!</strong>
            <br />
            We're excited to have you on board 🎉
          </p>
          <p> </p>
          <p> </p>
          <p>
            🚧 <strong>Note:</strong> Orbit is currently in <em>beta</em>, which means you may encounter the occasional
            bug or unfinished feature.
          </p>
          <p> We're working hard to improve the experience — and your feedback helps us do that!</p>
          <p> </p>
          <p> </p>
          <p>
            🛠️ <strong>Spotted an issue or have a suggestion?</strong>
            <br />
            Let us know through <strong>Github</strong> — we're actively listening.
          </p>
          <p>
            ❗ <strong>Group-specific questions?</strong>
            <br />
            Orbit supports multiple groups. For rules, roles, or rank queries, contact your group's leadership directly.
          </p>
          <p> </p>
          <p> </p>
          <p>Thanks for being part of the journey 🚀</p>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label="Close announcement"
      >
        <IconX className="w-5 h-5" />
      </button>
    </div>
  )
}
