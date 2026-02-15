"use client"

import { useQuery } from "@tanstack/react-query"

interface DashboardData {
  user: {
    name: string | null
    image: string | null
    email: string
    totalPoints: number
    currentLevel: number
    loginStreak: number
  }
  profile: {
    gradeLevel: string | null
    graduationYear: number | null
    gpa: number | null
    gpaScale: number | null
    intendedMajors: string[]
    careerInterests: string[]
    location: string | null
  }
  stats: {
    readinessPercentage: number
    readinessDelta: number
    profileRank: string
    competitivenessPercentile: string
    impactHours: number
    targetSchools: number
    narrativeTheme: string
    narrativeDescription: string
    completedTasks: number
    totalTasks: number
  }
  nextMoves: Array<{
    id: string
    title: string
    description: string | null
    category: string
    priority: string
    dueDate: string | null
    isQuickWin: boolean
    pointsValue: number
  }>
  gaps: Array<{
    title: string
    description: string
  }>
  colleges: Array<{
    id: string
    name: string
    listCategory: string | null
    readinessPercentage: number | null
  }>
  collegeInsights: Array<{
    id: string
    name: string
    shortName: string | null
    location: string | null
    websiteUrl: string | null
    category: string
    fitScore: number
    aiInsight: string
    strongPrograms: string[]
  }>
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard")
  if (!res.ok) throw new Error("Failed to fetch dashboard")
  return res.json()
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  })
}

export type { DashboardData }
