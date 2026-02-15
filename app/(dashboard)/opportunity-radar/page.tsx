"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useMemo, useCallback } from "react"

interface Opportunity {
  title: string
  description: string
  category: string
  type: string
  matchPercentage: number
  deadline: string
  icon: string
  iconColor: string
  whyMatch: string
  url: string | null
  difficulty: string
  scope?: string // "local" | "regional" | "national" | "international"
}

const ICON_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
}

const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  STEM: { bg: "bg-indigo-500/10", text: "text-indigo-600" },
  Humanities: { bg: "bg-rose-500/10", text: "text-rose-600" },
  Leadership: { bg: "bg-cyan-500/10", text: "text-cyan-600" },
  Arts: { bg: "bg-rose-500/10", text: "text-rose-600" },
  Business: { bg: "bg-amber-500/10", text: "text-amber-600" },
  Service: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  Research: { bg: "bg-blue-500/10", text: "text-blue-600" },
}

const CATEGORIES = ["All Radar", "STEM", "Humanities", "Leadership", "Arts", "Business", "Service", "Research"]

export default function OpportunityRadarPage() {
  const { data: session } = useSession()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Radar")
  const [activeScope, setActiveScope] = useState("All")
  const [bookmarkedTitles, setBookmarkedTitles] = useState<Set<string>>(new Set())
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  const CACHE_KEY = "opportunity-radar-cache"
  const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("opportunity-radar-bookmarks")
      if (saved) {
        setBookmarkedTitles(new Set(JSON.parse(saved)))
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  useEffect(() => {
    loadOpportunities()
  }, [])

  const loadOpportunities = () => {
    // Try loading from sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && data.length > 0) {
          setOpportunities(data)
          setLoading(false)
          return
        }
      }
    } catch {
      // Ignore cache read errors
    }
    // No valid cache — fetch from API
    fetchOpportunities()
  }

  const fetchOpportunities = async (forceRefresh = false) => {
    try {
      setError(false)
      setLoading(true)
      const url = forceRefresh
        ? "/api/ai/opportunity-radar?refresh=1"
        : "/api/ai/opportunity-radar"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const opps = data.opportunities || []
        setOpportunities(opps)
        // Save to sessionStorage cache
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: opps, timestamp: Date.now() })
          )
        } catch {
          // Ignore cache write errors
        }
      } else {
        setError(true)
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleBookmark = useCallback((title: string) => {
    setBookmarkedTitles((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      try {
        localStorage.setItem("opportunity-radar-bookmarks", JSON.stringify([...next]))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }, [])

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities

    // Filter by category
    if (activeCategory !== "All Radar") {
      filtered = filtered.filter((o) => o.category === activeCategory)
    }

    // Filter by scope
    if (activeScope !== "All") {
      const scopeKey = activeScope.toLowerCase()
      if (scopeKey === "local") {
        filtered = filtered.filter((o) => o.scope === "local" || o.scope === "regional")
      } else {
        filtered = filtered.filter((o) => o.scope === scopeKey)
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(query) ||
          o.description.toLowerCase().includes(query) ||
          o.category.toLowerCase().includes(query) ||
          o.type.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [opportunities, activeCategory, activeScope, searchQuery])

  // Extract dynamic interest-based filter chips from actual opportunities
  const interestChips = useMemo(() => {
    const types = new Set<string>()
    opportunities.forEach((o) => {
      types.add(o.type)
    })
    return [...types].slice(0, 4).map((t) => t.charAt(0).toUpperCase() + t.slice(1))
  }, [opportunities])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse" aria-hidden="true">
              radar
            </span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Scanning opportunities for you...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-card rounded-[32px] p-10">
          <span className="material-symbols-outlined text-orange-400 text-4xl mb-4 block" aria-hidden="true">
            cloud_off
          </span>
          <h2 className="text-lg font-black font-display mb-2">Unable to load opportunities</h2>
          <p className="text-subtle-gray text-sm mb-6">Something went wrong. Please try again.</p>
          <button
            onClick={() => fetchOpportunities(false)}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.25em] text-accent-green uppercase mb-1.5 block">
            Discover & Explore
          </span>
          <h1 className="text-4xl font-black tracking-tight text-black font-display leading-tight">
            Opportunity Radar.
          </h1>
          <p className="text-subtle-gray text-base font-medium font-display">
            Personalized extracurriculars and academic milestones for your profile.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchOpportunities(true)}
            className="px-4 py-2.5 glass-card rounded-xl flex items-center gap-2 hover:bg-white/80 transition-all text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            title="Generate fresh opportunities (uses AI)"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              refresh
            </span>
            Refresh
          </button>
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
            {session?.user?.image ? (
              <img
                alt={`${session.user.name || "User"}'s profile`}
                className="w-full h-full object-cover"
                src={session.user.image}
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-lg" aria-hidden="true">
                  {(session?.user?.name || "U")[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="mb-10 space-y-6">
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-subtle-gray" aria-hidden="true">
            search
          </span>
          <input
            className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/40 focus:border-black/20 focus:ring-0 focus:outline-none rounded-2xl backdrop-blur-md text-sm font-medium placeholder:text-subtle-gray transition-all focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            placeholder="Search competitions, internships, or programs..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-subtle-gray mr-2">Category:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 ${
                activeCategory === cat
                  ? "bg-black text-white border-black"
                  : "border-black/5 bg-white/40 hover:bg-white/80"
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="h-4 w-px bg-black/10 mx-2" aria-hidden="true"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-subtle-gray mr-2">Scope:</span>
          {["All", "Local", "National", "International"].map((scope) => (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 ${
                activeScope === scope
                  ? "bg-black text-white border-black"
                  : "border-black/5 bg-white/40 hover:bg-white/80"
              }`}
            >
              {scope === "Local" ? (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">location_on</span>
                  {scope}
                </span>
              ) : scope}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {searchQuery || activeCategory !== "All Radar" || activeScope !== "All" ? (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-subtle-gray font-medium">
            {filteredOpportunities.length} {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"} found
          </p>
          {(searchQuery || activeCategory !== "All Radar" || activeScope !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setActiveCategory("All Radar")
                setActiveScope("All")
              }}
              className="text-sm font-bold text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      {/* Opportunity Cards Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-subtle-gray mb-4 block" aria-hidden="true">
            search_off
          </span>
          <h2 className="text-lg font-black font-display mb-2">No opportunities found</h2>
          <p className="text-subtle-gray text-sm mb-6">Try adjusting your search or filters.</p>
          <button
            onClick={() => {
              setSearchQuery("")
              setActiveCategory("All Radar")
            }}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            Show All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOpportunities.map((opp, index) => {
            const iconColors = ICON_COLOR_MAP[opp.iconColor] || ICON_COLOR_MAP.indigo
            const catColors = CATEGORY_COLOR_MAP[opp.category] || CATEGORY_COLOR_MAP.STEM
            const isBookmarked = bookmarkedTitles.has(opp.title)

            return (
              <div
                key={`${opp.title}-${index}`}
                className="glass-card rounded-[32px] p-8 flex flex-col group hover:translate-y-[-4px] transition-all duration-300"
              >
                {/* Top row: icon + bookmark */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${iconColors.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${iconColors.text} text-3xl`} aria-hidden="true">
                      {opp.icon}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleBookmark(opp.title)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    aria-label={isBookmarked ? `Remove ${opp.title} from bookmarks` : `Bookmark ${opp.title}`}
                  >
                    <span
                      className={`material-symbols-outlined ${isBookmarked ? "text-black" : "text-subtle-gray"}`}
                      style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      bookmark
                    </span>
                  </button>
                </div>

                {/* Tags */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded ${catColors.bg} ${catColors.text} text-[10px] font-bold uppercase tracking-wider`}>
                      {opp.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                      {opp.matchPercentage}% Match
                    </span>
                    {(opp.scope === "local" || opp.scope === "regional") && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]" aria-hidden="true">location_on</span>
                        {opp.scope}
                      </span>
                    )}
                    {opp.difficulty && (
                      <span className="px-2 py-0.5 rounded bg-black/5 text-subtle-gray text-[10px] font-bold uppercase tracking-wider">
                        {opp.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Title & description */}
                  <h3 className="text-xl font-bold mb-2 leading-tight">{opp.title}</h3>
                  <p className="text-sm text-subtle-gray line-clamp-2 mb-4">{opp.description}</p>

                  {/* Why match */}
                  <div className="flex items-start gap-2 mb-6">
                    <span className="material-symbols-outlined text-accent-green text-[16px] mt-0.5 shrink-0" aria-hidden="true">
                      auto_awesome
                    </span>
                    <p className="text-xs text-subtle-gray leading-relaxed">{opp.whyMatch}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-subtle-gray uppercase tracking-widest">Deadline</p>
                    <p className="text-sm font-bold">{opp.deadline}</p>
                  </div>
                  {opp.url ? (
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    >
                      Learn More
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">open_in_new</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      className="px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                    >
                      View Detail
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOpportunity && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setSelectedOpportunity(null)}
        >
          <div
            className="bg-white rounded-[32px] p-10 max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className={`w-14 h-14 rounded-2xl ${
                  ICON_COLOR_MAP[selectedOpportunity.iconColor]?.bg || "bg-indigo-500/10"
                } flex items-center justify-center`}
              >
                <span
                  className={`material-symbols-outlined ${
                    ICON_COLOR_MAP[selectedOpportunity.iconColor]?.text || "text-indigo-500"
                  } text-3xl`}
                  aria-hidden="true"
                >
                  {selectedOpportunity.icon}
                </span>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                aria-label="Close detail modal"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded ${
                  CATEGORY_COLOR_MAP[selectedOpportunity.category]?.bg || "bg-indigo-500/10"
                } ${
                  CATEGORY_COLOR_MAP[selectedOpportunity.category]?.text || "text-indigo-600"
                } text-[10px] font-bold uppercase tracking-wider`}
              >
                {selectedOpportunity.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                {selectedOpportunity.matchPercentage}% Match
              </span>
              <span className="px-2 py-0.5 rounded bg-black/5 text-subtle-gray text-[10px] font-bold uppercase tracking-wider">
                {selectedOpportunity.type}
              </span>
              {(selectedOpportunity.scope === "local" || selectedOpportunity.scope === "regional") && (
                <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]" aria-hidden="true">location_on</span>
                  {selectedOpportunity.scope}
                </span>
              )}
              {selectedOpportunity.difficulty && (
                <span className="px-2 py-0.5 rounded bg-black/5 text-subtle-gray text-[10px] font-bold uppercase tracking-wider">
                  {selectedOpportunity.difficulty}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black font-display mb-3">{selectedOpportunity.title}</h2>
            <p className="text-sm text-subtle-gray mb-6 leading-relaxed">{selectedOpportunity.description}</p>

            <div className="flex items-start gap-2 mb-6 p-4 bg-accent-green/5 rounded-xl">
              <span className="material-symbols-outlined text-accent-green text-[18px] mt-0.5" aria-hidden="true">
                auto_awesome
              </span>
              <div>
                <p className="text-xs font-bold text-black mb-1">Why this matches you</p>
                <p className="text-sm text-subtle-gray">{selectedOpportunity.whyMatch}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              <div>
                <p className="text-[10px] font-bold text-subtle-gray uppercase tracking-widest">Deadline</p>
                <p className="text-sm font-bold">{selectedOpportunity.deadline}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleBookmark(selectedOpportunity.title)}
                  className="px-4 py-2 border border-black/10 rounded-xl text-sm font-bold hover:bg-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  {bookmarkedTitles.has(selectedOpportunity.title) ? "Bookmarked" : "Bookmark"}
                </button>
                {selectedOpportunity.url && (
                  <a
                    href={selectedOpportunity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                  >
                    Visit Website
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
