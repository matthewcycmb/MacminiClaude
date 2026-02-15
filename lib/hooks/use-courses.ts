"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Course {
  id: string
  name: string
  type: string | null
  semester: string | null
  year: string | null
  status: string
  letterGrade: string | null
  percentage: number | null
  credits: number
  iconColor: string | null
}

interface AcademicsData {
  courses: Course[]
  profile: {
    cumulativeGpa: number | null
    semesterGpa: number | null
    gradeLevel: string | null
    graduationYear: number | null
    awards: string[]
    satScore: number | null
    actScore: number | null
  }
  user: {
    name: string | null
    image: string | null
  }
  semesterInfo: string
}

async function fetchCourses(): Promise<AcademicsData> {
  const res = await fetch("/api/academics/courses")
  if (!res.ok) throw new Error("Failed to fetch courses")
  return res.json()
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  })
}

export function useAddCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/academics/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to add course")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await fetch(`/api/academics/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update course")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/academics/courses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete course")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export type { Course, AcademicsData }
