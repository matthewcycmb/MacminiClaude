"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"

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

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const categoryEmoji: Record<string, string> = {
  sports: "\u{1F3BE}",
  arts: "\u{1F3A8}",
  academic: "\u{1F9EA}",
  community_service: "\u{1F91D}",
  work: "\u{1F4BC}",
  leadership: "\u{1F3AF}",
  other: "\u{2B50}",
}

const quickPrompts = [
  {
    icon: "trending_up",
    label: "How do I improve the quality of my activity?",
  },
  {
    icon: "military_tech",
    label: "Give me leadership ideas",
  },
  {
    icon: "public",
    label: "How to increase community impact?",
  },
]

export default function ActivityBoosterPage() {
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    if (chatEndRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities")
      if (res.ok) {
        const data = await res.json()
        const acts = data.activities || []
        setActivities(acts)
        if (acts.length > 0) {
          selectActivity(acts[0])
        }
      }
    } catch (err) {
      console.error("Error fetching activities:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setMessages([
      {
        role: "assistant",
        content: `Hello! I've analyzed your role as **${activity.role}** in **${activity.name}**. To stand out to top-tier colleges, we should focus on transitioning from participation to **measurable impact** and leadership.\n\nHow can I help you level up your activity today?`,
      },
    ])
    setInput("")
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedActivity || sending) return

    const userMessage: ChatMessage = { role: "user", content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/ai/boost-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.role === "user" || m.role === "assistant"),
          activity: selectedActivity,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please check your connection and try again.",
        },
      ])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  // Determine the evolution label based on the activity
  const getEvolutionLabel = (activity: Activity) => {
    const hasLeadership = activity.role.toLowerCase().includes("lead") ||
      activity.role.toLowerCase().includes("president") ||
      activity.role.toLowerCase().includes("captain") ||
      activity.role.toLowerCase().includes("founder")
    const hasAchievements = activity.achievements.length > 0

    if (hasLeadership && hasAchievements) return "Leadership + Impact"
    if (hasLeadership) return "Leadership"
    if (hasAchievements) return "Achievement"
    return "Leadership + Impact"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse" aria-hidden="true">bolt</span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Loading Activity Booster...</p>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-card rounded-[32px] p-10 max-w-md">
          <div className="w-20 h-20 rounded-[22px] bg-black/5 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-subtle-gray text-4xl" aria-hidden="true">bolt</span>
          </div>
          <h2 className="text-2xl font-black font-display mb-3">No Activities Yet</h2>
          <p className="text-subtle-gray text-sm mb-8">
            Add some extracurricular activities first, then come back here to get AI-powered advice on how to boost them for college applications.
          </p>
          <Link
            href="/dashboard/activities"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            Add Activities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mx-12 -my-10 px-12 pt-10">
      {/* Header */}
      <header className="pb-4 shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xs font-black tracking-[0.25em] text-black/40 uppercase mb-1">
              AI Activity Booster
            </h1>
            <h2 className="text-3xl font-black tracking-tight text-black uppercase font-display">
              Enhance My Path
            </h2>
          </div>
          <div className="flex items-center gap-6">
            {session?.user?.image && (
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm">
                <img
                  alt="Profile"
                  className="w-full h-full object-cover"
                  src={session.user.image}
                />
              </div>
            )}
          </div>
        </div>

        {/* Activity Pills - Horizontal Scroll */}
        <div className="relative group">
          <div
            className="flex items-center gap-3 overflow-x-auto py-2 pr-20"
            style={{
              maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {activities.map((activity) => {
              const isActive = selectedActivity?.id === activity.id
              const emoji = categoryEmoji[activity.category] || "\u{2B50}"
              return (
                <button
                  key={activity.id}
                  onClick={() => selectActivity(activity)}
                  className={`transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer border flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 ${
                    isActive
                      ? "bg-white/95 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/10"
                      : "glass-card hover:bg-white/80 border-transparent"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">{activity.name}</span>
                  {isActive && (
                    <span className="material-symbols-outlined text-[14px] text-emerald-500 ml-1" aria-hidden="true">
                      auto_awesome
                    </span>
                  )}
                </button>
              )
            })}
            <Link
              href="/dashboard/activities"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-black/20 text-subtle-gray hover:border-emerald-500/50 hover:text-emerald-600 transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              <span className="text-sm font-semibold whitespace-nowrap">Add Activity</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      {selectedActivity && (
        <div className="flex-grow pb-10 overflow-hidden">
          <div className="h-full glass-card rounded-[32px] flex flex-col overflow-hidden relative shadow-2xl">
            {/* Chat Header */}
            <div className="px-10 py-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-white/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-black tracking-widest uppercase rounded-full">
                    AI Recommended
                  </span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">{selectedActivity.name}</h3>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-black/5 rounded-2xl">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">smart_toy</span>
                <span className="text-xs font-bold uppercase tracking-[0.1em]">AI Copilot</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-grow overflow-y-auto p-10 space-y-8"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" ? (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-xl" aria-hidden="true">auto_awesome</span>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white/60 backdrop-blur-md rounded-3xl rounded-tl-none p-6 text-[15px] leading-relaxed shadow-sm border border-white/40">
                          <SafeMessage text={msg.content} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 max-w-[85%] ml-auto justify-end">
                      <div className="bg-black text-white rounded-3xl rounded-tr-none p-6 text-[15px] leading-relaxed shadow-lg">
                        {msg.content}
                      </div>
                      {session?.user?.image ? (
                        <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white">
                          <img
                            alt="You"
                            className="w-full h-full object-cover"
                            src={session.user.image}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-accent-green/20 text-accent-green flex items-center justify-center shrink-0 shadow-lg">
                          <span className="material-symbols-outlined text-xl" aria-hidden="true">person</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Sending indicator */}
              {sending && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-lg">
                    <span className="material-symbols-outlined text-xl animate-pulse" aria-hidden="true">auto_awesome</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl rounded-tl-none px-6 py-4 shadow-sm border border-white/40">
                    <div className="flex items-center gap-2 text-subtle-gray text-sm">
                      <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">progress_activity</span>
                      Thinking...
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Prompts - only show on initial message */}
              {messages.length === 1 && !sending && (
                <div className="pt-2 flex flex-col gap-4">
                  <p className="text-xs font-black text-subtle-gray uppercase tracking-[0.2em] px-1">
                    Quick Prompts
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        onClick={() => handleQuickPrompt(prompt.label)}
                        className="px-5 py-3 rounded-2xl bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all text-sm font-semibold text-charcoal flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                      >
                        <span className="material-symbols-outlined text-lg opacity-60 text-emerald-500" aria-hidden="true">
                          {prompt.icon}
                        </span>
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Footer: Evolution Bar + Input */}
            <div className="shrink-0 bg-white/30 backdrop-blur-xl border-t border-black/5">
              {/* College Value Evolution */}
              <div className="px-10 py-4 bg-emerald-50/30 flex items-center justify-between border-b border-black/5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-subtle-gray uppercase tracking-[0.2em] mb-1">
                    College Value Evolution
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-60">Participation</span>
                    <span className="material-symbols-outlined text-xs text-subtle-gray" aria-hidden="true">
                      arrow_forward
                    </span>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tight">
                      {getEvolutionLabel(selectedActivity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={sending}
                    placeholder="Type your question here..."
                    className="w-full bg-white/80 border border-black/5 rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all placeholder:text-subtle-gray/60 text-[15px] shadow-sm disabled:opacity-50 focus:outline-none"
                    aria-label="Type your question about this activity"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:scale-[1.05] transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Safely render markdown-like bold and newlines without dangerouslySetInnerHTML */
function SafeMessage({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.split(/(\*\*.+?\*\*)/g).map((segment, si) =>
            segment.startsWith("**") && segment.endsWith("**") ? (
              <span key={si} className="font-bold">{segment.slice(2, -2)}</span>
            ) : (
              <span key={si}>{segment}</span>
            )
          )}
        </span>
      ))}
    </div>
  )
}
