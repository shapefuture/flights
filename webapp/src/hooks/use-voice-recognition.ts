import { useCallback, useEffect, useState } from "react"

export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "notSupported"

interface UseSpeechRecognitionReturn {
  startListening: () => void
  stopListening: () => void
  transcript: string
  status: SpeechRecognitionStatus
  isListening: boolean
  error: Error | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
}

class SpeechRecognitionUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpeechRecognitionUnavailableError"
  }
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle")
  const [error, setError] = useState<Error | null>(null)
  const [recognition, setRecognition] = useState<any | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setStatus("notSupported")
      setError(new SpeechRecognitionUnavailableError("Speech recognition is not supported in this browser"))
      return
    }

    const recognitionInstance = new SpeechRecognition()
    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = "en-US"

    recognitionInstance.onstart = () => {
      setIsListening(true)
      setStatus("listening")
    }

    recognitionInstance.onerror = (event: { error: string }) => {
      if (event.error === "no-speech") {
        // This is a normal condition when the user isn't speaking
        return
      }
      
      setError(new Error(`Speech recognition error: ${event.error}`))
      setStatus("error")
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
      setStatus("idle")
    }

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let currentTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript
        }
      }

      setTranscript(currentTranscript)
      setStatus("processing")
    }

    setRecognition(recognitionInstance)

    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [])

  const startListening = useCallback(() => {
    setTranscript("")
    setError(null)

    if (!recognition) {
      setError(new Error("Speech recognition is not initialized"))
      return
    }

    try {
      recognition.start()
    } catch (err) {
      setError(new Error("Failed to start speech recognition"))
    }
  }, [recognition])

  const stopListening = useCallback(() => {
    if (!recognition) {
      setError(new Error("Speech recognition is not initialized"))
      return
    }

    try {
      recognition.stop()
    } catch (err) {
      setError(new Error("Failed to stop speech recognition"))
    }
  }, [recognition])

  return {
    startListening,
    stopListening,
    transcript,
    status,
    isListening,
    error,
  }
}