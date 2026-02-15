"use client"

import { useState, useEffect, useRef } from "react"
import { ACTIVITY_QUESTIONS } from "@/lib/constants/brain-dump-questions"

interface Activity {
  id: string
  name: string
  role: string
  category: string
  hoursPerWeek: number
  yearsParticipated: number
  description: string
  achievements: string[]
  status: "ongoing" | "seasonal" | "completed"
}

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  activity?: Activity | null
}

const categories = [
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "academic", label: "Academic" },
  { value: "community_service", label: "Community Service" },
  { value: "work", label: "Work" },
  { value: "leadership", label: "Leadership" },
  { value: "other", label: "Other" },
]

const statuses = [
  { value: "ongoing", label: "Ongoing" },
  { value: "seasonal", label: "Seasonal" },
  { value: "completed", label: "Completed" },
]

export default function ActivityModal({ isOpen, onClose, onSave, activity }: ActivityModalProps) {
  const isEdit = !!activity
  const modalRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    name: "",
    role: "",
    category: "other",
    hoursPerWeek: 5,
    yearsParticipated: 1,
    description: "",
    status: "ongoing" as "ongoing" | "seasonal" | "completed",
    achievements: [] as string[],
  })

  const [newAchievement, setNewAchievement] = useState("")

  // AI brain dump state
  const [brainDump, setBrainDump] = useState("")
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiApplied, setAiApplied] = useState(false)

  // Speech-to-text state
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [speechSupported, setSpeechSupported] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const brainDumpRef = useRef(brainDump)
  brainDumpRef.current = brainDump

  useEffect(() => {
    if (activity) {
      setForm({
        name: activity.name,
        role: activity.role,
        category: activity.category,
        hoursPerWeek: activity.hoursPerWeek,
        yearsParticipated: activity.yearsParticipated,
        description: activity.description,
        status: activity.status,
        achievements: [...activity.achievements],
      })
    } else {
      setForm({
        name: "",
        role: "",
        category: "other",
        hoursPerWeek: 5,
        yearsParticipated: 1,
        description: "",
        status: "ongoing",
        achievements: [],
      })
    }
    setNewAchievement("")
    setBrainDump("")
    setAiError("")
    setAiApplied(false)
    setIsRecording(false)
    setInterimText("")
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
  }, [activity, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

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
        setAiApplied(false)
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

    try {
      const res = await fetch("/api/ai/organize-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: brainDump }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error || "Failed to organize activity")
        return
      }

      const organized = data.activity
      setForm({
        name: organized.name || "",
        role: organized.role || "",
        category: organized.category || "other",
        hoursPerWeek: organized.hoursPerWeek || 5,
        yearsParticipated: organized.yearsParticipated || 1,
        description: organized.description || "",
        status: organized.status || "ongoing",
        achievements: Array.isArray(organized.achievements) ? organized.achievements : [],
      })
      setAiApplied(true)
    } catch {
      setAiError("Something went wrong. Please try again.")
    } finally {
      setIsOrganizing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.role.trim()) return

    onSave({
      id: activity?.id || crypto.randomUUID(),
      ...form,
    })
  }

  const addAchievement = () => {
    const trimmed = newAchievement.trim()
    if (!trimmed) return
    setForm((prev) => ({
      ...prev,
      achievements: [...prev.achievements, trimmed],
    }))
    setNewAchievement("")
  }

  const removeAchievement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }))
  }

  const handleAchievementKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addAchievement()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? `Edit ${activity.name}` : "Add new activity"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-[32px] p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight font-display">
            {isEdit ? "Edit Activity" : "Add New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {/* AI Brain Dump — only shown for new activities */}
        {!isEdit && (
          <div className="mb-8">
            <div className="rounded-2xl border-2 border-dashed border-accent-green/30 bg-accent-green/[0.03] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]" aria-hidden="true">
                    auto_awesome
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">AI Quick Add</h3>
                  <p className="text-xs text-subtle-gray">Type or speak — AI will organize everything</p>
                </div>
              </div>

              {/* Guiding Questions */}
              <div className="mt-3 mb-2">
                <p className="text-xs font-bold text-subtle-gray mb-1.5">Try mentioning:</p>
                <ul className="space-y-0.5">
                  {ACTIVITY_QUESTIONS.map((q, i) => (
                    <li key={i} className="text-xs text-subtle-gray flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-subtle-gray/40 mt-1.5 shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Textarea + Mic */}
              <div className="relative mt-3">
                <textarea
                  value={brainDump + (interimText ? (brainDump ? " " : "") + interimText : "")}
                  onChange={(e) => {
                    if (!isRecording) {
                      setBrainDump(e.target.value)
                      setAiError("")
                      if (aiApplied) setAiApplied(false)
                    }
                  }}
                  placeholder={"Just type or tap the mic and speak everything you know...\n\ne.g., \"I've been doing robotics since freshman year, now I'm a junior. I run the programming team and we use Python. We won regionals last year and went to states.\""}
                  rows={4}
                  disabled={isOrganizing}
                  readOnly={isRecording}
                  aria-label="Describe your activity in your own words"
                  className="w-full px-4 py-3 pr-14 rounded-xl bg-white/80 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/40 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all resize-none disabled:opacity-50"
                />
                {/* Mic Button */}
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

              {aiApplied && (
                <div className="mt-3 flex items-center gap-2 text-accent-green text-sm font-medium" role="status">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check_circle</span>
                  Fields populated — review and edit below, then save.
                </div>
              )}

              <button
                type="button"
                onClick={handleOrganizeWithAI}
                disabled={isOrganizing || !brainDump.trim()}
                className="mt-3 w-full px-5 py-3 rounded-xl bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                {isOrganizing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
                    Organizing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                    Organize with AI
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mt-6">
              <div className="h-px flex-grow bg-black/5"></div>
              <span className="text-xs font-bold text-subtle-gray uppercase tracking-widest">
                {aiApplied ? "Review & Edit" : "Or fill in manually"}
              </span>
              <div className="h-px flex-grow bg-black/5"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Name + Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity-name" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Activity Name *
              </label>
              <input
                id="activity-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Robotics Club"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/50 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="activity-role" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Your Role *
              </label>
              <input
                id="activity-role"
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Lead Engineer"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/50 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Row 2: Category + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity-category" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Category
              </label>
              <select
                id="activity-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="activity-status" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                id="activity-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Activity["status"] })}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all appearance-none"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Hours + Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="activity-hours" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Hours per Week
              </label>
              <input
                id="activity-hours"
                type="number"
                min={1}
                max={40}
                value={form.hoursPerWeek}
                onChange={(e) => setForm({ ...form, hoursPerWeek: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="activity-years" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                Years Participated
              </label>
              <input
                id="activity-years"
                type="number"
                min={1}
                max={6}
                value={form.yearsParticipated}
                onChange={(e) => setForm({ ...form, yearsParticipated: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="activity-description" className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              id="activity-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Briefly describe your involvement and impact..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/50 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Achievements */}
          <div>
            <label className="block text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
              Key Achievements
            </label>
            <div className="space-y-2 mb-3">
              {form.achievements.map((ach, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0"></span>
                  <span className="flex-grow text-sm">{ach}</span>
                  <button
                    type="button"
                    onClick={() => removeAchievement(i)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    aria-label={`Remove achievement: ${ach}`}
                  >
                    <span className="material-symbols-outlined text-red-400 text-[16px]" aria-hidden="true">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyDown={handleAchievementKeyDown}
                placeholder="Add an achievement and press Enter..."
                aria-label="Add achievement to activity"
                className="flex-grow px-4 py-2.5 rounded-xl bg-white/60 border border-black/10 text-sm font-medium placeholder:text-subtle-gray/50 focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={addAchievement}
                className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-black text-white text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              {isEdit ? "Save Changes" : "Add Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
