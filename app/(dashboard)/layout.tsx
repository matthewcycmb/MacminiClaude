"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Sidebar from "@/components/dashboard/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="text-center">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl animate-pulse">rocket_launch</span>
          </div>
          <p className="text-subtle-gray text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  // Don't show sidebar on onboarding page
  if (pathname === "/onboarding") {
    return <>{children}</>
  }

  return (
    <div className="bg-bg-canvas text-charcoal font-sans antialiased min-h-screen overflow-hidden flex">
      {/* Background effects */}
      <div className="vapor-blob vapor-green-1"></div>
      <div className="vapor-blob vapor-green-2"></div>
      <div className="fixed inset-0 grain pointer-events-none opacity-[0.04] z-[1]"></div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-grow h-screen relative z-10 px-12 py-10 ${
        pathname?.includes("/activity-booster") ? "overflow-hidden" : "overflow-y-auto"
      }`}>
        {children}
      </main>
    </div>
  )
}
