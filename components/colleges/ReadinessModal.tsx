"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ReadinessBreakdown } from "./ReadinessBreakdown"
import type { ReadinessAssessment } from "@/lib/ai/prompts/readiness-calculator"

interface ReadinessModalProps {
  isOpen: boolean
  onClose: () => void
  assessment: ReadinessAssessment | null
  collegeName: string
}

export function ReadinessModal({
  isOpen,
  onClose,
  assessment,
  collegeName,
}: ReadinessModalProps) {
  if (!isOpen || !assessment) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold text-gray-900">
            College Readiness Assessment
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <ReadinessBreakdown assessment={assessment} collegeName={collegeName} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose} size="lg">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
