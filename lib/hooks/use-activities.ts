"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface Activity {
  id: string
  name: string
  role: string
  category: string
  hoursPerWeek: number
  yearsParticipated: number
  description: string
  achievements: string[]
  status: "ongoing" | "seasonal" | "completed"
}

async function fetchActivities(): Promise<{ activities: Activity[] }> {
  const res = await fetch("/api/activities")
  if (!res.ok) throw new Error("Failed to fetch activities")
  return res.json()
}

export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
    select: (data) => data.activities || [],
  })
}

export function useSaveActivities() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (activities: Activity[]) => {
      const res = await fetch("/api/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activities }),
      })
      if (!res.ok) throw new Error("Failed to save activities")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/activities?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete activity")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export type { Activity }
