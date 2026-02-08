"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

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

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

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
          intendedMajors: intendedMajor.split(",").map(m => m.trim()).filter(Boolean),
          careerInterests: careerInterests.split(",").map(c => c.trim()).filter(Boolean),
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
      // Skip to dashboard with partial data
      router.push("/dashboard")
    }
  }

  const canProceed = () => {
    if (step === 1) {
      return gradeLevel && graduationYear && location
    }
    // Steps 2 and 3 are optional
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Let's Personalize Your Journey
          </h1>
          <p className="text-gray-600">
            Step {step} of {totalSteps}
          </p>
          <Progress value={progress} className="mt-4" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "The Basics"}
              {step === 2 && "Your Academics"}
              {step === 3 && "Your Interests"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us a bit about where you are in your journey"}
              {step === 2 && "Help us understand your academic profile"}
              {step === 3 && "What are you passionate about?"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Basics */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Grade Level *
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your grade</option>
                    <option value="9">9th Grade (Freshman)</option>
                    <option value="10">10th Grade (Sophomore)</option>
                    <option value="11">11th Grade (Junior)</option>
                    <option value="12">12th Grade (Senior)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Graduation Year *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 2026"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    min="2024"
                    max="2030"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location (City, State) *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Los Angeles, CA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Academics */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GPA (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 3.8"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      min="0"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GPA Scale
                    </label>
                    <select
                      value={gpaScale}
                      onChange={(e) => setGpaScale(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="4.0">4.0</option>
                      <option value="5.0">5.0</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SAT Score (Optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 1450"
                      value={satScore}
                      onChange={(e) => setSatScore(e.target.value)}
                      min="400"
                      max="1600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ACT Score (Optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 32"
                      value={actScore}
                      onChange={(e) => setActScore(e.target.value)}
                      min="1"
                      max="36"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    💡 Don't worry if you haven't taken these tests yet! You can skip this step and update later.
                  </p>
                </div>
              </>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intended Major(s) (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Computer Science, Biology"
                    value={intendedMajor}
                    onChange={(e) => setIntendedMajor(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple majors with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Career Interests (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Software Engineering, Medicine, Teaching"
                    value={careerInterests}
                    onChange={(e) => setCareerInterests(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple interests with commas
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    🎯 Almost done!
                  </p>
                  <p className="text-sm text-green-700">
                    After this step, we'll generate your personalized college application roadmap with actionable tasks.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
          >
            Back
          </Button>

          <div className="flex gap-3">
            {step < totalSteps && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? "Saving..." : step === totalSteps ? "Complete & Generate Roadmap" : "Next"}
            </Button>
          </div>
        </div>

        {/* Required field note */}
        {step === 1 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            * Required fields
          </p>
        )}
      </div>
    </div>
  )
}
