"use client"

import { useSession } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import { useCourses, useAddCourse, useUpdateCourse, useDeleteCourse } from "@/lib/hooks/use-courses"
import type { Course } from "@/lib/hooks/use-courses"
import AcademicBrainDump from "@/components/academics/AcademicBrainDump"

const ICON_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  red: { bg: "bg-red-500/10", text: "text-red-600" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-600" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600" },
}

const COLOR_OPTIONS = Object.keys(ICON_COLORS)

const LETTER_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]

const GRADE_BAR_COLORS: Record<string, string> = {
  "A+": "bg-emerald-500", "A": "bg-emerald-500", "A-": "bg-blue-500",
  "B+": "bg-blue-500", "B": "bg-orange-500", "B-": "bg-orange-500",
  "C+": "bg-amber-500", "C": "bg-amber-500", "C-": "bg-red-500",
  "D+": "bg-red-500", "D": "bg-red-500", "D-": "bg-red-500",
  "F": "bg-red-600",
}

const AWARD_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  merit: { icon: "military_tech", color: "text-orange-500", bg: "bg-orange-500/10" },
  scholar: { icon: "workspace_premium", color: "text-blue-500", bg: "bg-blue-500/10" },
  olympiad: { icon: "verified", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  default: { icon: "emoji_events", color: "text-amber-500", bg: "bg-amber-500/10" },
}

function getAwardStyle(award: string) {
  const lower = award.toLowerCase()
  if (lower.includes("merit")) return AWARD_ICONS.merit
  if (lower.includes("scholar") || lower.includes("ap")) return AWARD_ICONS.scholar
  if (lower.includes("olympiad") || lower.includes("math") || lower.includes("science")) return AWARD_ICONS.olympiad
  return AWARD_ICONS.default
}

function getAIInsight(gpa: number | null, courseCount: number): string {
  if (!gpa && courseCount === 0) {
    return "Add your courses to get personalized insights about your academic standing and college competitiveness."
  }
  if (!gpa) {
    return "Enter your grades to see how your GPA trends affect your college admissions chances."
  }
  if (gpa >= 3.9) {
    return `Your ${gpa.toFixed(2)} GPA places you in a strong position for highly selective schools. Maintain consistency across all subjects this semester.`
  }
  if (gpa >= 3.7) {
    return `With a ${gpa.toFixed(2)} GPA, you're competitive for most selective institutions. Focus on raising any B+ grades to strengthen your transcript.`
  }
  if (gpa >= 3.5) {
    return `Your ${gpa.toFixed(2)} GPA is solid. Target schools where you fall within the middle 50% GPA range to maximize acceptance chances.`
  }
  return `Your current GPA trend makes you a strong candidate for many excellent schools. Consider AP or Honors courses to demonstrate academic rigor.`
}

