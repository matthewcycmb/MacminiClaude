"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VoiceRecorder } from "@/components/voice/VoiceRecorder"
import { ACTIVITY_QUESTIONS } from "@/lib/constants/brain-dump-questions"
import { ExtracurricularForm } from "@/components/voice/ExtracurricularForm"
import type { ExtracurricularActivity } from "@/lib/ai/prompts/extracurricular-structurer"
import {
  GraduationCap,
  Loader2,
  Mic,
  Lightbulb,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Step 1: Basics
  const [gradeLevel, setGradeLevel] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [location, setLocation] = useState("")

  // Step 2: Academics
  const [gpa, setGpa] = useState("")
  const [gpaScale, setGpaScale] = useState("4.0")
  const [satScore, setSatScore] = useState("")
  const [actScore, setActScore] = useState("")

  // Step 3: Interests
  const [intendedMajor, setIntendedMajor] = useState("")
  const [careerInterests, setCareerInterests] = useState("")

  // Step 4: Extracurriculars
  const [transcript, setTranscript] = useState("")
  const [activities, setActivities] = useState<ExtracurricularActivity[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasProcessed, setHasProcessed] = useState(false)

  const totalSteps = 4

  const stepLabels = [
    "THE BASICS",
    "YOUR ACADEMICS",
    "YOUR INTERESTS",
    "YOUR ACTIVITIES",
  ]

  const progressWidths = ["w-1/4", "w-2/4", "w-3/4", "w-full"]

  // Pre-fill from landing page quick start
  useEffect(() => {
    const quickStartData = sessionStorage.getItem("quickStart")
    if (quickStartData) {
      try {
        const data = JSON.parse(quickStartData)
        if (data.gradeLevel) setGradeLevel(data.gradeLevel)
        if (data.location) setLocation(data.location)

        // Calculate graduation year based on grade level
        if (data.gradeLevel) {
          const currentYear = new Date().getFullYear()
          const grade = parseInt(data.gradeLevel)
          const yearsUntilGrad = 12 - grade + 1
          setGraduationYear((currentYear + yearsUntilGrad).toString())
        }

        // Clear the session storage after using it
        sessionStorage.removeItem("quickStart")
      } catch (error) {
        console.error("Error parsing quick start data:", error)
      }
    }
  }, [])

  const handleProcessTranscript = async () => {
    if (!transcript.trim()) {
      alert("Please speak or type something about your activities first.")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/ai/structure-extracurriculars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setHasProcessed(true)
      } else {
        alert("Error processing your activities. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error processing your activities. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Submit all data
      setIsLoading(true)
      try {
        const profileData = {
          gradeLevel,
          graduationYear: parseInt(graduationYear),
          location,
          gpa: gpa ? parseFloat(gpa) : null,
          gpaScale: parseFloat(gpaScale),
          satScore: satScore ? parseInt(satScore) : null,
          actScore: actScore ? parseInt(actScore) : null,
          intendedMajors: intendedMajor
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          careerInterests: careerInterests
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          extracurriculars: activities.length > 0 ? activities : null,
        }

        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        })

        if (response.ok) {
          // Generate initial roadmap
          await fetch("/api/ai/generate-roadmap", { method: "POST" })

          // Redirect to dashboard
          router.push("/dashboard")
        } else {
          alert("Error saving profile. Please try again.")
        }
      } catch (error) {
        console.error("Error:", error)
        alert("Error saving profile. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const canProceed = () => {
    if (step === 1) {
      return gradeLevel && graduationYear && location
    }
    return true
  }

  const toggleDark = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className="bg-bg-canvas dark:bg-[#0c0e10] text-charcoal dark:text-white font-sans antialiased min-h-screen flex flex-col overflow-x-hidden">
      {/* Background effects */}
      <div className="vapor-blob vapor-left dark:opacity-20" />
      <div className="vapor-blob vapor-right dark:opacity-20" />
      <div className="fixed inset-0 grain pointer-events-none opacity-[0.03] z-[1]" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">College Tracker</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center pt-32 pb-24 px-6">
        <div className={`w-full ${step === 4 ? "max-w-2xl" : "max-w-xl"} mb-12`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-black impact-tracking text-black dark:text-white mb-2">
              Let&apos;s Personalize Your Journey
            </h1>
            <p className="text-subtle-gray dark:text-gray-400 font-medium">
              Step {step} of {totalSteps}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-12">
            <div
              className={`h-full ${progressWidths[step - 1]} bg-black dark:bg-white rounded-full transition-all duration-700`}
            />
          </div>

          {/* Step Content Card */}
          <div className="glass-card rounded-[32px] p-8 md:p-12">
            {/* Step 1: The Basics */}
            {step === 1 && (
              <>
                <div className="mb-10">
                  <h2 className="text-3xl font-black impact-tracking text-black dark:text-white mb-2">
                    The Basics
                  </h2>
                  <p className="text-subtle-gray dark:text-gray-400">
                    Tell us a bit about where you are in your journey
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                      Current Grade Level *
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium text-black dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select Grade</option>
                      <option value="9">9th Grade (Freshman)</option>
                      <option value="10">10th Grade (Sophomore)</option>
                      <option value="11">11th Grade (Junior)</option>
                      <option value="12">12th Grade (Senior)</option>
                    </select>
                  </div>

                  <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                      Expected Graduation Year *
                    </label>
                    <input
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="e.g. 2026"
                      min="2024"
                      max="2030"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                    />
                  </div>

                  <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                      Location (City, State) *
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Los Angeles, CA"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-center text-[10px] text-subtle-gray font-medium mt-10">
                  * Required fields
                </p>
              </>
            )}

            {/* Step 2: Your Academics */}
            {step === 2 && (
              <>
                <div className="mb-10">
                  <h2 className="text-3xl font-black impact-tracking text-black dark:text-white mb-2">
                    Your Academics
                  </h2>
                  <p className="text-subtle-gray dark:text-gray-400">
                    Help us understand your academic profile
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                        GPA (Optional)
                      </label>
                      <input
                        type="text"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="e.g., 3.8"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                      />
                    </div>
                    <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                        GPA Scale
                      </label>
                      <select
                        value={gpaScale}
                        onChange={(e) => setGpaScale(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium text-black dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="4.0">4.0</option>
                        <option value="5.0">5.0</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                        SAT Score (Optional)
                      </label>
                      <input
                        type="number"
                        value={satScore}
                        onChange={(e) => setSatScore(e.target.value)}
                        placeholder="e.g., 1450"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                      />
                    </div>
                    <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                        ACT Score (Optional)
                      </label>
                      <input
                        type="number"
                        value={actScore}
                        onChange={(e) => setActScore(e.target.value)}
                        placeholder="e.g., 32"
                        className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Info tip */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-400/10 rounded-[18px] p-5 flex gap-4 mt-8">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[14px] leading-relaxed text-blue-600 dark:text-blue-300 font-medium">
                      Don&apos;t worry if you haven&apos;t taken these tests yet! You can skip
                      this step and update later.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Your Interests */}
            {step === 3 && (
              <>
                <div className="mb-10">
                  <h2 className="text-3xl font-black impact-tracking text-black dark:text-white mb-2">
                    Your Interests
                  </h2>
                  <p className="text-subtle-gray dark:text-gray-400">
                    What are you passionate about?
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                      Intended Major(s)
                    </label>
                    <input
                      type="text"
                      value={intendedMajor}
                      onChange={(e) => setIntendedMajor(e.target.value)}
                      placeholder="e.g., Computer Science, Biology"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                    />
                  </div>

                  <div className="glass-input rounded-[18px] flex flex-col items-start px-6 py-4 dark:bg-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle-gray mb-1.5">
                      Career Interests
                    </label>
                    <input
                      type="text"
                      value={careerInterests}
                      onChange={(e) => setCareerInterests(e.target.value)}
                      placeholder="e.g., Software Engineering, Medicine"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-lg font-medium placeholder:text-gray-300 dark:text-white"
                    />
                  </div>

                  {/* Info tip */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-400/10 rounded-2xl p-5 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[13px] leading-relaxed text-blue-600 dark:text-blue-300 font-medium">
                      Don&apos;t worry if you&apos;re not sure yet! You can skip this step and
                      update your interests later.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Your Activities */}
            {step === 4 && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-black impact-tracking text-black dark:text-white mb-2">
                    Your Activities
                  </h2>
                  <p className="text-subtle-gray dark:text-gray-400">
                    Tell us about your extracurriculars using voice or text
                  </p>
                </div>
                <div className="space-y-6">
                  {!hasProcessed ? (
                    <>
                      {/* Voice Brain Dump Feature Card */}
                      <div className="bg-purple-500/5 dark:bg-purple-500/10 backdrop-blur-xl border border-purple-200/30 dark:border-purple-500/20 rounded-[24px] p-6 shadow-[0_8px_32px_rgba(124,58,237,0.05)]">
                        <div className="flex items-center gap-3 mb-3">
                          <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="font-bold text-purple-600 dark:text-purple-400 text-sm uppercase tracking-wider">
                            Voice Brain Dump Feature
                          </h3>
                        </div>
                        <p className="text-purple-600/80 dark:text-purple-300 text-sm font-medium leading-relaxed">
                          Just speak naturally about your activities and we&apos;ll structure
                          them for you!
                        </p>
                        <p className="text-purple-600/60 dark:text-purple-400/60 text-xs mt-2 italic">
                          For example: &quot;I&apos;m president of the robotics club, we meet 10
                          hours a week. I also volunteer at the library on weekends for about 3
                          hours.&quot;
                        </p>
                      </div>

                      {/* Guiding Questions */}
                      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-5">
                        <p className="text-xs font-bold text-subtle-gray dark:text-gray-400 mb-2">Try mentioning:</p>
                        <ul className="space-y-1">
                          {ACTIVITY_QUESTIONS.map((q, i) => (
                            <li key={i} className="text-xs text-subtle-gray dark:text-gray-400 flex items-start gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-subtle-gray/40 mt-1.5 shrink-0" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Voice Recorder */}
                      <VoiceRecorder
                        transcript={transcript}
                        onTranscriptChange={setTranscript}
                      />

                      {/* Process Button */}
                      {transcript.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleProcessTranscript}
                          disabled={isProcessing}
                          className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing your activities...
                            </>
                          ) : (
                            "Structure My Activities with AI"
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Success Message */}
                      <div className="bg-green-50/60 dark:bg-green-900/10 border border-green-100/60 dark:border-green-400/20 rounded-2xl p-5 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                          Great! Your activities have been structured. Review and edit them
                          below, or add more activities.
                        </p>
                      </div>

                      {/* Activity Form */}
                      <ExtracurricularForm
                        activities={activities}
                        onChange={setActivities}
                      />

                      {/* Start Over */}
                      <button
                        type="button"
                        onClick={() => {
                          setHasProcessed(false)
                          setTranscript("")
                        }}
                        className="w-full border border-black/10 dark:border-white/10 bg-white/20 backdrop-blur-xl py-3.5 rounded-full font-semibold text-[15px] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        Start Over with Voice Input
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className="border border-black/10 dark:border-white/10 bg-white/20 backdrop-blur-xl px-8 py-3.5 rounded-full font-semibold text-[15px] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-subtle-gray hover:text-black dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Back
            </button>

            <div className="flex items-center gap-6">
              {step < totalSteps && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="text-subtle-gray hover:text-black dark:hover:text-white font-semibold text-[15px] transition-colors"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="bg-black dark:bg-white text-white dark:text-black px-10 py-3.5 rounded-full font-semibold text-[15px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : step === totalSteps ? (
                  "Complete & Generate Roadmap"
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step Label */}
        <div className="w-full text-center opacity-40 mt-12">
          <p className="text-[10px] font-bold tracking-[0.4em] text-subtle-gray uppercase">
            STEP {step}: {stepLabels[step - 1]}
          </p>
        </div>
      </main>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDark}
        className="fixed bottom-10 right-10 w-14 h-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-full shadow-2xl flex items-center justify-center border border-white/50 dark:border-white/10 z-[200] hover:scale-110 transition-transform active:scale-95"
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <Sun className="w-6 h-6 text-yellow-400" />
        ) : (
          <Moon className="w-6 h-6 text-zinc-800" />
        )}
      </button>

    </div>
  )
}
