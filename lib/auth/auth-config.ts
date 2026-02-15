import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma) as any, // Commented out - using JWT sessions instead
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For MVP, we'll implement this later when we have password hashing
        // For now, just return null to skip credentials auth
        return null
      }
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async signIn({ user }: any) {
      // Track login for streak
      await trackLogin(user.id)
      return true
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
}

async function trackLogin(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) return

    const now = new Date()
    const lastLogin = user.lastLoginAt

    let newStreak = user.loginStreak || 0

    if (lastLogin) {
      const daysSinceLastLogin = Math.floor(
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastLogin === 1) {
        // Consecutive day
        newStreak++
      } else if (daysSinceLastLogin > 1) {
        // Streak broken, reset
        newStreak = 1
      } else if (daysSinceLastLogin === 0) {
        // Same day, don't increment
        return
      }
    } else {
      // First login
      newStreak = 1
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: now,
        loginStreak: newStreak,
        longestLoginStreak: Math.max(newStreak, user.longestLoginStreak || 0),
        totalLogins: { increment: 1 },
        totalPoints: { increment: 5 }  // Login points
      }
    })

    // Check for streak achievements
    if (newStreak === 3) await unlockAchievement(userId, 'early_bird')
    if (newStreak === 7) await unlockAchievement(userId, 'week_warrior')
  } catch (error) {
    console.error('Error tracking login:', error)
  }
}

async function unlockAchievement(userId: string, achievementKey: string) {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { key: achievementKey }
    })

    if (!achievement) return

    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      }
    })

    if (existing) return

    // Unlock achievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id
      }
    })

    // Award points
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: achievement.pointsValue }
      }
    })
  } catch (error) {
    console.error('Error unlocking achievement:', error)
  }
}
