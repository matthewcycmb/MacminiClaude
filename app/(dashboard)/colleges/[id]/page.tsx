"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Users, TrendingUp, Calendar, BookOpen, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface College {
  id: string
  name: string
  shortName?: string
  location?: string
  state?: string
  type: string
  size?: string
  setting?: string
  acceptanceRate?: number
  avgGPA?: number
  sat25thPercentile?: number
  sat75thPercentile?: number
  act25thPercentile?: number
  act75thPercentile?: number
  strongPrograms?: string[]
  websiteUrl?: string
  applicationDeadlineRegular?: string
  supplementalEssaysCount?: number
  undergraduateEnrollment?: number
}

interface StudentCollege {
  id: string
  listCategory?: string
  readinessPercentage?: number
  applicationStatus: string
  College: College
}

interface Task {
  id: string
  title: string
  description?: string
  category: string
  priority: string
  dueDate?: string
  completed: boolean
  isQuickWin: boolean
  pointsValue: number
}

export default function CollegeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [studentCollege, setStudentCollege] = useState<StudentCollege | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingTasks, setGeneratingTasks] = useState(false)

  useEffect(() => {
    fetchCollegeDetails()
    fetchCollegeTasks()
  }, [params.id])

  const fetchCollegeDetails = async () => {
    try {
      const res = await fetch(`/api/colleges/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setStudentCollege(data.studentCollege)
      }
    } catch (error) {
      console.error("Error fetching college details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollegeTasks = async () => {
    try {
      const res = await fetch(`/api/colleges/${params.id}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching college tasks:", error)
    }
  }

  const handleGenerateTasks = async () => {
    setGeneratingTasks(true)
    try {
      const res = await fetch(`/api/colleges/${params.id}/generate-tasks`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        console.log("Generated tasks:", data)
        // Refresh tasks
        await fetchCollegeTasks()
      }
    } catch (error) {
      console.error("Error generating tasks:", error)
    } finally {
      setGeneratingTasks(false)
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "reach":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "target":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "safety":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!studentCollege) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>College not found</p>
        <Button onClick={() => router.push("/colleges")} className="mt-4">
          Back to Colleges
        </Button>
      </div>
    )
  }

  const college = studentCollege.College

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/colleges")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Colleges
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{college.name}</h1>
            {college.location && (
              <p className="text-gray-600 mt-1 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {college.location}
              </p>
            )}
          </div>
          {studentCollege.listCategory && (
            <Badge className={getCategoryColor(studentCollege.listCategory)}>
              {studentCollege.listCategory.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Readiness Card */}
      {studentCollege.readinessPercentage !== null && studentCollege.readinessPercentage !== undefined && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Readiness</CardTitle>
            <CardDescription>How prepared you are for this college</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{studentCollege.readinessPercentage}%</span>
                <span className="text-sm text-gray-600">Overall Readiness</span>
              </div>
              <Progress value={studentCollege.readinessPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* College Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {college.acceptanceRate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{college.acceptanceRate}%</p>
            </CardContent>
          </Card>
        )}

        {college.avgGPA && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{college.avgGPA}</p>
            </CardContent>
          </Card>
        )}

        {college.sat25thPercentile && college.sat75thPercentile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">SAT Range</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {college.sat25thPercentile} - {college.sat75thPercentile}
              </p>
            </CardContent>
          </Card>
        )}

        {college.undergraduateEnrollment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Undergraduate Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{college.undergraduateEnrollment.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}

        {college.applicationDeadlineRegular && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Application Deadline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Date(college.applicationDeadlineRegular).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {college.type && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{college.type}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Strong Programs */}
      {college.strongPrograms && college.strongPrograms.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Strong Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {college.strongPrograms.map((program, index) => (
                <Badge key={index} variant="secondary">
                  {program}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* College-Specific Tasks */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>College-Specific Tasks</CardTitle>
              <CardDescription>
                Tasks tailored for your {college.shortName || college.name} application
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateTasks}
              disabled={generatingTasks}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generatingTasks ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Tasks"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p className="mb-2">No tasks generated yet</p>
              <p className="text-sm">Click "Generate Tasks" to create a personalized task list for this college</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg ${
                    task.completed ? "bg-gray-50 opacity-60" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${task.completed ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        {task.isQuickWin && (
                          <Badge variant="secondary" className="text-xs">
                            Quick Win
                          </Badge>
                        )}
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {task.pointsValue} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Link */}
      {college.websiteUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Visit College Website</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={college.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
            >
              {college.websiteUrl}
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
