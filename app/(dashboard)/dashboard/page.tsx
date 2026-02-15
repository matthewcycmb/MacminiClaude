"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { useDashboard } from "@/lib/hooks/use-dashboard"

const categoryIcons: Record<string, { icon: string; color: string; bg: string }> = {
  testing: { icon: "quiz", color: "text-accent-green", bg: "bg-accent-green/10" },
  essays: { icon: "description", color: "text-accent-green", bg: "bg-accent-green/10" },
  research: { icon: "science", color: "text-blue-500", bg: "bg-blue-500/10" },
  applications: { icon: "assignment", color: "text-purple-500", bg: "bg-purple-500/10" },
  financial_aid: { icon: "payments", color: "text-amber-500", bg: "bg-amber-500/10" },
  extracurriculars: { icon: "event_repeat", color: "text-purple-500", bg: "bg-purple-500/10" },
  recommendations: { icon: "person", color: "text-blue-500", bg: "bg-blue-500/10" },
  visits: { icon: "location_on", color: "text-accent-green", bg: "bg-accent-green/10" },
}

function getRelativeDueDate(dateStr: string): string {
  const dueDate = new Date(dateStr)
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "Overdue"
  if (diffDays === 0) return "Due today"
  if (diffDays === 1) return "Due tomorrow"
  if (diffDays <= 7) return `Due in ${diffDays} days`
  return `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

function CollegeLogo({ websiteUrl, name }: { websiteUrl: string | null; name: string }) {
  const [imgError, setImgError] = useState(false)

  let logoUrl: string | null = null
  if (websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname.replace(/^www\./, "")
      logoUrl = `https://logo.clearbit.com/${domain}`
    } catch {
      logoUrl = null
    }
  }

  if (!logoUrl || imgError) {
    const initial = (name.charAt(0) || "U").toUpperCase()
    return (
      <div className="w-20 h-20 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-3xl font-black text-charcoal/30 font-display">{initial}</span>
      </div>
    )
  }

  return (
    <div className="w-20 h-20 rounded-2xl bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="w-14 h-14 object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

interface AdmissionReview {
  summary: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data: dashboard, isLoading: loading, isError: error, refetch } = useDashboard()

  // Admission Officer Review state
  const [review, setReview] = useState<AdmissionReview | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [reviewCached, setReviewCached] = useState(false)

  const fetchReview = async () => {
    setReviewLoading(true)
    setReviewError("")
    try {
      const res = await fetch("/api/ai/admission-review")
      const data = await res.json()
      if (!res.ok) {
        setReviewError(data.error || "Failed to generate review")
        return
      }
      setReview(data.review)
      setReviewCached(data.cached)
    } catch {
      setReviewError("Something went wrong. Please try again.")
    } finally {
      setReviewLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse" aria-hidden="true">rocket_launch</span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-card rounded-[32px] p-10">
          <span className="material-symbols-outlined text-orange-400 text-4xl mb-4 block" aria-hidden="true">cloud_off</span>
          <h2 className="text-lg font-black font-display mb-2">Unable to load dashboard</h2>
          <p className="text-subtle-gray text-sm mb-6">Something went wrong. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const userName = dashboard?.user?.name || session?.user?.name || "Student"
  const firstName = userName.split(" ")[0]
  const readiness = dashboard?.stats?.readinessPercentage || 0
  const readinessDelta = dashboard?.stats?.readinessDelta || 0
  const profileRank = dashboard?.stats?.profileRank || "B"
  const competitiveness = dashboard?.stats?.competitivenessPercentile || "Building"
  const narrativeTheme = dashboard?.stats?.narrativeTheme || "Academic Excellence"
  const narrativeDescription = dashboard?.stats?.narrativeDescription || ""
  const impactHours = dashboard?.stats?.impactHours || 0
  const targetSchools = dashboard?.stats?.targetSchools || 0
  const gpa = dashboard?.profile?.gpa
  const gpaScale = dashboard?.profile?.gpaScale
  const graduationYear = dashboard?.profile?.graduationYear
  const nextMoves = dashboard?.nextMoves || []
  const collegeInsights = dashboard?.collegeInsights || []
  const userImage = dashboard?.user?.image || session?.user?.image

  const subtitle =
    readiness >= 80
      ? "Your path to Tier 1 schools is currently optimized."
      : readiness >= 60
        ? "You're making strong progress towards competitive schools."
        : readiness >= 40
          ? "Building momentum. Focus on your next moves."
          : "Let's get started on your college journey."

  const gpaLabel = gpaScale === 5.0 ? "Weighted GPA" : "Unweighted GPA"

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-accent-green uppercase mb-2 block">
            Dashboard Overview
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black mb-1 font-display">
            Welcome, {firstName}.
          </h1>
          <p className="text-subtle-gray text-base sm:text-lg font-medium">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {graduationYear && (
            <div className="text-right mr-4">
              <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest">Class of</p>
              <p className="text-lg font-black leading-none">{graduationYear}</p>
            </div>
          )}
          {userImage && (
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0">
              <img alt={`${firstName}'s profile photo`} className="w-full h-full object-cover" src={userImage} referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      </header>

      {/* Current Direction Card */}
      <section className="glass-card rounded-[40px] p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-accent-green/5 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-black uppercase tracking-wider">
                Current Direction
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-3 font-display">{narrativeTheme}</h2>
            <p className="text-charcoal/70 leading-relaxed font-medium">{narrativeDescription}</p>
          </div>
          <div className="flex gap-4">
            <div className="p-6 rounded-[32px] bg-white border border-black/5 flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-3xl font-black mb-1 text-black">{profileRank}</span>
              <span className="text-xs font-bold text-subtle-gray uppercase tracking-widest">Profile Rank</span>
            </div>
            <div className="p-6 rounded-[32px] bg-white border border-black/5 flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-3xl font-black mb-1 text-black">{competitiveness}</span>
              <span className="text-xs font-bold text-subtle-gray uppercase tracking-widest">Competitiveness</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized College Insights */}
      {collegeInsights.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6 px-4">
            <h3 className="text-xl font-black tracking-tight font-display">Personalized College Insights</h3>
            <Link
              href="/colleges"
              className="text-sm font-bold text-black border-b-2 border-black/10 hover:border-black transition-all pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              Explore All Matches
            </Link>
          </div>
          <div className="space-y-4">
            {collegeInsights.map((college) => (
              <Link
                key={college.id}
                href="/colleges"
                className="glass-card rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 group cursor-pointer hover:border-black/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                <CollegeLogo websiteUrl={college.websiteUrl} name={college.name} />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-lg sm:text-xl font-black font-display tracking-tight">
                      {college.shortName || college.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${
                        college.category === "reach"
                          ? "bg-accent-green/10 text-accent-green"
                          : college.category === "target"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {college.category}
                    </span>
                  </div>
                  <p className="text-subtle-gray text-sm leading-relaxed max-w-2xl">
                    <span className="text-black font-bold">AI Insight:</span>{" "}
                    {college.aiInsight}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 text-right shrink-0 sm:pr-4 sm:border-l border-black/5 sm:pl-8">
                  <p className="text-xs font-black text-subtle-gray uppercase tracking-widest sm:mb-1">Fit Score</p>
                  <p className="text-2xl sm:text-3xl font-black text-accent-green font-display">{college.fitScore}%</p>
                </div>
                <span className="material-symbols-outlined text-gray-300 group-hover:text-black transition-colors hidden sm:block" aria-hidden="true">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Admission Officer Review */}
      <section className="glass-card rounded-[40px] p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]" aria-hidden="true">
                person_check
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight font-display">Officer&apos;s Perspective</h3>
              <p className="text-xs text-subtle-gray">What a 20-year admission officer would say</p>
            </div>
          </div>
          {review && (
            <button
              onClick={fetchReview}
              disabled={reviewLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-subtle-gray hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 rounded-lg px-3 py-1.5"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>
              Refresh
            </button>
          )}
        </div>

        {!review && !reviewLoading && !reviewError && (
          <div className="text-center py-8">
            <p className="text-subtle-gray text-sm mb-4">
              Get an honest assessment of your application from an AI admission officer&apos;s perspective.
            </p>
            <button
              onClick={fetchReview}
              disabled={reviewLoading}
              className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">auto_awesome</span>
                Get Officer Review
              </span>
            </button>
          </div>
        )}

        {reviewLoading && (
          <div className="py-8 space-y-4 animate-pulse" role="status" aria-live="polite">
            <div className="h-4 bg-black/5 rounded-full w-3/4"></div>
            <div className="h-4 bg-black/5 rounded-full w-full"></div>
            <div className="h-4 bg-black/5 rounded-full w-2/3"></div>
            <p className="text-subtle-gray text-xs text-center mt-4">Analyzing your profile...</p>
          </div>
        )}

        {reviewError && (
          <div className="py-4 text-center">
            <p className="text-red-500 text-sm mb-3">{reviewError}</p>
            <button
              onClick={fetchReview}
              className="text-sm font-bold text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 rounded"
            >
              Try again
            </button>
          </div>
        )}

        {review && !reviewLoading && (
          <div className="space-y-6">
            {/* Summary */}
            <p className="text-charcoal/80 leading-relaxed font-medium text-sm italic border-l-2 border-black/10 pl-4">
              &ldquo;{review.summary}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths */}
              <div className="p-5 rounded-[24px] bg-emerald-50/50 border border-emerald-200/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]" aria-hidden="true">check_circle</span>
                  <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wider">Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-900/80 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-5 rounded-[24px] bg-amber-50/50 border border-amber-200/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]" aria-hidden="true">warning</span>
                  <h4 className="text-sm font-black text-amber-700 uppercase tracking-wider">Weaknesses</h4>
                </div>
                <ul className="space-y-2">
                  {review.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-amber-900/80 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* How to Improve */}
              <div className="p-5 rounded-[24px] bg-blue-50/50 border border-blue-200/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]" aria-hidden="true">lightbulb</span>
                  <h4 className="text-sm font-black text-blue-700 uppercase tracking-wider">How to Improve</h4>
                </div>
                <ul className="space-y-2">
                  {review.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-blue-900/80 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {reviewCached && (
              <p className="text-xs text-subtle-gray text-center">
                Cached review — click Refresh for an updated assessment.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Admission Readiness */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-card rounded-[40px] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black tracking-tight font-display">Admission Readiness</h4>
              <span className="material-symbols-outlined text-accent-green" aria-hidden="true">verified</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black font-display">{readiness}%</span>
              {readinessDelta > 0 && (
                <span className="text-accent-green font-bold text-sm">+{readinessDelta}% this month</span>
              )}
            </div>
            <p className="text-subtle-gray text-sm font-medium">
              {readiness >= 80
                ? "Your profile is highly competitive. Keep going."
                : readiness >= 50
                  ? "Good progress. Complete your next moves to keep climbing."
                  : "Let's build your profile. Start with the tasks below."}
            </p>
          </div>
          <div className="mt-8 flex gap-2">
            <div
              className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Admission readiness: ${readiness} percent`}
            >
              <div
                className="h-full bg-accent-green rounded-full transition-all duration-1000"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Next 3 Moves */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 glass-card rounded-[40px] p-8">
          <h4 className="text-lg font-black tracking-tight mb-6 font-display">Next 3 Moves</h4>
          <div className="space-y-4">
            {nextMoves.length > 0 ? (
              nextMoves.map((task) => {
                const catInfo = categoryIcons[task.category] || {
                  icon: "task_alt",
                  color: "text-accent-green",
                  bg: "bg-accent-green/10",
                }
                const dueDateLabel = task.dueDate
                  ? getRelativeDueDate(task.dueDate)
                  : task.category.charAt(0).toUpperCase() + task.category.slice(1).replace("_", " ")
                const impactLabel =
                  task.priority === "high" || task.priority === "urgent"
                    ? "High Impact"
                    : task.isQuickWin
                      ? "Quick Win"
                      : "Strategy"

                return (
                  <Link
                    href="/roadmap"
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 group cursor-pointer hover:border-black/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                  >
                    <div className={`w-10 h-10 rounded-xl ${catInfo.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${catInfo.color} text-[20px]`} aria-hidden="true">
                        {catInfo.icon}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-black">{task.title}</p>
                      <p className="text-xs font-medium text-subtle-gray">
                        {dueDateLabel} &bull; {impactLabel}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-300 group-hover:text-black transition-colors" aria-hidden="true">
                      chevron_right
                    </span>
                  </Link>
                )
              })
            ) : (
              <>
                <Link
                  href="/roadmap"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 group cursor-pointer hover:border-black/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-green text-[20px]" aria-hidden="true">description</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black">Generate Your Roadmap</p>
                    <p className="text-xs font-medium text-subtle-gray">Get a personalized action plan</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-black transition-colors" aria-hidden="true">chevron_right</span>
                </Link>
                <Link
                  href="/colleges"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 group cursor-pointer hover:border-black/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]" aria-hidden="true">science</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black">Browse Colleges</p>
                    <p className="text-xs font-medium text-subtle-gray">Research Phase &bull; Strategy</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-black transition-colors" aria-hidden="true">chevron_right</span>
                </Link>
                <Link
                  href="/dashboard/activities"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 group cursor-pointer hover:border-black/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-500 text-[20px]" aria-hidden="true">event_repeat</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-black">Add Activities</p>
                    <p className="text-xs font-medium text-subtle-gray">Upcoming &bull; Activity Booster</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-black transition-colors" aria-hidden="true">chevron_right</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-card rounded-[40px] p-8 flex flex-col">
          <h4 className="text-lg font-black tracking-tight mb-8 font-display">Quick Stats</h4>
          <div className="space-y-8 flex-grow">
            <div>
              <p className="text-xs font-black text-subtle-gray uppercase tracking-widest mb-1">{gpaLabel}</p>
              <p className="text-3xl font-black font-display">{gpa ? gpa.toFixed(2) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-black text-subtle-gray uppercase tracking-widest mb-1">Impact Hours</p>
              <p className="text-3xl font-black font-display">{impactHours}</p>
            </div>
            <div>
              <p className="text-xs font-black text-subtle-gray uppercase tracking-widest mb-1">Target Schools</p>
              <p className="text-3xl font-black font-display">{targetSchools}</p>
            </div>
          </div>
          <div className="pt-6 mt-4 border-t border-black/5">
            <p className="text-xs font-bold text-accent-green">
              {readinessDelta > 0 ? "Trending upward" : readiness > 0 ? "Keep building" : "Getting started"}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
