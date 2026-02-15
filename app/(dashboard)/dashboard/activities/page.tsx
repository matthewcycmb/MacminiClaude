"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import ActivityCard from "@/components/activities/ActivityCard"
import ActivityModal from "@/components/activities/ActivityModal"
import { useActivities, useSaveActivities, useDeleteActivity } from "@/lib/hooks/use-activities"
import type { Activity } from "@/lib/hooks/use-activities"

export default function ActivitiesPage() {
  const { data: session } = useSession()
  const { data: activities = [], isLoading: loading, isError: error, refetch } = useActivities()
  const saveActivitiesMutation = useSaveActivities()
  const deleteActivityMutation = useDeleteActivity()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSaveActivity = async (activity: Activity) => {
    try {
      let updated: Activity[]
      if (editingActivity) {
        updated = activities.map((a) => (a.id === activity.id ? activity : a))
      } else {
        updated = [...activities, activity]
      }

      await saveActivitiesMutation.mutateAsync(updated)
      setIsModalOpen(false)
      setEditingActivity(null)
    } catch (err) {
      console.error("Error saving activity:", err)
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await deleteActivityMutation.mutateAsync(deletingId)
    } catch (err) {
      console.error("Error deleting activity:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const openAddModal = () => {
    setEditingActivity(null)
    setIsModalOpen(true)
  }

  const totalHours = activities.reduce((sum, a) => sum + a.hoursPerWeek * 40 * a.yearsParticipated, 0)
  const ongoingCount = activities.filter((a) => a.status === "ongoing").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse" aria-hidden="true">neurology</span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Loading your activities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center glass-card rounded-[32px] p-10">
          <span className="material-symbols-outlined text-orange-400 text-4xl mb-4 block" aria-hidden="true">cloud_off</span>
          <h2 className="text-lg font-black font-display mb-2">Unable to load activities</h2>
          <p className="text-subtle-gray text-sm mb-6">Something went wrong. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end mb-12 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.25em] text-accent-green uppercase mb-1.5 block">
            Extracurriculars
          </span>
          <h1 className="text-4xl font-black tracking-tight text-black font-display leading-tight">
            Activity Portfolio.
          </h1>
          <p className="text-subtle-gray text-base font-medium font-display">
            Manage and track your extracurricular impact.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
          Add New Activity
        </button>
      </header>

      {/* Stats Strip */}
      {activities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-1">Total Activities</p>
            <p className="text-2xl font-black font-display">{activities.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-1">Impact Hours</p>
            <p className="text-2xl font-black font-display">{totalHours.toLocaleString()}</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-1">Active Now</p>
            <p className="text-2xl font-black font-display">{ongoingCount}</p>
          </div>
        </div>
      )}

      {/* Activity Cards */}
      <div className="max-w-5xl space-y-6">
        {activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-[22px] bg-black/5 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-subtle-gray text-4xl" aria-hidden="true">neurology</span>
            </div>
            <h2 className="text-2xl font-black font-display mb-3">No activities yet</h2>
            <p className="text-subtle-gray text-sm mb-8 max-w-md mx-auto">
              Start building your extracurricular portfolio by adding your activities, clubs, sports, and volunteer work.
            </p>
            <button
              onClick={openAddModal}
              className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
              Add Your First Activity
            </button>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingActivity(null)
        }}
        onSave={handleSaveActivity}
        activity={editingActivity}
      />

      {/* Delete Confirmation */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirm deletion"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative glass-card rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-red-500 text-3xl" aria-hidden="true">delete</span>
            </div>
            <h3 className="text-xl font-black font-display mb-2">Delete Activity?</h3>
            <p className="text-subtle-gray text-sm mb-8">
              This will permanently remove this activity and its achievements. This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
