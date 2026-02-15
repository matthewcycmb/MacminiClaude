"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, MapPin, Users, TrendingUp, Calculator, Loader2, ListTodo } from "lucide-react"

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

interface CollegeCardProps {
  studentCollege: StudentCollege
  onRemove?: (id: string) => void
  onCalculateReadiness?: (studentCollegeId: string) => Promise<void>
  onGenerateTasks?: (studentCollegeId: string) => Promise<void>
  showReadiness?: boolean
}

export function CollegeCard({ studentCollege, onRemove, onCalculateReadiness, onGenerateTasks, showReadiness = false }: CollegeCardProps) {
  const { college } = studentCollege
  const [isRemoving, setIsRemoving] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false)

  const handleRemove = async () => {
    if (!onRemove) return

    if (confirm(`Remove ${college.name} from your list?`)) {
      setIsRemoving(true)
      try {
        await onRemove(studentCollege.id)
      } finally {
        setIsRemoving(false)
      }
    }
  }

  const handleCalculateReadiness = async () => {
    if (!onCalculateReadiness) return

    setIsCalculating(true)
    try {
      await onCalculateReadiness(studentCollege.id)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleGenerateTasks = async () => {
    if (!onGenerateTasks) return

    setIsGeneratingTasks(true)
    try {
      await onGenerateTasks(studentCollege.id)
    } finally {
      setIsGeneratingTasks(false)
    }
  }

  const getCategoryBadge = (category?: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      reach: { label: "Reach", color: "bg-red-100 text-red-800 border-red-200" },
      target: { label: "Target", color: "bg-blue-100 text-blue-800 border-blue-200" },
      safety: { label: "Safety", color: "bg-green-100 text-green-800 border-green-200" },
    }

    if (!category || !badges[category]) return null

    const badge = badges[category]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{college.name}</h3>
            {getCategoryBadge(studentCollege.listCategory)}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{college.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="capitalize">{college.size}</span>
            </div>
            {college.acceptanceRate && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{college.acceptanceRate}% acceptance</span>
              </div>
            )}
          </div>

          {showReadiness && studentCollege.readinessPercentage && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Readiness</span>
                <span className="text-sm font-bold text-blue-600">
                  {studentCollege.readinessPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${studentCollege.readinessPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 text-xs text-gray-600 mb-4">
            {college.avgGPA && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                Avg GPA: {college.avgGPA}
              </span>
            )}
            {college.sat25thPercentile && college.sat75thPercentile && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                SAT: {college.sat25thPercentile}-{college.sat75thPercentile}
              </span>
            )}
            <span className="bg-gray-100 px-2 py-1 rounded capitalize">
              {college.type}
            </span>
          </div>

          {/* Calculate Readiness Button */}
          {onCalculateReadiness && !studentCollege.readinessPercentage && (
            <Button
              onClick={handleCalculateReadiness}
              disabled={isCalculating}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Readiness
                </>
              )}
            </Button>
          )}

          {/* View Readiness Details Button */}
          {onCalculateReadiness && studentCollege.readinessPercentage && (
            <Button
              onClick={handleCalculateReadiness}
              disabled={isCalculating}
              size="sm"
              variant="outline"
              className="w-full mb-2"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Details & Recalculate
                </>
              )}
            </Button>
          )}

          {/* Generate Tasks Button */}
          {onGenerateTasks && (
            <Button
              onClick={handleGenerateTasks}
              disabled={isGeneratingTasks}
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingTasks ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ListTodo className="mr-2 h-4 w-4" />
                  Generate Tasks
                </>
              )}
            </Button>
          )}
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}
