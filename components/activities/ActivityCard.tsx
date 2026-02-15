"use client"

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

const categoryConfig: Record<string, { icon: string; color: string; bg: string; bullet: string }> = {
  sports: { icon: "sports_tennis", color: "text-orange-500", bg: "bg-orange-500/10", bullet: "bg-orange-500" },
  arts: { icon: "palette", color: "text-pink-500", bg: "bg-pink-500/10", bullet: "bg-pink-500" },
  academic: { icon: "smart_toy", color: "text-blue-500", bg: "bg-blue-500/10", bullet: "bg-blue-500" },
  community_service: { icon: "volunteer_activism", color: "text-purple-500", bg: "bg-purple-500/10", bullet: "bg-purple-500" },
  work: { icon: "work", color: "text-amber-600", bg: "bg-amber-500/10", bullet: "bg-amber-600" },
  leadership: { icon: "groups", color: "text-emerald-500", bg: "bg-emerald-500/10", bullet: "bg-emerald-500" },
  other: { icon: "category", color: "text-gray-500", bg: "bg-gray-500/10", bullet: "bg-gray-500" },
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  ongoing: { label: "Ongoing", bg: "bg-emerald-500/10", text: "text-emerald-600" },
  seasonal: { label: "Seasonal", bg: "bg-gray-500/10", text: "text-gray-600" },
  completed: { label: "Completed", bg: "bg-blue-500/10", text: "text-blue-600" },
}

interface ActivityCardProps {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (id: string) => void
}

export default function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const cat = categoryConfig[activity.category] || categoryConfig.other
  const status = statusConfig[activity.status] || statusConfig.ongoing

  return (
    <div className="glass-card rounded-[32px] p-8 group hover:border-black/10 transition-all">
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className={`w-20 h-20 rounded-[22px] ${cat.bg} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined ${cat.color} text-4xl`} aria-hidden="true">
              {cat.icon}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold">{activity.name}</h2>
              <span className={`px-3 py-1 rounded-full ${status.bg} ${status.text} text-xs font-bold tracking-widest uppercase`}>
                {status.label}
              </span>
            </div>
            <p className="text-lg font-medium text-charcoal/80">{activity.role}</p>
            <div className="flex items-center gap-4 mt-2 text-subtle-gray">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
                {activity.hoursPerWeek} hrs/week
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">calendar_month</span>
                {activity.yearsParticipated} {activity.yearsParticipated === 1 ? "Year" : "Years"}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(activity)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            aria-label={`Edit ${activity.name}`}
          >
            <span className="material-symbols-outlined text-subtle-gray" aria-hidden="true">edit</span>
          </button>
          <button
            onClick={() => onDelete(activity.id)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2"
            aria-label={`Delete ${activity.name}`}
          >
            <span className="material-symbols-outlined text-subtle-gray hover:text-red-500 transition-colors" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>

      {activity.achievements.length > 0 && (
        <div className="sm:pl-[104px]">
          <h3 className="text-xs font-bold text-subtle-gray uppercase tracking-widest mb-3">
            Key Achievements
          </h3>
          <ul className="space-y-3" role="list">
            {activity.achievements.map((achievement, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed">
                <span className={`w-1.5 h-1.5 rounded-full ${cat.bullet} mt-2 shrink-0`}></span>
                {achievement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activity.achievements.length === 0 && activity.description && (
        <div className="sm:pl-[104px]">
          <p className="text-sm text-subtle-gray leading-relaxed">{activity.description}</p>
        </div>
      )}
    </div>
  )
}
