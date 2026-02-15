"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface College {
  id: string
  name: string
  shortName?: string
  location: string
  type: string
  size: string
  acceptanceRate?: number
  avgGPA?: number
}

interface CollegeSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCollege: (college: College) => Promise<void>
}

export function CollegeSearchModal({ isOpen, onClose, onAddCollege }: CollegeSearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<College[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingCollegeId, setAddingCollegeId] = useState<string | null>(null)

  useEffect(() => {
    const searchColleges = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/colleges/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.colleges || [])
        }
      } catch (error) {
        console.error("Error searching colleges:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchColleges, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleAddCollege = async (college: College) => {
    setAddingCollegeId(college.id)
    try {
      await onAddCollege(college)
      setQuery("")
      setResults([])
      onClose()
    } catch (error) {
      console.error("Error adding college:", error)
    } finally {
      setAddingCollegeId(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Search Colleges</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by college name (e.g., Stanford, UCLA, MIT...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Search from 57 top colleges including Ivies, UCs, state flagships, and more
          </p>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {query.length < 2 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Start typing to search colleges...</p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No colleges found matching "{query}"</p>
              <p className="text-sm mt-2">Try searching for a different name</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((college) => (
                <Card key={college.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {college.name}
                      </h3>
                      <div className="flex gap-3 text-sm text-gray-600 mb-2">
                        <span>{college.location}</span>
                        <span>•</span>
                        <span className="capitalize">{college.type}</span>
                        {college.acceptanceRate && (
                          <>
                            <span>•</span>
                            <span>{college.acceptanceRate}% acceptance</span>
                          </>
                        )}
                      </div>
                      {college.avgGPA && (
                        <div className="text-xs text-gray-500">
                          Avg GPA: {college.avgGPA}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleAddCollege(college)}
                      disabled={addingCollegeId === college.id}
                      size="sm"
                    >
                      {addingCollegeId === college.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
