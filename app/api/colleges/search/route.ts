import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

// GET /api/colleges/search?q=stanford
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Search colleges by name or short name
    const colleges = await prisma.college.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            shortName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 10, // Limit to 10 results
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ colleges })
  } catch (error) {
    console.error("Error searching colleges:", error)
    return NextResponse.json(
      { error: "Failed to search colleges" },
      { status: 500 }
    )
  }
}