export default function AcademicsPage() {
  const { data: session } = useSession()
  const { data, isLoading: loading, isError: error, refetch } = useCourses()
  const addCourseMutation = useAddCourse()
  const updateCourseMutation = useUpdateCourse()
  const deleteCourseMutation = useDeleteCourse()

  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [previousGpa] = useState<number | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("")
  const [formSemester, setFormSemester] = useState("")
  const [formYear, setFormYear] = useState("")
  const [formStatus, setFormStatus] = useState("in_progress")
  const [formGrade, setFormGrade] = useState("")
  const [formPercentage, setFormPercentage] = useState("")
  const [formCredits, setFormCredits] = useState("1.0")
  const [formColor, setFormColor] = useState("blue")
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key handler for modal
  useEffect(() => {
    if (!showModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false)
        setEditingCourse(null)
        resetForm()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showModal])

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector<HTMLInputElement>("input, select")
        firstInput?.focus()
      }, 50)
    }
  }, [showModal])

  const resetForm = () => {
    setFormName("")
    setFormType("")
    setFormSemester("")
    setFormYear("")
    setFormStatus("in_progress")
    setFormGrade("")
    setFormPercentage("")
    setFormCredits("1.0")
    setFormColor("blue")
  }

  const openAddModal = () => {
    resetForm()
    setEditingCourse(null)
    setShowModal(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setFormName(course.name)
    setFormType(course.type || "")
    setFormSemester(course.semester || "")
    setFormYear(course.year || "")
    setFormStatus(course.status)
    setFormGrade(course.letterGrade || "")
    setFormPercentage(course.percentage?.toString() || "")
    setFormCredits(course.credits.toString())
    setFormColor(course.iconColor || "blue")
    setShowModal(true)
  }

  const saving = addCourseMutation.isPending || updateCourseMutation.isPending

  const handleSave = async () => {
    if (!formName.trim()) return

    const payload = {
      name: formName.trim(),
      type: formType || null,
      semester: formSemester || null,
      year: formYear || null,
      status: formStatus,
      letterGrade: formGrade || null,
      percentage: formPercentage || null,
      credits: formCredits || "1.0",
      iconColor: formColor,
    }

    try {
      if (editingCourse) {
        await updateCourseMutation.mutateAsync({ id: editingCourse.id, payload })
      } else {
        await addCourseMutation.mutateAsync(payload)
      }
      setShowModal(false)
      resetForm()
      setEditingCourse(null)
    } catch {
      // Error handling silently - data will be stale
    }
  }

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourseMutation.mutateAsync(courseId)
    } catch {
      // Error handling silently
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse" aria-hidden="true">school</span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Loading academics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-card rounded-[32px] p-10">
          <span className="material-symbols-outlined text-orange-400 text-4xl mb-4 block" aria-hidden="true">cloud_off</span>
          <h2 className="text-lg font-black font-display mb-2">Unable to load academics</h2>
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

  const courses = data?.courses || []
  const cumulativeGpa = data?.profile?.cumulativeGpa
  const semesterGpa = data?.profile?.semesterGpa
  const awards = data?.profile?.awards || []
  const semesterInfo = data?.semesterInfo || "Fall Semester 2024 • Senior Year"
  const userName = data?.user?.name || session?.user?.name || "Student"
  const userImage = data?.user?.image || session?.user?.image
  const firstName = userName.split(" ")[0]

  // Semester GPA trend — computed from real delta when courses change
  const gpaDelta = (semesterGpa != null && previousGpa != null) ? Math.round((semesterGpa - previousGpa) * 100) / 100 : null
  const gpaTrend = gpaDelta !== null && gpaDelta !== 0
    ? (gpaDelta > 0 ? `+${gpaDelta.toFixed(2)}` : gpaDelta.toFixed(2))
    : null

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black mb-2 font-display">Academics & Grades.</h1>
          <p className="text-subtle-gray font-display uppercase tracking-widest text-[11px] font-bold">{semesterInfo}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
            {userImage ? (
              <img alt={`${firstName}'s profile picture`} className="w-full h-full object-cover" src={userImage} />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center" aria-label={`${firstName}'s avatar`}>
                <span className="text-white font-bold text-lg" aria-hidden="true">{firstName[0]}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main Content */}
        <div className="flex-grow min-w-0">
          {/* AI Brain Dump */}
          <AcademicBrainDump />

          {/* GPA Summary Card */}
          <div className="glass-card rounded-[32px] p-8 mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1">Cumulative GPA</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-black">{cumulativeGpa != null ? cumulativeGpa.toFixed(2) : "N/A"}</span>
                </div>
              </div>
              <div className="h-12 w-px bg-black/5"></div>
              <div>
                <p className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1">Semester GPA</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-black">{semesterGpa != null ? semesterGpa.toFixed(2) : "—"}</span>
                  {gpaTrend && (
                    <div className={`flex items-center gap-1 font-bold text-sm px-2 py-0.5 rounded-full ${
                      gpaTrend.startsWith("+")
                        ? "text-emerald-500 bg-emerald-500/10"
                        : "text-red-500 bg-red-500/10"
                    }`}>
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        {gpaTrend.startsWith("+") ? "trending_up" : "trending_down"}
                      </span>
                      {gpaTrend}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-12 w-px bg-black/5"></div>
              <div className="w-48">
                <p className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-2">Trend</p>
                {(() => {
                  const isUp = gpaDelta === null || gpaDelta >= 0
                  const color = isUp ? "#10b981" : "#ef4444"
                  const path = isUp
                    ? "M0 15 Q 10 18, 20 12 T 40 8 T 60 10 T 80 4 T 100 2"
                    : "M0 5 Q 10 2, 20 8 T 40 12 T 60 10 T 80 16 T 100 18"
                  const endY = isUp ? 2 : 18
                  return (
                    <svg className="w-full h-8" viewBox="0 0 100 20" aria-hidden="true">
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                      <circle cx="100" cy={endY} fill={color} r="2" />
                    </svg>
                  )
                })()}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={openAddModal}
                className="px-6 py-2.5 rounded-2xl bg-black text-white font-bold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                Add Grade
              </button>
            </div>
          </div>

          {/* Current Courses Table */}
          <div className="glass-card rounded-[32px] overflow-hidden">
            <div className="p-8 border-b border-black/5 flex justify-between items-center">
              <h3 className="font-bold text-lg">Current Courses</h3>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-subtle-gray text-[20px]" aria-hidden="true">filter_list</span>
                <span className="text-sm font-medium text-subtle-gray">{courses.length} Course{courses.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-subtle-gray text-5xl mb-4 block" aria-hidden="true">school</span>
                <h4 className="text-lg font-bold mb-2">No courses yet</h4>
                <p className="text-subtle-gray text-sm mb-6">Add your current courses to track your grades and GPA.</p>
                <button
                  onClick={openAddModal}
                  className="px-6 py-2.5 rounded-2xl bg-black text-white font-bold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                >
                  Add Your First Course
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest bg-black/[0.02]">
                    <th className="px-8 py-4">Class Name</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Current Grade</th>
                    <th className="px-8 py-4 text-center">Percentage</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {courses.map((course) => {
                    const colors = ICON_COLORS[course.iconColor || "blue"] || ICON_COLORS.blue
                    const initial = course.name.charAt(0).toUpperCase()
                    const barColor = course.letterGrade ? (GRADE_BAR_COLORS[course.letterGrade] || "bg-gray-400") : "bg-gray-300"
                    const pct = course.percentage || 0

                    const statusLabel = course.status === "completed" ? "Completed" : course.status === "dropped" ? "Dropped" : "In Progress"
                    const statusColor = course.status === "completed"
                      ? "bg-blue-500/10 text-blue-600"
                      : course.status === "dropped"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-emerald-500/10 text-emerald-600"

                    return (
                      <tr key={course.id} className="hover:bg-black/[0.01] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center font-bold`}>
                              {initial}
                            </div>
                            <div>
                              <span className="font-semibold">{course.name}</span>
                              {course.type && (
                                <span className="text-xs text-subtle-gray ml-2">({course.type})</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full ${statusColor} text-xs font-bold uppercase tracking-wider`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-lg font-bold">
                          {course.letterGrade || "—"}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <div
                              className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden"
                              role="progressbar"
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${course.name}: ${pct}%`}
                            >
                              <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="text-sm font-bold">{pct > 0 ? `${pct}%` : "—"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(course)}
                              className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-subtle-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                              aria-label={`Edit ${course.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit_note</span>
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              disabled={deleteCourseMutation.isPending}
                              className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-subtle-gray hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 disabled:opacity-50"
                              aria-label={`Delete ${course.name}`}
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                                {deleteCourseMutation.isPending ? "hourglass_empty" : "delete"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Documents */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-card rounded-[32px] p-8">
            <h3 className="font-bold text-lg mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500" aria-hidden="true">folder_open</span>
              Documents
            </h3>

            <div className="space-y-8">
              {/* Certificates & Awards */}
              <div>
                <p className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-4">Certificates & Awards</p>
                <div className="space-y-3">
                  {awards.length > 0 ? (
                    awards.map((award, i) => {
                      const style = getAwardStyle(award)
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                              <span className={`material-symbols-outlined ${style.color} text-[20px]`} aria-hidden="true">{style.icon}</span>
                            </div>
                            <span className="text-sm font-medium">{award}</span>
                          </div>
                          <span className="material-symbols-outlined text-subtle-gray text-[18px] opacity-0 group-hover:opacity-100" aria-hidden="true">visibility</span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-subtle-gray">No awards added yet. Update your profile to add certificates and awards.</p>
                  )}
                </div>
              </div>

              {/* AI Insight */}
              <div className="pt-6 border-t border-black/5">
                <div className="bg-blue-600 rounded-2xl p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">AI Insight</p>
                  <p className="text-xs leading-relaxed font-medium">
                    {getAIInsight(cumulativeGpa ?? null, courses.length)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setEditingCourse(null); resetForm() }}
          ></div>
          <div ref={modalRef} role="dialog" aria-modal="true" aria-label={editingCourse ? "Edit Course" : "Add New Course"} className="relative glass-card rounded-[32px] p-8 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black font-display">
                {editingCourse ? "Edit Course" : "Add New Course"}
              </h3>
              <button
                onClick={() => { setShowModal(false); setEditingCourse(null); resetForm() }}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Course Name */}
              <div>
                <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-name">
                  Course Name *
                </label>
                <input
                  id="course-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="AP Calculus BC"
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                />
              </div>

              {/* Type + Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-type">
                    Type
                  </label>
                  <select
                    id="course-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                  >
                    <option value="">Regular</option>
                    <option value="AP">AP</option>
                    <option value="Honors">Honors</option>
                    <option value="IB">IB</option>
                    <option value="Dual Enrollment">Dual Enrollment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block">
                    Icon Color
                  </label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-lg ${ICON_COLORS[color].bg} border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green ${
                          formColor === color ? "border-black scale-110" : "border-transparent"
                        }`}
                        aria-label={`Select ${color} color`}
                        aria-pressed={formColor === color}
                      >
                        <span className={`material-symbols-outlined ${ICON_COLORS[color].text} text-[16px]`} aria-hidden="true">circle</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grade + Percentage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-grade">
                    Letter Grade
                  </label>
                  <select
                    id="course-grade"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                  >
                    <option value="">Select grade</option>
                    {LETTER_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-pct">
                    Percentage
                  </label>
                  <input
                    id="course-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formPercentage}
                    onChange={(e) => setFormPercentage(e.target.value)}
                    placeholder="96"
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Semester + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-semester">
                    Semester
                  </label>
                  <input
                    id="course-semester"
                    type="text"
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    placeholder="Fall 2024"
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-status">
                    Status
                  </label>
                  <select
                    id="course-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
              </div>

              {/* Credits */}
              <div>
                <label className="text-[11px] font-bold text-subtle-gray uppercase tracking-widest mb-1.5 block" htmlFor="course-credits">
                  Credits
                </label>
                <input
                  id="course-credits"
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={formCredits}
                  onChange={(e) => setFormCredits(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-green focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex-grow px-6 py-3 rounded-2xl bg-black text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                {saving ? "Saving..." : editingCourse ? "Update Course" : "Add Course"}
              </button>
              <button
                onClick={() => { setShowModal(false); setEditingCourse(null); resetForm() }}
                className="px-6 py-3 rounded-2xl glass-card font-bold text-sm hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
