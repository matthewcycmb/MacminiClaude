"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "grid_view" },
  { href: "/dashboard/academics", label: "Academics", icon: "school" },
  { href: "/dashboard/activities", label: "Activities", icon: "sports_esports" },
  { href: "/dashboard/activity-booster", label: "Activity Booster", icon: "bolt" },
  { href: "/strategic-path", label: "Strategic Path", icon: "map" },
  { href: "/colleges", label: "Colleges", icon: "account_balance" },
  { href: "/opportunity-radar", label: "Opportunity Radar", icon: "radar" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[280px] h-screen border-r border-black/5 bg-white/30 backdrop-blur-xl relative z-[100] flex flex-col px-6 py-10 shrink-0">
      <div className="flex items-center gap-3 mb-12 px-4">
        <span className="material-symbols-outlined text-forest-700 text-2xl font-bold" aria-hidden="true">school</span>
        <span className="text-xl font-bold tracking-tight font-display">Kairo</span>
      </div>

      <nav className="space-y-1.5 flex-grow">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-forest-700/10 text-forest-700 font-semibold"
                  : "text-subtle-gray hover:bg-black/5 font-medium"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-black/5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-subtle-gray hover:bg-black/5 transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">settings</span>
          Settings
        </Link>
      </div>
    </aside>
  )
}
