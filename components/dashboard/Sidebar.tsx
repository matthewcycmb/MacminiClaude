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
  { href: "/opportunity-advisor", label: "Opportunity Advisor", icon: "lightbulb" },
]

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`w-[280px] h-screen border-r border-black/5 bg-white/30 backdrop-blur-xl flex flex-col px-6 py-10 shrink-0
        fixed md:relative z-[160] md:z-[100]
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      <div className="flex items-center justify-between mb-12 px-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-forest-700 text-2xl font-bold" aria-hidden="true">school</span>
          <span className="text-xl font-bold tracking-tight font-display">Kairo</span>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Close navigation"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
        </button>
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

      <div className="pt-6 border-t border-black/5" />
    </aside>
  )
}
