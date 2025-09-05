// components/layout/NavigationTabs.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Building,
  Crown,
  UserCheck,
  BrainCircuit,
  Target,
  TrendingUp
} from 'lucide-react'

interface NavigationTabsProps {
  userRole: string
  organizationId?: string
}

const roleBasedTabs = {
  SUPER_ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/super-admin/organizations', icon: Building },
    { name: 'Users', href: '/super-admin/users', icon: Users },
    { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teachers', href: '/admin/teachers', icon: UserCheck },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  TEACHER: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Subjects', href: '/teacher/subjects', icon: BookOpen },
    { name: 'Curriculum', href: '/teacher/curriculum', icon: GraduationCap },
    { name: 'Assessments', href: '/teacher/assessments', icon: ClipboardCheck },
    { name: 'Students', href: '/teacher/students', icon: Users },
    { name: 'Analytics', href: '/teacher/analytics', icon: TrendingUp },
  ],
  STUDENT: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Teacher', href: '/ai-teacher', icon: BrainCircuit },
    { name: 'My Subjects', href: '/student/subjects', icon: BookOpen },
    { name: 'Assessments', href: '/student/assessments', icon: ClipboardCheck },
    { name: 'Progress', href: '/student/progress', icon: Target },
    { name: 'Chat', href: '/student/chat', icon: MessageSquare },
  ],
  GUARDIAN: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Children', href: '/guardian/children', icon: Users },
    { name: 'Progress', href: '/guardian/progress', icon: TrendingUp },
    { name: 'Messages', href: '/guardian/messages', icon: MessageSquare },
  ],
}

export default function NavigationTabs({ userRole, organizationId }: NavigationTabsProps) {
  const pathname = usePathname()
  const tabs = roleBasedTabs[userRole as keyof typeof roleBasedTabs] || []

  if (tabs.length === 0) return null

  return (
    <nav className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50 dark:border-gray-800">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (pathname.startsWith(tab.href) && tab.href !== '/dashboard')
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300 dark:text-gray-300 dark:hover:text-blue-400"
                )}
              >
                <tab.icon className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-blue-600 dark:text-blue-400" : ""
                )} />
                {tab.name}
                
                {/* Special indicators */}
                {tab.name === 'AI Teacher' && (
                  <div className="relative">
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
                
                {userRole === 'SUPER_ADMIN' && tab.name === 'Dashboard' && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}