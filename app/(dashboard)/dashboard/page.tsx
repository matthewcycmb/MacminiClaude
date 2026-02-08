"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()

  // Mock data for now
  const mockStats = {
    level: 1,
    totalPoints: 60,
    pointsToNextLevel: 100,
    loginStreak: 1,
    tasksCompleted: 0,
    totalTasks: 8,
  }

  const mockQuickWins = [
    {
      id: 1,
      title: "Browse 5 colleges on Common App",
      time: "5 min",
      points: 10,
    },
    {
      id: 2,
      title: "Bookmark 3 scholarship websites",
      time: "3 min",
      points: 10,
    },
    {
      id: 3,
      title: "Draft a college essay hook",
      time: "10 min",
      points: 10,
    },
  ]

  const mockUpcomingTasks = [
    {
      id: 1,
      title: "Research 10 target colleges",
      dueDate: "In 5 days",
      priority: "high",
    },
    {
      id: 2,
      title: "Request teacher recommendation",
      dueDate: "In 12 days",
      priority: "medium",
    },
    {
      id: 3,
      title: "Complete Common App account setup",
      dueDate: "In 18 days",
      priority: "medium",
    },
  ]

  const levelProgress = (mockStats.totalPoints / mockStats.pointsToNextLevel) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || "Student"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your college application progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Level Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {mockStats.level}
            </div>
            <div className="mt-2">
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {mockStats.totalPoints}/{mockStats.pointsToNextLevel} points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Login Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {mockStats.loginStreak} 🔥
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Keep it going!
            </p>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tasks Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {mockStats.tasksCompleted}/{mockStats.totalTasks}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This week
            </p>
          </CardContent>
        </Card>

        {/* Points Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {mockStats.totalPoints}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Wins Widget */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Today's Quick Wins</CardTitle>
            <CardDescription>
              Complete these mini-tasks in under 15 minutes each
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockQuickWins.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-500">
                    {task.time} • +{task.points} points
                  </div>
                </div>
                <Button size="sm">Start</Button>
              </div>
            ))}

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Complete all quick wins to earn bonus points! 🎯
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Upcoming Tasks</CardTitle>
            <CardDescription>
              Your next important deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{task.dueDate}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))}

            <Link href="/tasks">
              <Button variant="link" className="w-full">
                View All Tasks →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* This Week's Tip */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>💡 This Week's Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-semibold text-blue-900 mb-2">
              Start Your College List Early
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              Don't wait until senior year! Start researching colleges now. Create a balanced list of reach, target, and safety schools. Use tools like College Board's BigFuture or CollegeVine to explore schools that match your profile. Aim for 8-12 schools across all categories.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
