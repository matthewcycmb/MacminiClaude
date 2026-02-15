"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  const [selectedGrade, setSelectedGrade] = useState("9")
  const [isDark, setIsDark] = useState(false)

  const grades = [
    { id: "freshman", value: "9", label: "9th Grade" },
    { id: "sophomore", value: "10", label: "10th Grade" },
    { id: "junior", value: "11", label: "11th Grade" },
    { id: "senior", value: "12", label: "12th Grade" },
  ]

  const handleCreateDashboard = () => {
    // Calculate graduation year from grade
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const gradeNum = parseInt(selectedGrade)
    const yearsLeft = 12 - gradeNum
    const graduationYear = currentMonth >= 6 ? currentYear + yearsLeft + 1 : currentYear + yearsLeft

    // Store in sessionStorage for onboarding pre-fill
    sessionStorage.setItem(
      "quickStart",
      JSON.stringify({
        name: "",
        gradeLevel: selectedGrade,
        location: "",
        graduationYear,
      })
    )

    router.push("/onboarding")
  }

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="bg-bg-canvas dark:bg-[#121411] text-charcoal dark:text-white font-sans antialiased min-h-screen flex flex-col">
      <div className="vapor-blob vapor-left dark:opacity-10"></div>
      <div className="vapor-blob vapor-right dark:opacity-10"></div>
      <div className="fixed inset-0 grain pointer-events-none opacity-[0.04] z-[1]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-canvas/60 dark:bg-black/40 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-forest-700 text-2xl font-bold" aria-hidden="true">school</span>
            <span className="text-xl font-bold tracking-tight font-display">Kairo</span>
          </div>
          <div className="hidden md:flex items-center gap-12 text-[14px] font-medium text-subtle-gray dark:text-gray-400">
            <a className="hover:text-forest-700 dark:hover:text-white transition-colors" href="#features">Features</a>
            <a className="hover:text-forest-700 dark:hover:text-white transition-colors" href="#success">Success Stories</a>
            <a className="hover:text-forest-700 dark:hover:text-white transition-colors" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-[14px] font-medium hover:text-forest-700 dark:text-gray-400 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="bg-forest-700 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-forest-800 transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-32 pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full text-center flex flex-col items-center relative z-10">
            <div className="mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-forest-100 dark:bg-forest-800/30 text-forest-700 dark:text-forest-100 text-[12px] font-bold tracking-widest uppercase mb-6">
                One day or day one?
              </span>
              <h1 className="text-5xl md:text-[80px] font-[900] impact-tracking text-charcoal dark:text-white leading-[0.95] mb-8 max-w-5xl mx-auto flex flex-col items-center font-display">
                <span>Stop wondering if</span>
                <span>you&apos;re on the</span>
                <span className="text-forest-700">right track.</span>
              </h1>
              <p className="text-[18px] md:text-[22px] text-subtle-gray dark:text-gray-300 font-normal font-display sub-tracking max-w-3xl mx-auto leading-relaxed">
                Kairo tracks and transforms your grades and extracurriculars so you always know where you stand and exactly what to improve.
              </p>
            </div>

            {/* Grade Selector + CTA */}
            <div className="w-full max-w-2xl">
              <div className="flex flex-col items-center">
                <div className="w-full mb-8">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-subtle-gray mb-4">
                    Select Your Current Grade
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {grades.map((grade) => (
                      <div key={grade.id}>
                        <input
                          checked={selectedGrade === grade.value}
                          className="hidden peer"
                          id={grade.id}
                          name="grade"
                          type="radio"
                          value={grade.value}
                          onChange={(e) => setSelectedGrade(e.target.value)}
                        />
                        <label
                          className={`flex items-center justify-center h-12 rounded-2xl border-2 cursor-pointer text-sm font-bold transition-all ${
                            selectedGrade === grade.value
                              ? "border-forest-700 bg-forest-700 text-white shadow-md"
                              : "border-forest-700/20 bg-white/60 dark:bg-white/5 hover:border-forest-700/50"
                          }`}
                          htmlFor={grade.id}
                        >
                          {grade.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-sm:max-w-full max-w-sm">
                  <button
                    onClick={handleCreateDashboard}
                    className="w-full bg-forest-700 dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-bold text-[18px] shadow-[0_12px_30px_-6px_rgba(45,75,62,0.3)] hover:shadow-[0_20px_40px_rgba(45,75,62,0.4)] transition-all duration-300 active:scale-95"
                  >
                    Create My Dashboard
                  </button>
                  <Link
                    href="/dashboard"
                    className="text-[13px] font-semibold text-subtle-gray hover:text-forest-700 dark:hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform" aria-hidden="true">visibility</span>
                    View Sample Dashboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6 bg-white/80 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-forest-700">A</span>
                  </div>
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-forest-700">S</span>
                  </div>
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-forest-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-forest-700">J</span>
                  </div>
                </div>
                <p className="text-[12px] font-semibold text-subtle-gray">
                  <span className="text-charcoal dark:text-white font-bold">15,000+</span> students planning today
                </p>
              </div>
              <p className="text-[12px] font-bold tracking-[0.4em] text-subtle-gray uppercase mb-8 opacity-60">
                TRUSTED BY TOP APPLICANTS AT
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-4 opacity-40">
                <span className="text-base font-medium">Harvard</span>
                <span className="text-base font-medium">Stanford</span>
                <span className="text-base font-medium">MIT</span>
                <span className="text-base font-medium">Yale</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 md:px-12 max-w-[1440px] mx-auto" id="features">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            {/* Feature Visual */}
            <div className="flex-1 w-full lg:w-1/2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-forest-50 to-emerald-50 dark:from-forest-800/10 dark:to-emerald-900/10 rounded-[48px] blur-3xl opacity-60"></div>
              <div className="glass-card relative rounded-[40px] overflow-hidden p-8 border-white/60 dark:bg-white/5 dark:border-white/10 aspect-[4/3] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/30"></div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-forest-50 dark:bg-white/10 text-[10px] font-bold tracking-widest text-forest-700 uppercase">AI Roadmap Generator</div>
                </div>
                <div className="flex-grow grid grid-cols-12 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div className="h-8 w-full bg-black/5 dark:bg-white/5 rounded-lg"></div>
                    <div className="h-8 w-4/5 bg-black/5 dark:bg-white/5 rounded-lg opacity-60"></div>
                    <div className="h-8 w-full bg-black/5 dark:bg-white/5 rounded-lg opacity-40"></div>
                  </div>
                  <div className="col-span-9 space-y-6">
                    <div className="h-32 w-full bg-gradient-to-br from-forest-700/5 to-emerald-500/5 dark:from-forest-700/10 dark:to-emerald-400/10 rounded-2xl border border-black/5 flex items-center justify-center">
                      <div className="flex items-end gap-3 h-16">
                        <div className="w-4 bg-forest-700/20 rounded-t-sm h-12"></div>
                        <div className="w-4 bg-forest-700/30 rounded-t-sm h-16"></div>
                        <div className="w-4 bg-emerald-500/40 rounded-t-sm h-10"></div>
                        <div className="w-4 bg-forest-700/20 rounded-t-sm h-14"></div>
                        <div className="w-4 bg-emerald-500/30 rounded-t-sm h-16"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-forest-100 dark:bg-white/10 shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-forest-700 text-sm" aria-hidden="true">bolt</span>
                        </div>
                        <div className="h-4 w-1/2 bg-black/5 dark:bg-white/5 rounded-full"></div>
                      </div>
                      <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-forest-700 dark:bg-white transition-all duration-1000"></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-subtle-gray tracking-wider uppercase">
                        <span>Milestone: GPA Optimization</span>
                        <span className="text-forest-700">68% Success Probability</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Text */}
            <div className="flex-1 w-full lg:w-1/2 flex flex-col items-start text-left">
              <h2 className="text-4xl md:text-5xl font-extrabold text-charcoal dark:text-white impact-tracking mb-12 leading-[1.1] font-display">
                Built for the student who takes it seriously.
              </h2>
              <div className="space-y-10">
                <div className="flex gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-forest-50 transition-colors">
                    <span className="material-symbols-outlined text-forest-700 text-2xl" aria-hidden="true">insights</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Personalized feedback</h3>
                    <p className="text-subtle-gray dark:text-gray-400 leading-relaxed font-display text-lg">
                      Get feedback like a 20-year admissions officer — not a generic checklist. Kairo knows your actual profile and tells you exactly what to strengthen.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-forest-50 transition-colors">
                    <span className="material-symbols-outlined text-forest-700 text-2xl" aria-hidden="true">travel_explore</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Hyper-local discovery</h3>
                    <p className="text-subtle-gray dark:text-gray-400 leading-relaxed font-display text-lg">
                      Hackathons in Vancouver. Internships in your city. Kairo finds real, local opportunities matched to what you&apos;re actually doing.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-forest-50 transition-colors">
                    <span className="material-symbols-outlined text-forest-700 text-2xl" aria-hidden="true">map</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Weekly action items</h3>
                    <p className="text-subtle-gray dark:text-gray-400 leading-relaxed font-display text-lg">
                      No idea where to start? Kairo builds you three concrete roadmaps based on your interests — and tells you exactly what to do this week.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-32 px-6 md:px-12 max-w-[1440px] mx-auto" id="success">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extrabold text-charcoal dark:text-white impact-tracking mb-6 font-display">Success Stories</h2>
            <p className="text-xl text-subtle-gray dark:text-gray-400 font-display">Students who started early, won big.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The AI roadmap helped me focus on the right extracurriculars. I finally felt like I had a clear path to my dream school.",
                name: "Alex Rivera",
                role: "Engineering Major",
              },
              {
                quote: "The real-time tracking maintained my motivation through junior year. Watching the percentage grow was immensely satisfying.",
                name: "Sarah Chen",
                role: "Biology Pre-med",
              },
              {
                quote: "I matched with colleges I hadn't even considered. The direct matching is truly a game changer for discovery.",
                name: "Jordan Smith",
                role: "Political Science",
              },
            ].map((story) => (
              <div key={story.name} className="glass-card p-10 rounded-[32px] flex flex-col justify-between hover:translate-y-[-8px] transition-all duration-500 bg-white">
                <div>
                  <div className="mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-forest-700 text-4xl opacity-30" aria-hidden="true">format_quote</span>
                  </div>
                  <p className="text-xl leading-relaxed text-charcoal dark:text-white/90 font-display mb-10">
                    &ldquo;{story.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-forest-100 ring-2 ring-forest-50 flex items-center justify-center">
                    <span className="text-lg font-bold text-forest-700">{story.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{story.name}</h4>
                    <p className="text-xs text-subtle-gray">{story.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-32 px-6 md:px-12 max-w-4xl mx-auto" id="faq">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-charcoal dark:text-white impact-tracking mb-6 font-display">Key questions answered</h2>
            <p className="text-xl text-subtle-gray dark:text-gray-400 font-display">All you need to know about your dashboard.</p>
          </div>
          <div className="space-y-4">
            <details className="group bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden" open>
              <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                <span className="text-xl font-bold">Is this just another AI chatbot?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-forest-700" aria-hidden="true">expand_more</span>
              </summary>
              <div className="px-8 pb-8 text-lg text-subtle-gray dark:text-gray-400 leading-relaxed font-display">
                No — Kairo uses longitudinal data to track your growth over years, not just answer one-off questions.
              </div>
            </details>
            <details className="group bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                <span className="text-xl font-bold">What if I&apos;m currently in 11th grade?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-forest-700" aria-hidden="true">expand_more</span>
              </summary>
              <div className="px-8 pb-8 text-lg text-subtle-gray dark:text-gray-400 leading-relaxed font-display">
                It&apos;s not too late. Kairo helps you optimize your remaining time to maximize your existing profile.
              </div>
            </details>
            <details className="group bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                <span className="text-xl font-bold">Do my parents need to be involved?</span>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-forest-700" aria-hidden="true">expand_more</span>
              </summary>
              <div className="px-8 pb-8 text-lg text-subtle-gray dark:text-gray-400 leading-relaxed font-display">
                Kairo is built for student autonomy, but parents can view progress to stay informed without the hovering.
              </div>
            </details>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-32 px-6 md:px-12 text-center">
          <div className="max-w-4xl mx-auto glass-card p-16 md:p-20 rounded-[48px] border-white/60 bg-white/80">
            <h2 className="text-3xl md:text-5xl font-extrabold impact-tracking mb-10 leading-tight font-display">
              Most students start too late. You don&apos;t have to. Join students who are already building their story.
            </h2>
            <Link
              href="/onboarding"
              className="inline-block bg-forest-700 dark:bg-white text-white dark:text-black px-16 py-6 rounded-full font-bold text-xl hover:bg-forest-800 hover:scale-[1.02] transition-all shadow-xl"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDark}
        className="fixed bottom-10 right-10 w-14 h-14 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-full shadow-2xl flex items-center justify-center border border-black/5 dark:border-white/10 z-[200] hover:scale-110 transition-transform active:scale-95"
        aria-label="Toggle dark mode"
      >
        <span className="material-symbols-outlined dark:hidden text-zinc-800 text-2xl" aria-hidden="true">dark_mode</span>
        <span className="material-symbols-outlined hidden dark:block text-yellow-400 text-2xl" aria-hidden="true">light_mode</span>
      </button>
    </div>
  )
}
