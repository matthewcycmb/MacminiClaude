"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import type { ReadinessAssessment } from "@/lib/ai/prompts/readiness-calculator"

interface ReadinessBreakdownProps {
  assessment: ReadinessAssessment
  collegeName: string
}

export function ReadinessBreakdown({ assessment, collegeName }: ReadinessBreakdownProps) {
  const { readinessPercentage, category, scores, strengths, gaps, nextSteps } = assessment

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "safety":
        return "text-green-700 bg-green-50 border-green-200"
      case "target":
        return "text-blue-700 bg-blue-50 border-blue-200"
      case "reach":
        return "text-orange-700 bg-orange-50 border-orange-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-600"
    if (percentage >= 50) return "bg-blue-600"
    return "bg-orange-600"
  }

  return (
    <div className="space-y-6">
      {/* Overall Readiness */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Readiness for {collegeName}
          </h3>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getCategoryColor(
              category
            )}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-gray-900">
              {readinessPercentage}%
            </span>
            <span className="text-sm text-gray-600">Overall Readiness</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`${getProgressColor(
                readinessPercentage
              )} h-4 rounded-full transition-all duration-500`}
              style={{ width: `${readinessPercentage}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          {readinessPercentage >= 75 &&
            "You're in a strong position for this college!"}
          {readinessPercentage >= 50 &&
            readinessPercentage < 75 &&
            "You're on track - continue strengthening your profile."}
          {readinessPercentage < 50 &&
            "This is a reach school - focus on the action items below to improve your chances."}
        </p>
      </Card>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Score Breakdown</h4>
        <div className="space-y-4">
          {/* Academics */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Academics</span>
              <span className="text-sm font-bold text-gray-900">
                {scores.academics} / 40
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(scores.academics / 40) * 100}%` }}
              />
            </div>
          </div>

          {/* Test Scores */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Test Scores</span>
              <span className="text-sm font-bold text-gray-900">
                {scores.testScores} / 25
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${(scores.testScores / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Extracurriculars */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Extracurriculars
              </span>
              <span className="text-sm font-bold text-gray-900">
                {scores.extracurriculars} / 20
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${(scores.extracurriculars / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Application Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Application Progress
              </span>
              <span className="text-sm font-bold text-gray-900">
                {scores.applicationProgress} / 15
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${(scores.applicationProgress / 15) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Strengths */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h4 className="text-lg font-bold text-gray-900">Your Strengths</h4>
        </div>
        <ul className="space-y-2">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">•</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Gaps */}
      {gaps.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h4 className="text-lg font-bold text-gray-900">Areas to Improve</h4>
          </div>
          <ul className="space-y-2">
            {gaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-bold text-gray-900">Next Steps</h4>
        </div>
        <ul className="space-y-3">
          {nextSteps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-gray-700 p-3 bg-blue-50 rounded-lg border border-blue-100"
            >
              <span className="font-bold text-blue-600 mt-0.5">
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
