"use client"

import { useState } from "react"
import { X, Plus, Edit2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ExtracurricularActivity } from "@/lib/ai/prompts/extracurricular-structurer"

interface ExtracurricularFormProps {
  activities: ExtracurricularActivity[]
  onChange: (activities: ExtracurricularActivity[]) => void
}

const CATEGORIES = [
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "academic", label: "Academic" },
  { value: "community_service", label: "Community Service" },
  { value: "work", label: "Work" },
  { value: "leadership", label: "Leadership" },
  { value: "other", label: "Other" },
]

export function ExtracurricularForm({ activities, onChange }: ExtracurricularFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedActivity, setEditedActivity] = useState<ExtracurricularActivity | null>(null)

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditedActivity({ ...activities[index] })
  }

  const saveEdit = () => {
    if (editingIndex !== null && editedActivity) {
      const newActivities = [...activities]
      newActivities[editingIndex] = editedActivity
      onChange(newActivities)
      setEditingIndex(null)
      setEditedActivity(null)
    }
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditedActivity(null)
  }

  const removeActivity = (index: number) => {
    const newActivities = activities.filter((_, i) => i !== index)
    onChange(newActivities)
  }

  const addActivity = () => {
    const newActivity: ExtracurricularActivity = {
      name: "",
      role: "",
      category: "other",
      hoursPerWeek: 0,
      yearsParticipated: 1,
      description: "",
    }
    onChange([...activities, newActivity])
    setEditingIndex(activities.length)
    setEditedActivity(newActivity)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      sports: "bg-blue-100 text-blue-800 border-blue-200",
      arts: "bg-purple-100 text-purple-800 border-purple-200",
      academic: "bg-green-100 text-green-800 border-green-200",
      community_service: "bg-yellow-100 text-yellow-800 border-yellow-200",
      work: "bg-orange-100 text-orange-800 border-orange-200",
      leadership: "bg-red-100 text-red-800 border-red-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[category] || colors.other
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Card key={index} className="p-4">
          {editingIndex === index && editedActivity ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Activity Name *</Label>
                  <Input
                    id={`name-${index}`}
                    value={editedActivity.name}
                    onChange={(e) =>
                      setEditedActivity({ ...editedActivity, name: e.target.value })
                    }
                    placeholder="e.g., Robotics Club"
                  />
                </div>
                <div>
                  <Label htmlFor={`role-${index}`}>Your Role *</Label>
                  <Input
                    id={`role-${index}`}
                    value={editedActivity.role}
                    onChange={(e) =>
                      setEditedActivity({ ...editedActivity, role: e.target.value })
                    }
                    placeholder="e.g., President"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`category-${index}`}>Category *</Label>
                  <select
                    id={`category-${index}`}
                    value={editedActivity.category}
                    onChange={(e) =>
                      setEditedActivity({
                        ...editedActivity,
                        category: e.target.value as ExtracurricularActivity["category"],
                      })
                    }
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`hours-${index}`}>Hours/Week *</Label>
                  <Input
                    id={`hours-${index}`}
                    type="number"
                    min="0"
                    max="40"
                    value={editedActivity.hoursPerWeek}
                    onChange={(e) =>
                      setEditedActivity({
                        ...editedActivity,
                        hoursPerWeek: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`years-${index}`}>Years *</Label>
                  <Input
                    id={`years-${index}`}
                    type="number"
                    min="0"
                    max="10"
                    value={editedActivity.yearsParticipated}
                    onChange={(e) =>
                      setEditedActivity({
                        ...editedActivity,
                        yearsParticipated: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${index}`}>Description</Label>
                <textarea
                  id={`description-${index}`}
                  value={editedActivity.description}
                  onChange={(e) =>
                    setEditedActivity({ ...editedActivity, description: e.target.value })
                  }
                  placeholder="Describe your involvement and achievements..."
                  className="w-full min-h-[80px] p-2 rounded-md border border-gray-300 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveEdit}
                  disabled={!editedActivity.name || !editedActivity.role}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{activity.name}</h3>
                    <p className="text-sm text-gray-600">{activity.role}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      activity.category
                    )}`}
                  >
                    {CATEGORIES.find((c) => c.value === activity.category)?.label}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{activity.description}</p>

                <div className="flex gap-4 text-sm text-gray-600">
                  <span>
                    <strong>{activity.hoursPerWeek}</strong> hrs/week
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{activity.yearsParticipated}</strong>{" "}
                    {activity.yearsParticipated === 1 ? "year" : "years"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(index)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeActivity(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addActivity}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Activity
      </Button>
    </div>
  )
}
