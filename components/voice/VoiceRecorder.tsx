"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void
  transcript: string
}

export function VoiceRecorder({ onTranscriptChange, transcript }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    // Initialize recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcriptPiece + " "
        } else {
          interim += transcriptPiece
        }
      }

      if (final) {
        onTranscriptChange(transcript + final)
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      if (event.error === "not-allowed") {
        alert("Microphone access denied. Please enable microphone permissions and try again.")
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still supposed to be recording
        recognition.start()
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript, onTranscriptChange, isRecording])

  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      setInterimTranscript("")
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  // Fallback for unsupported browsers
  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          Voice input is not supported in this browser. Please use Chrome, Edge, or type your activities below.
        </div>
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Type your extracurricular activities here... For example: I'm president of the robotics club, we meet 10 hours a week. I also volunteer at the library on weekends for about 3 hours."
          className="w-full min-h-[200px] p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    )
  }

  const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          type="button"
          onClick={toggleRecording}
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={`relative ${isRecording ? "animate-pulse" : ""}`}
        >
          {isRecording ? (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </>
          )}
        </Button>

        {isRecording && (
          <div className="flex items-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isRecording && wordCount === 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Click the microphone and speak naturally about your activities.
            For example: "I'm president of the robotics club, we meet 10 hours a week.
            I also volunteer at the library on weekends for about 3 hours."
          </p>
        </Card>
      )}

      {/* Transcript Display */}
      <div className="min-h-[200px] p-4 rounded-lg border border-gray-300 bg-white">
        {transcript || interimTranscript ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">
              {transcript}
              <span className="text-gray-400 italic">{interimTranscript}</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Your transcript will appear here as you speak...
          </p>
        )}
      </div>

      {/* Word Count */}
      {wordCount > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{wordCount} words</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onTranscriptChange("")}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  )
}
