"use client"

import { useState, useRef } from "react"
import { ACADEMIC_QUESTIONS } from "@/lib/constants/brain-dump-questions"
import { useAddCourse } from "@/lib/hooks/use-courses"
import type { OrganizedCourse } from "@/lib/ai/prompts/academic-organizer"

interface AcademicBrainDumpProps {
  onCoursesAdded?: () => void
}

export default function AcademicBrainDump({ onCoursesAdded }: AcademicBrainDumpProps) {
  const [brainDump, setBrainDump] = useState("")
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [aiError, setAiError] = useState("")
  const [extractedCourses, setExtractedCourses] = useState<OrganizedCourse[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [addedCount, setAddedCount] = useState(0)

  // Speech-to-text state
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [speechSupported, setSpeechSupported] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const brainDumpRef = useRef(brainDump)
  brainDumpRef.current = brainDump

  const addCourseMutation = useAddCourse()

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* ignore */ }
      }
      setIsRecording(false)
      setInterimText("")
      return
    }

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ""
      let finalText = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += piece + " "
        } else {
          interim += piece
        }
      }
      if (finalText) {
        const current = brainDumpRef.current
        const separator = current && !current.endsWith(" ") && !current.endsWith("\n") ? " " : ""
        setBrainDump(current + separator + finalText)
        setExtractedCourses([])
        setAddedCount(0)
      }
      setInterimText(interim)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      if (event.error === "not-allowed") {
        setAiError("Microphone access denied. Please enable mic permissions.")
      }
      setIsRecording(false)
      setInterimText("")
    }

    recognition.onend = () => {
      setIsRecording(false)
      setInterimText("")
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setAiError("")
  }

  const handleOrganizeWithAI = async () => {
    if (!brainDump.trim()) return
    setIsOrganizing(true)
    setAiError("")
    setExtractedCourses([])
    setAddedCount(0)

    try {
      const res = await fetch("/api/ai/organize-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: brainDump }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error || "Failed to organize courses")
        return
      }

      setExtractedCourses(data.courses || [])
    } catch {
      setAiError("Something went wrong. Please try again.")
    } finally {
      setIsOrganizing(false)
    }
  }

  const handleAddAll = async () => {
    if (extractedCourses.length === 0) return
    setIsAdding(true)

    try {
      let added = 0
      for (const course of extractedCourses) {
        await addCourseMutation.mutateAsync({
          name: course.name,
          type: course.type,
          semester: course.semester,
          year: course.year,
          status: course.status || "in_progress",
          letterGrade: course.letterGrade,
          percentage: course.percentage?.toString() || null,
          credits: course.credits?.toString() || "1.0",
          iconColor: course.iconColor || "blue",
        })
        added++
      }
      setAddedCount(added)
      setExtractedCourses([])
      setBrainDump("")
      onCoursesAdded?.()
    } catch {
      setAiError("Failed to add some courses. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const removeCourse = (index: number) => {
    setExtractedCourses((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="glass-card rounded-[32px] p-8 mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[20px]" aria-hidden="true">
            auto_awesome
          </span>
        </div>
        <div>
          <h3 className="text-lg font-black font-display tracking-tight">AI Course Entry</h3>
          <p className="text-xs text-subtle-gray">Describe your courses naturally — AI will structure them</p>
        </div>
      </div>

      {/* Guiding Questions */}
      <div className="mb-3">
        <p className="text-xs font-bold text-subtle-gray mb-1.5">Try mentioning:</p>
        <ul className="space-y-0.5">
          {ACADEMIC_QUESTIONS.map((q, i) => (
            <li key={i} className="text-xs text-subtle-gray flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-subtle-gray/40 mt-1.5 shrink-0" />
              {q}
            </li>
          ))}
        </ul>
      </div>

      {/* Textarea + Mic */}
      <div className="relative">
        <textarea
          value={brainDump + (interimText ? (brainDump ? " " : "") + interimText : "")}
          onChange={(e) => {
            if (!isRecording) {
              setBrainDump(e.target.value)
              setAiError("")
              setExtractedCourses([])
              setAddedCount(0)
            }
          }}
          placeholder={"e.g., \"I'm taking AP Calc with a 94, Honors English with a B+, and regular US History with an 88\""}
          rows={4}
          disabled={isOrganizing}
          readOnly={isRecording}
          aria-label="Describe your courses in your own words"
          className="w-full px-4 py-3 pr-14 rounded-xl bg-white/80 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/40 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all resize-none disabled:opacity-50"
        />
        {speechSupported && (
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isOrganizing}
            className={`absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse hover:bg-red-600"
                : "bg-black/5 text-subtle-gray hover:bg-black/10 hover:text-black"
            } disabled:opacity-40`}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {isRecording ? "stop" : "mic"}
            </span>
          </button>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-medium" role="status" aria-live="polite">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Listening... speak naturally, then tap stop when done.
        </div>
      )}

      {aiError && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm" role="alert">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">error</span>
          {aiError}
        </div>
      )}

      {addedCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-accent-green text-sm font-medium" role="status">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check_circle</span>
          {addedCount} course{addedCount !== 1 ? "s" : ""} added to your transcript!
        </div>
      )}

      {/* Organize Button */}
      {extractedCourses.length === 0 && (
        <button
          type="button"
          onClick={handleOrganizeWithAI}
          disabled={isOrganizing || !brainDump.trim()}
          className="mt-3 w-full px-5 py-3 rounded-xl bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
        >
          {isOrganizing ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
              Extracting courses...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
              Organize with AI
            </>
          )}
        </button>
      )}

      {/* Extracted Courses Preview */}
      {extractedCourses.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-3">
            Extracted {extractedCourses.length} course{extractedCourses.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {extractedCourses.map((course, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-green text-[16px]" aria-hidden="true">school</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{course.name}</p>
                    <p className="text-xs text-subtle-gray">
                      {[course.type, course.letterGrade, course.percentage ? `${course.percentage}%` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCourse(i)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-subtle-gray hover:text-red-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                  aria-label={`Remove ${course.name}`}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddAll}
            disabled={isAdding}
            className="mt-4 w-full px-5 py-3 rounded-xl bg-accent-green text-white text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            {isAdding ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
                Adding courses...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span>
                Add All to Transcript
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
