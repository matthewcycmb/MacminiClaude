"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CollegeCard } from "@/components/colleges/CollegeCard"
import { CollegeSearchModal } from "@/components/colleges/CollegeSearchModal"
import { ReadinessModal } from "@/components/colleges/ReadinessModal"
import { Plus, Loader2, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import type { ReadinessAssessment } from "@/lib/ai/prompts/readiness-calculator"

interface College {
  id: string
  name: string
  shortName?: string
  location: string
  type: string
  size: string
  acceptanceRate?: number
  avgGPA?: number
  sat25thPercentile?: number
  sat75thPercentile?: number
}

interface StudentCollege {
  id: string
  college: College
  applicationStatus: string
  listCategory?: string
  readinessPercentage?: number
  priority: number
  addedAt: Date
}

export default function CollegesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [colleges, setColleges] = useState<StudentCollege[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [readinessModalOpen, setReadinessModalOpen] = useState(false)
  const [currentAssessment, setCurrentAssessment] = useState<ReadinessAssessment | null>(null)
  const [currentCollegeName, setCurrentCollegeName] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchColleges()
    }
  }, [status, router])

  const fetchColleges = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/colleges")
      if (response.ok) {
        const data = await response.json()
        setColleges(data.colleges || [])
      }
    } catch (error) {
      console.error("Error fetching colleges:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCollege = async (college: College) => {
    try {
      const response = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId: college.id }),
      })

      if (response.ok) {
        await fetchColleges()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to add college")
      }
    } catch (error) {
      console.error("Error adding college:", error)
      toast.error("Failed to add college")
    }
  }

  const handleRemoveCollege = async (studentCollegeId: string) => {
    try {
      const response = await fetch(`/api/colleges/${studentCollegeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setColleges((prev) => prev.filter((c) => c.id !== studentCollegeId))
      } else {
        toast.error("Failed to remove college")
      }
    } catch (error) {
      console.error("Error removing college:", error)
      toast.error("Failed to remove college")
    }
  }

  const handleCalculateReadiness = async (studentCollegeId: string) => {
    try {
      const response = await fetch("/api/colleges/calculate-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCollegeId }),
      })

      if (response.ok) {
        const data = await response.json()
        const studentCollege = colleges.find((c) => c.id === studentCollegeId)

        if (studentCollege) {
          setCurrentAssessment(data.assessment)
          setCurrentCollegeName(studentCollege.college.name)
          setReadinessModalOpen(true)
        }

        // Refresh colleges to get updated readiness percentage
        await fetchColleges()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to calculate readiness")
      }
    } catch (error) {
      console.error("Error calculating readiness:", error)
      toast.error("Failed to calculate readiness")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Colleges</h1>
              <p className="text-gray-600">
                Manage your college list ({colleges.length}/15 colleges)
              </p>
            </div>
            <Button
              onClick={() => setIsSearchModalOpen(true)}
              size="lg"
              disabled={colleges.length >= 15}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add College
            </Button>
          </div>

          {colleges.length >= 15 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ You've reached the maximum of 15 colleges. Remove a college to add more.
              </p>
            </div>
          )}

          {colleges.length >= 12 && colleges.length < 15 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 You have {colleges.length} colleges. Counselors recommend 8-12 colleges.
              </p>
            </div>
          )}
        </div>

        {/* College List */}
        {colleges.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-20 w-20 mx-auto mb-6 text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              No colleges yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your college list by searching for schools that match your
              goals and profile.
            </p>
            <Button onClick={() => setIsSearchModalOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Your First College
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {colleges.map((studentCollege) => (
              <CollegeCard
                key={studentCollege.id}
                studentCollege={studentCollege}
                onRemove={handleRemoveCollege}
                onCalculateReadiness={handleCalculateReadiness}
                showReadiness={true}
              />
            ))}
          </div>
        )}

        {/* Tips Section */}
        {colleges.length > 0 && colleges.length < 8 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">
              💡 Building Your College List
            </h3>
            <p className="text-sm text-purple-800 mb-3">
              A balanced college list typically includes:
            </p>
            <ul className="text-sm text-purple-700 space-y-1 ml-4 list-disc">
              <li>2-3 reach schools (acceptance rate &lt; 20% or below your stats)</li>
              <li>3-5 target schools (acceptance rate 20-50%, match your stats)</li>
              <li>2-3 safety schools (acceptance rate &gt; 50%, above your stats)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <CollegeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddCollege={handleAddCollege}
      />

      {/* Readiness Modal */}
      <ReadinessModal
        isOpen={readinessModalOpen}
        onClose={() => setReadinessModalOpen(false)}
        assessment={currentAssessment}
        collegeName={currentCollegeName}
      />
    </div>
  )
}
