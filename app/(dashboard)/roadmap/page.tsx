"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { School } from "lucide-react"

export default function RoadmapPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loadingRoadmap, setLoadingRoadmap] = useState(true)

  // Load roadmap on initial page load
  useEffect(() => {
    // Check if roadmap is cached in session storage
    const cachedRoadmap = sessionStorage.getItem('userRoadmap')
    if (cachedRoadmap) {
      try {
        setRoadmap(JSON.parse(cachedRoadmap))
        setLoadingRoadmap(false)
        console.log("✅ Loaded roadmap from cache (no API call)")
        return
      } catch (e) {
        console.error("Failed to parse cached roadmap:", e)
      }
    }

    // No cache found, generate new roadmap
    loadRoadmap()
  }, [])

  const loadRoadmap = async () => {
    setLoadingRoadmap(true)
    try {
      console.log("🔄 Generating new roadmap (API call)")
      const response = await fetch("/api/ai/generate-roadmap", { method: "POST" })
      const data = await response.json()
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap)
        // Cache the roadmap in session storage
        sessionStorage.setItem('userRoadmap', JSON.stringify(data.roadmap))
        console.log("✅ Roadmap cached for this session")
      } else {
        console.error("Failed to load roadmap:", data)
      }
    } catch (error) {
      console.error("Error loading roadmap:", error)
    } finally {
      setLoadingRoadmap(false)
    }
  }

  // Mock roadmap data (fallback)
  const mockRoadmap = {
    title: "Your College Application Roadmap",
    description: "Personalized plan for Junior Year student",
    phases: [
      {
        id: 1,
        title: "Junior Year Spring (Now - June 2026)",
        description: "Focus on testing, college research, and building your profile",
        startDate: new Date().toISOString(),
        endDate: new Date(2026, 5, 30).toISOString(),
        tasks: [
          {
            id: 1,
            title: "Browse 10 colleges on Common App",
            description: "Explore different types of schools to understand what you're looking for",
            category: "research",
            priority: "medium",
            isQuickWin: true,
            pointsValue: 10,
            status: "pending",
          },
          {
            id: 2,
            title: "Take SAT or ACT practice test",
            description: "Establish baseline score and identify areas for improvement",
            category: "testing",
            priority: "high",
            isQuickWin: false,
            pointsValue: 25,
            status: "pending",
          },
          {
            id: 3,
            title: "Research 10 Computer Science programs",
            description: "Look for schools with strong CS programs that match your profile",
            category: "research",
            priority: "medium",
            isQuickWin: false,
            pointsValue: 25,
            status: "pending",
          },
          {
            id: 7,
            title: "Research Stanford CS + Social Good program",
            description: "Explore Stanford's unique CS program focusing on social impact",
            category: "research",
            priority: "high",
            isQuickWin: false,
            pointsValue: 25,
            status: "pending",
            collegeName: "Stanford University",
            collegeId: "stanford-123",
          },
          {
            id: 4,
            title: "Identify 2 teachers for recommendations",
            description: "Choose teachers who know you well and can speak to your strengths",
            category: "recommendations",
            priority: "medium",
            isQuickWin: true,
            pointsValue: 10,
            status: "pending",
          },
        ],
      },
      {
        id: 2,
        title: "Summer Before Senior Year",
        description: "Use this time for essays, visits, and final prep",
        startDate: new Date(2026, 6, 1).toISOString(),
        endDate: new Date(2026, 8, 1).toISOString(),
        tasks: [
          {
            id: 5,
            title: "Draft Common App personal statement",
            description: "Write your main essay - aim for 500-650 words",
            category: "essays",
            priority: "high",
            isQuickWin: false,
            pointsValue: 50,
            status: "pending",
          },
          {
            id: 6,
            title: "Visit 3-5 top choice colleges",
            description: "Schedule campus tours and information sessions",
            category: "visits",
            priority: "medium",
            isQuickWin: false,
            pointsValue: 25,
            status: "pending",
          },
          {
            id: 8,
            title: "Draft MIT 'Why MIT' supplemental essay",
            description: "Write about specific programs and opportunities at MIT that interest you (250 words)",
            category: "essays",
            priority: "high",
            isQuickWin: false,
            pointsValue: 50,
            status: "pending",
            collegeName: "MIT",
            collegeId: "mit-456",
          },
        ],
      },
    ],
  }

  const handleRegenerateRoadmap = async () => {
    setIsGenerating(true)
    // Clear cache to force fresh generation
    sessionStorage.removeItem('userRoadmap')

    try {
      console.log("🔄 Regenerating roadmap (API call)")
      const response = await fetch("/api/ai/generate-roadmap", { method: "POST" })
      const data = await response.json()
      console.log("Generated roadmap:", data)

      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap)
        // Update cache with new roadmap
        sessionStorage.setItem('userRoadmap', JSON.stringify(data.roadmap))
        alert("✅ Roadmap regenerated successfully!")
      } else {
        alert("⚠️ Error: " + (data.error || data.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error:", error)
      alert("❌ Error generating roadmap: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsGenerating(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      testing: "bg-purple-100 text-purple-700",
      essays: "bg-blue-100 text-blue-700",
      research: "bg-green-100 text-green-700",
      applications: "bg-red-100 text-red-700",
      financial_aid: "bg-yellow-100 text-yellow-700",
      extracurriculars: "bg-pink-100 text-pink-700",
      recommendations: "bg-indigo-100 text-indigo-700",
      visits: "bg-orange-100 text-orange-700",
    }
    return colors[category] || "bg-gray-100 text-gray-700"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-700 border-red-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      medium: "bg-blue-100 text-blue-700 border-blue-300",
      low: "bg-gray-100 text-gray-700 border-gray-300",
    }
    return colors[priority] || "bg-gray-100 text-gray-700"
  }

  // Use real roadmap if available, otherwise fallback to mock
  const displayRoadmap = roadmap || mockRoadmap

  if (loadingRoadmap) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading your personalized roadmap...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{displayRoadmap.title}</h1>
          <p className="text-gray-600 mt-1">{displayRoadmap.description}</p>
          {roadmap && (
            <p className="text-xs text-green-600 mt-1">✅ Personalized based on your profile</p>
          )}
        </div>
        <Button onClick={handleRegenerateRoadmap} disabled={isGenerating}>
          {isGenerating ? "Regenerating..." : "🔄 Regenerate Roadmap"}
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {displayRoadmap.phases.map((phase: any, phaseIndex: number) => (
          <Card key={phase.id || `phase-${phaseIndex}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{phase.title}</CardTitle>
                  <CardDescription>{phase.description}</CardDescription>
                </div>
                <div className="text-sm text-gray-500">
                  {phase.tasks.length} tasks
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phase.tasks.map((task: any, taskIndex: number) => (
                  <div
                    key={task.id || taskIndex}
                    className={`p-4 border rounded-lg hover:shadow-md transition ${
                      task.status === "completed"
                        ? "bg-green-50 border-green-200"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {task.isQuickWin && "⚡ "}
                            {task.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                              task.category
                            )}`}
                          >
                            {task.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          {(task as any).collegeName && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-indigo-50 border-indigo-300 text-indigo-700">
                              <School className="h-3 w-3" />
                              {(task as any).collegeName}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            +{task.pointsValue} points
                          </span>
                          {task.isQuickWin && (
                            <span className="text-xs text-blue-600 font-medium">
                              Quick Win (&lt;15 min)
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        {task.status === "completed" ? (
                          <div className="text-green-600 font-medium">✓ Done</div>
                        ) : (
                          <Button size="sm" variant="outline">
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {displayRoadmap.phases.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Roadmap Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Complete your profile to generate a personalized roadmap
            </p>
            <Button onClick={handleRegenerateRoadmap}>
              Generate Roadmap
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
