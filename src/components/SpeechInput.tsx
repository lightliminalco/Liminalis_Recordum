import { useState, useRef, useCallback, useEffect } from 'react'

interface SpeechInputProps {
  onTranscript: (text: string) => void
  onListeningChange?: (listening: boolean) => void
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWindow = (): any => window

/** Check if the Web Speech API is available */
export function isSpeechSupported(): boolean {
  const w = getWindow()
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export default function SpeechInput({
  onTranscript,
  onListeningChange,
  className = '',
}: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(isSpeechSupported)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    onListeningChange?.(false)
  }, [onListeningChange])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const w = getWindow()
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1]
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim()
        if (transcript) {
          onTranscript(transcript)
        }
      }
    }

    recognition.onerror = () => {
      stopListening()
    }

    recognition.onend = () => {
      // If we're still supposed to be listening, the recognition ended unexpectedly
      if (recognitionRef.current) {
        stopListening()
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    onListeningChange?.(true)
  }, [isSupported, onTranscript, onListeningChange, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!isSupported) return null

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
        isListening
          ? 'bg-red-900/30 text-red-300 border border-red-700/40'
          : 'bg-purple-900/20 text-purple-400/60 border border-purple-800/30 hover:text-purple-300 hover:border-purple-700/40'
      } ${className}`}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          Listening...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Speak
        </>
      )}
    </button>
  )
}
