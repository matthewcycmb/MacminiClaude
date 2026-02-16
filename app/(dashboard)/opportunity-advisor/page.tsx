"use client"

import { useSession } from "next-auth/react"
import { useState, useRef, useEffect } from "react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const quickPrompts = [
  {
    icon: "science",
    label: "How do I find research opportunities near me?",
  },
  {
    icon: "emoji_events",
    label: "What competitions match my profile?",
  },
  {
    icon: "sunny",
    label: "How do I apply to summer programs?",
  },
  {
    icon: "location_on",
    label: "What local opportunities exist near me?",
  },
]

export default function OpportunityAdvisorPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your Opportunity Advisor. I can help you discover and learn about competitions, summer programs, internships, scholarships, and more.\n\nAsk me anything — like **\"How do I join DECA?\"**, **\"What research programs should I apply to?\"**, or **\"What opportunities are near me?\"**",
    },
  ])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return

    const userMessage: ChatMessage = { role: "user", content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/ai/opportunity-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.filter(
            (m) => m.role === "user" || m.role === "assistant"
          ),
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
          content:
            "Something went wrong. Please check your connection and try again.",
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

  const handleNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hey! I'm your Opportunity Advisor. I can help you discover and learn about competitions, summer programs, internships, scholarships, and more.\n\nAsk me anything — like **\"How do I join DECA?\"**, **\"What research programs should I apply to?\"**, or **\"What opportunities are near me?\"**",
      },
    ])
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mx-12 -my-10 px-12 pt-10">
      {/* Header */}
      <header className="pb-4 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-xs font-black tracking-[0.25em] text-accent-green uppercase mb-1">
              Ask Anything
            </h1>
            <h2 className="text-3xl font-black tracking-tight text-black font-display">
              Opportunity Advisor.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/60 backdrop-blur-2xl border border-white/40 rounded-xl text-sm font-medium text-subtle-gray hover:bg-white/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              New Chat
            </button>
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
      </header>

      {/* Chat Container */}
      <div className="flex-grow pb-10 overflow-hidden">
        <div className="h-full glass-card rounded-[32px] flex flex-col overflow-hidden relative shadow-2xl">
          {/* Chat Header */}
          <div className="px-10 py-5 border-b border-black/5 flex items-center justify-between shrink-0 bg-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-green/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent-green text-xl" aria-hidden="true">
                  lightbulb
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold">Opportunity Advisor</h3>
                <p className="text-xs text-subtle-gray">
                  Programs, competitions, internships, and more
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-black/5 rounded-2xl">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                smart_toy
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em]">
                AI Advisor
              </span>
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
                    <div className="w-10 h-10 rounded-2xl bg-accent-green text-white flex items-center justify-center shrink-0 shadow-lg">
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">
                        lightbulb
                      </span>
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
                        <span className="material-symbols-outlined text-xl" aria-hidden="true">
                          person
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Sending indicator */}
            {sending && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-2xl bg-accent-green text-white flex items-center justify-center shrink-0 shadow-lg">
                  <span
                    className="material-symbols-outlined text-xl animate-pulse"
                    aria-hidden="true"
                  >
                    lightbulb
                  </span>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-3xl rounded-tl-none px-6 py-4 shadow-sm border border-white/40">
                  <div className="flex items-center gap-2 text-subtle-gray text-sm">
                    <span
                      className="material-symbols-outlined text-[16px] animate-spin"
                      aria-hidden="true"
                    >
                      progress_activity
                    </span>
                    Thinking...
                  </div>
                </div>
              </div>
            )}

            {/* Quick Prompts — only on initial message */}
            {messages.length === 1 && !sending && (
              <div className="pt-2 flex flex-col gap-4">
                <p className="text-xs font-black text-subtle-gray uppercase tracking-[0.2em] px-1">
                  Quick Prompts
                </p>
                <div className="flex flex-wrap gap-3">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => sendMessage(prompt.label)}
                      className="px-5 py-3 rounded-2xl bg-white/60 border border-white hover:bg-white hover:shadow-md transition-all text-sm font-semibold text-charcoal flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    >
                      <span
                        className="material-symbols-outlined text-lg opacity-60 text-accent-green"
                        aria-hidden="true"
                      >
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

          {/* Input */}
          <div className="shrink-0 bg-white/30 backdrop-blur-xl border-t border-black/5">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                  placeholder="Ask about any program, competition, or opportunity..."
                  className="w-full bg-white/80 border border-black/5 rounded-2xl py-4 pl-6 pr-16 focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green/30 transition-all placeholder:text-subtle-gray/60 text-[15px] shadow-sm disabled:opacity-50 focus:outline-none"
                  aria-label="Ask about opportunities"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:scale-[1.05] transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    send
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
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
