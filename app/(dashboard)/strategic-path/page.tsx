"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { StrategicPathway } from "@/lib/ai/prompts/strategic-pathways"
import type { PathwayRoadmap } from "@/lib/ai/prompts/strategic-pathways"

interface CollegeInfo {
  id: string
  name: string
  type: string
  listCategory: string | null
  readinessPercentage: number | null
  acceptanceRate: number | null
}

// Map color theme names to Tailwind classes
const colorMap: Record<
  string,
  { bgLight: string; text: string; bar: string; barMuted: string; border: string }
> = {
  emerald: {
    bgLight: "bg-emerald-500/10",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
    barMuted: "bg-emerald-500/20",
    border: "border-emerald-500",
  },
  blue: {
    bgLight: "bg-blue-500/10",
    text: "text-blue-600",
    bar: "bg-blue-500",
    barMuted: "bg-blue-500/20",
    border: "border-blue-500",
  },
  amber: {
    bgLight: "bg-amber-500/10",
    text: "text-amber-600",
    bar: "bg-amber-500",
    barMuted: "bg-amber-500/20",
    border: "border-amber-500",
  },
  purple: {
    bgLight: "bg-purple-500/10",
    text: "text-purple-600",
    bar: "bg-purple-500",
    barMuted: "bg-purple-500/20",
    border: "border-purple-500",
  },
  rose: {
    bgLight: "bg-rose-500/10",
    text: "text-rose-600",
    bar: "bg-rose-500",
    barMuted: "bg-rose-500/20",
    border: "border-rose-500",
  },
  cyan: {
    bgLight: "bg-cyan-500/10",
    text: "text-cyan-600",
    bar: "bg-cyan-500",
    barMuted: "bg-cyan-500/20",
    border: "border-cyan-500",
  },
}

function getColors(theme: string) {
  return colorMap[theme] || colorMap.blue
}

function getCollegeIcon(type: string) {
  switch (type) {
    case "private":
      return "school"
    case "public":
      return "account_balance"
    case "liberal-arts":
      return "auto_stories"
    default:
      return "domain"
  }
}

function getCategoryBadge(category: string | null) {
  switch (category) {
    case "reach":
      return "bg-rose-500/10 text-rose-600"
    case "target":
      return "bg-blue-500/10 text-blue-600"
    case "safety":
      return "bg-emerald-500/10 text-emerald-600"
    default:
      return "bg-gray-500/10 text-gray-600"
  }
}

const milestoneCategoryIcons: Record<string, string> = {
  academics: "menu_book",
  extracurriculars: "groups",
  research: "science",
  competitions: "emoji_events",
  networking: "handshake",
  portfolio: "work",
  applications: "description",
}

const milestonePriorityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-600",
  high: "bg-amber-500/10 text-amber-700",
  medium: "bg-blue-500/10 text-blue-600",
  low: "bg-gray-500/10 text-gray-600",
}

// Read sessionStorage cache synchronously to avoid re-fetching on navigation
function readCachedPathways(): { pathways: StrategicPathway[]; colleges: CollegeInfo[] } | null {
  if (typeof window === "undefined") return null
  const cached = sessionStorage.getItem("strategicPathways")
  if (!cached) return null
  try {
    const parsed = JSON.parse(cached)
    if (parsed.pathways?.length) return { pathways: parsed.pathways, colleges: parsed.colleges || [] }
  } catch {
    sessionStorage.removeItem("strategicPathways")
  }
  return null
}

function readCachedRoadmap(): { index: number; roadmap: PathwayRoadmap } | null {
  if (typeof window === "undefined") return null
  const cached = sessionStorage.getItem("pathwayRoadmap")
  if (!cached) return null
  try {
    const parsed = JSON.parse(cached)
    if (parsed.roadmap) return { index: parsed.index, roadmap: parsed.roadmap }
  } catch {
    sessionStorage.removeItem("pathwayRoadmap")
  }
  return null
}

export default function StrategicPathPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const roadmapRef = useRef<HTMLDivElement>(null)

  // Initialize from cache synchronously so returning to this page doesn't re-fetch
  const cachedData = readCachedPathways()
  const cachedRoadmap = readCachedRoadmap()

  const [pathways, setPathways] = useState<StrategicPathway[]>(cachedData?.pathways ?? [])
  const [colleges, setColleges] = useState<CollegeInfo[]>(cachedData?.colleges ?? [])
  const [loading, setLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  // Roadmap generation state — also restore from cache
  const [activatedPath, setActivatedPath] = useState<number | null>(cachedRoadmap?.index ?? null)
  const [roadmap, setRoadmap] = useState<PathwayRoadmap | null>(cachedRoadmap?.roadmap ?? null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState<string | null>(null)

  const loadPathways = useCallback(async (skipCache = false) => {
    if (!skipCache) {
      const cached = sessionStorage.getItem("strategicPathways")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setPathways(parsed.pathways || [])
          setColleges(parsed.colleges || [])
          setLoading(false)
          return
        } catch {
          sessionStorage.removeItem("strategicPathways")
        }
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/strategic-pathways")
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to load pathways")
      }

      const data = await response.json()
      setPathways(data.pathways || [])
      setColleges(data.colleges || [])

      sessionStorage.setItem(
        "strategicPathways",
        JSON.stringify({
          pathways: data.pathways,
          colleges: data.colleges,
        })
      )
    } catch (err) {
      console.error("Error loading strategic pathways:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch if not already loaded from cache
    if (status === "authenticated" && pathways.length === 0 && !error) {
      loadPathways()
    }
  }, [status, loadPathways, pathways.length, error])

  const handleRegenerate = async () => {
    setRegenerating(true)
    sessionStorage.removeItem("strategicPathways")
    sessionStorage.removeItem("pathwayRoadmap")
    setActivatedPath(null)
    setRoadmap(null)
    setRoadmapError(null)
    await loadPathways(true)
    setRegenerating(false)
  }

  const handleStartPath = async (index: number) => {
    const pathway = pathways[index]
    if (!pathway) return

    // Check if we already have a cached roadmap for this exact pathway index
    const cachedRM = sessionStorage.getItem("pathwayRoadmap")
    if (cachedRM) {
      try {
        const parsed = JSON.parse(cachedRM)
        if (parsed.index === index && parsed.roadmap) {
          setActivatedPath(index)
          setRoadmap(parsed.roadmap)
          setRoadmapError(null)
          setTimeout(() => {
            roadmapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 200)
          return
        }
      } catch {
        sessionStorage.removeItem("pathwayRoadmap")
      }
    }

    setActivatedPath(index)
    setRoadmap(null)
    setRoadmapError(null)
    setRoadmapLoading(true)

    // Scroll to roadmap area after a brief delay
    setTimeout(() => {
      roadmapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 200)

    try {
      const response = await fetch("/api/ai/strategic-pathways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway }),
      })

      if (!response.ok) {
        let errorMsg = "Failed to generate roadmap"
        try {
          const errData = await response.json()
          errorMsg = errData.details || errData.error || errorMsg
        } catch {
          // response body wasn't JSON
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap)
        sessionStorage.setItem(
          "pathwayRoadmap",
          JSON.stringify({ index, roadmap: data.roadmap })
        )
      } else {
        throw new Error("No roadmap data returned from server")
      }
    } catch (err) {
      console.error("Error generating pathway roadmap:", err)
      setRoadmapError(
        err instanceof Error ? err.message : "Failed to generate roadmap"
      )
    } finally {
      setRoadmapLoading(false)
    }
  }

  const handleBackToPathways = () => {
    setActivatedPath(null)
    setRoadmap(null)
    setRoadmapError(null)
    sessionStorage.removeItem("pathwayRoadmap")
  }

  // ── Loading skeleton ──
  if (status === "loading" || loading) {
    return (
      <>
        <div className="mb-12">
          <div className="h-4 w-32 bg-black/5 rounded-full mb-3 animate-pulse" />
          <div className="h-10 w-96 bg-black/5 rounded-2xl mb-2 animate-pulse" />
          <div className="h-5 w-80 bg-black/5 rounded-xl animate-pulse" />
        </div>
        <div className="mb-8">
          <div className="h-3 w-48 bg-black/5 rounded-full mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8 animate-pulse"
              >
                <div className="flex justify-between mb-6">
                  <div className="w-14 h-14 bg-black/5 rounded-2xl" />
                  <div className="text-right">
                    <div className="h-2 w-16 bg-black/5 rounded-full mb-2" />
                    <div className="h-6 w-10 bg-black/5 rounded" />
                  </div>
                </div>
                <div className="h-7 w-40 bg-black/5 rounded-xl mb-2" />
                <div className="h-4 w-full bg-black/5 rounded mb-1" />
                <div className="h-4 w-2/3 bg-black/5 rounded mb-8" />
                <div className="space-y-3 mb-8">
                  <div className="h-4 w-48 bg-black/5 rounded" />
                  <div className="h-4 w-44 bg-black/5 rounded" />
                </div>
                <div className="h-12 w-full bg-black/5 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-red-400 text-4xl" aria-hidden="true">
              error_outline
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">Unable to Load Pathways</h2>
          <p className="text-subtle-gray text-sm mb-6">{error}</p>
          <button
            onClick={() => loadPathways(true)}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Grab active pathway colors
  const activePathway =
    activatedPath !== null ? pathways[activatedPath] : null
  const activeColors = activePathway ? getColors(activePathway.colorTheme) : null

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold tracking-widest uppercase">
              AI-Powered Planning
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-charcoal mb-2 font-display">
            Strategic AI Pathways.
          </h1>
          <p className="text-subtle-gray font-display">
            Select a recommended direction to pivot your college roadmap and
            unlock new goals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRegenerate}
            disabled={regenerating || roadmapLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/60 backdrop-blur-2xl border border-white/40 rounded-xl text-sm font-medium text-subtle-gray hover:bg-white/80 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${regenerating ? "animate-spin" : ""}`}
              aria-hidden="true"
            >
              refresh
            </span>
            {regenerating ? "Regenerating..." : "Refresh"}
          </button>
          {session?.user?.image && (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img
                alt={session.user?.name || "Profile"}
                className="w-full h-full object-cover"
                src={session.user.image}
              />
            </div>
          )}
        </div>
      </header>

      {/* ── Recommended Directions ── */}
      <div className="mb-14">
        <h2 className="text-xs font-bold text-subtle-gray uppercase tracking-[0.2em] mb-8">
          Recommended Directions
        </h2>

        {pathways.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-blue-400 text-4xl" aria-hidden="true">
                explore
              </span>
            </div>
            <h3 className="text-xl font-bold mb-2">No Pathways Yet</h3>
            <p className="text-subtle-gray text-sm mb-6">
              Complete your profile to get personalized strategic pathway
              recommendations.
            </p>
            <button
              onClick={() => router.push("/onboarding")}
              className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pathways.map((pathway, index) => {
              const colors = getColors(pathway.colorTheme)
              const isActive = activatedPath === index

              return (
                <div
                  key={index}
                  className={`bg-white/60 backdrop-blur-2xl border rounded-[32px] p-8 flex flex-col h-full transition-all duration-300 ${
                    isActive
                      ? `border-2 ${colors.border} shadow-[0_20px_48px_rgba(0,0,0,0.08)]`
                      : "border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.02)] hover:bg-white/80 hover:shadow-[0_20px_48px_rgba(0,0,0,0.06)] hover:-translate-y-1"
                  }`}
                >
                  {/* Icon + Confidence */}
                  <div className="mb-6 flex justify-between items-start">
                    <div
                      className={`w-14 h-14 rounded-2xl ${colors.bgLight} flex items-center justify-center`}
                    >
                      <span
                        className={`material-symbols-outlined ${colors.text} text-3xl`}
                        aria-hidden="true"
                      >
                        {pathway.icon}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest">
                        Confidence
                      </p>
                      <p className={`text-lg font-black ${colors.text}`}>
                        {pathway.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Title + Description */}
                  <h3 className="text-2xl font-bold mb-2">{pathway.title}</h3>
                  <p className="text-sm text-subtle-gray mb-6 leading-relaxed">
                    {pathway.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm text-blue-500" aria-hidden="true">
                        school
                      </span>
                      <span className="text-sm font-medium">
                        {pathway.relatedMajors.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm text-purple-500" aria-hidden="true">
                        star
                      </span>
                      <span className="text-sm font-medium">
                        {pathway.targetTier}
                      </span>
                    </div>

                    {/* Key Strengths */}
                    {pathway.keyStrengths && pathway.keyStrengths.length > 0 && (
                      <div className="pt-3 border-t border-black/5">
                        <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-2">
                          Your Strengths
                        </p>
                        <ul className="space-y-1.5">
                          {pathway.keyStrengths.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-subtle-gray"
                            >
                              <span
                                className={`material-symbols-outlined text-sm ${colors.text} mt-0.5`}
                                aria-hidden="true"
                              >
                                check_circle
                              </span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Progress indicator */}
                    <div className="pt-3 border-t border-black/5" aria-hidden="true">
                      <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-3">
                        Core Roadmap
                      </p>
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((seg) => (
                          <div
                            key={seg}
                            className={`h-1.5 flex-grow rounded-full ${
                              isActive && roadmap
                                ? seg === 0
                                  ? colors.bar
                                  : seg === 1
                                    ? colors.bar
                                    : colors.barMuted
                                : seg === 0
                                  ? colors.bar
                                  : colors.barMuted
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {isActive ? (
                    <button
                      className={`w-full py-4 rounded-2xl ${colors.bar} text-white font-bold text-sm flex items-center justify-center gap-2 cursor-default`}
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        check_circle
                      </span>
                      Path Activated
                    </button>
                  ) : index === 0 && activatedPath === null ? (
                    <button
                      onClick={() => handleStartPath(index)}
                      disabled={roadmapLoading}
                      className="w-full py-4 rounded-2xl bg-black text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    >
                      Start This Path
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartPath(index)}
                      disabled={roadmapLoading}
                      className="w-full py-4 rounded-2xl border border-black/10 hover:bg-black/5 font-bold text-sm transition-all disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    >
                      Start This Path
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detailed Pathway Roadmap ── */}
      <div ref={roadmapRef}>
        {/* Loading state */}
        {roadmapLoading && activePathway && activeColors && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-xl ${activeColors.bgLight} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${activeColors.text} text-xl animate-pulse`} aria-hidden="true">
                  {activePathway.icon}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  Building your {activePathway.title} roadmap...
                </h2>
                <p className="text-sm text-subtle-gray">
                  AI is creating a detailed, personalized plan based on your profile.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8 animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-black/5 rounded-full" />
                    <div>
                      <div className="h-5 w-48 bg-black/5 rounded mb-1" />
                      <div className="h-3 w-32 bg-black/5 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-black/5 rounded mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-black/5 rounded-xl shrink-0" />
                        <div className="flex-grow">
                          <div className="h-4 w-3/4 bg-black/5 rounded mb-1" />
                          <div className="h-3 w-full bg-black/5 rounded mb-1" />
                          <div className="h-3 w-2/3 bg-black/5 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Roadmap error */}
        {roadmapError && activatedPath !== null && (
          <section className="mb-14">
            <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-400 text-3xl" aria-hidden="true">
                  error_outline
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">
                Couldn&apos;t Generate Roadmap
              </h3>
              <p className="text-sm text-subtle-gray mb-6">{roadmapError}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleStartPath(activatedPath)}
                  className="px-5 py-2.5 bg-black text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  Try Again
                </button>
                <button
                  onClick={handleBackToPathways}
                  className="px-5 py-2.5 border border-black/10 rounded-xl font-semibold text-sm hover:bg-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  Back to Pathways
                </button>
              </div>
            </div>
          </section>
        )}

        {/* The actual detailed roadmap */}
        {roadmap && activePathway && activeColors && !roadmapLoading && (
          <section className="mb-14">
            {/* Roadmap header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${activeColors.bgLight} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${activeColors.text} text-xl`} aria-hidden="true">
                    {activePathway.icon}
                  </span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-subtle-gray uppercase tracking-[0.2em]">
                    Your Roadmap
                  </h2>
                  <p className="text-lg font-bold">{roadmap.pathwayTitle}</p>
                </div>
              </div>
              <button
                onClick={handleBackToPathways}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-subtle-gray hover:bg-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_back
                </span>
                Choose Different Path
              </button>
            </div>

            {/* Summary */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-6 mb-8">
              <p className="text-sm text-subtle-gray leading-relaxed">
                {roadmap.summary}
              </p>
            </div>

            {/* Phases */}
            <div className="space-y-8">
              {roadmap.phases.map((phase, phaseIdx) => (
                <div
                  key={phaseIdx}
                  className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-8"
                >
                  {/* Phase header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`w-10 h-10 rounded-full ${activeColors.bar} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                    >
                      {phaseIdx + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold">{phase.title}</h3>
                        <span className="text-xs font-medium text-subtle-gray bg-black/5 px-2.5 py-1 rounded-full">
                          {phase.timeframe}
                        </span>
                      </div>
                      <p className="text-sm text-subtle-gray mt-1 leading-relaxed">
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-4 ml-14">
                    {phase.milestones.map((milestone, mIdx) => (
                      <div
                        key={mIdx}
                        className="border border-black/5 rounded-2xl p-5 hover:bg-white/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Category icon */}
                          <div
                            className={`w-10 h-10 rounded-xl ${activeColors.bgLight} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            <span
                              className={`material-symbols-outlined ${activeColors.text} text-xl`}
                              aria-hidden="true"
                            >
                              {milestoneCategoryIcons[milestone.category] ||
                                "task_alt"}
                            </span>
                          </div>
                          <div className="flex-grow min-w-0">
                            {/* Title + badges */}
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <h4 className="text-sm font-bold leading-snug">
                                {milestone.title}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    milestonePriorityStyles[
                                      milestone.priority
                                    ] || milestonePriorityStyles.medium
                                  }`}
                                >
                                  {milestone.priority}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-subtle-gray leading-relaxed mb-2">
                              {milestone.description}
                            </p>

                            {/* Category + resource */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-medium text-subtle-gray bg-black/5 px-2 py-0.5 rounded capitalize">
                                {milestone.category.replace("_", " ")}
                              </span>
                              {milestone.resource && (
                                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                  <span className="material-symbols-outlined text-sm" aria-hidden="true">
                                    link
                                  </span>
                                  {milestone.resource}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Your Target Colleges ── */}
      {colleges.length > 0 && (
        <section className="pb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold text-subtle-gray uppercase tracking-[0.2em]">
              Your Target Colleges
            </h2>
            <button
              onClick={() => router.push("/colleges")}
              className="text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 rounded"
            >
              Manage college list{" "}
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {colleges.slice(0, 8).map((college) => (
              <div
                key={college.id}
                className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.02)] rounded-[32px] p-6 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-subtle-gray text-xl"
                    aria-hidden="true"
                  >
                    {getCollegeIcon(college.type)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{college.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {college.listCategory && (
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getCategoryBadge(college.listCategory)}`}
                      >
                        {college.listCategory}
                      </span>
                    )}
                    {college.acceptanceRate !== null && (
                      <span className="text-xs text-subtle-gray">
                        {college.acceptanceRate}% rate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
