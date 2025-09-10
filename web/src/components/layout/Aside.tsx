"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, BookOpen, Brain, Trophy, MessageSquare, 
  BarChart3, Users, Settings, School, 
  Sparkles, Target, Zap, BookMarked, ClipboardCheck,
  Video, Headphones, Eye, PenTool, FileText,
  Monitor, UserCheck, BrainCircuit, Shield
} from 'lucide-react';

interface AsideProps {
  currentUser: {
    name: string;
    role: string;
    avatar: string;
    organization: string;
  };
  sidebarOpen: boolean;
  sidebarExpanded: boolean;
  onSidebarExpand: (expanded: boolean) => void;
}

export default function Aside({ currentUser, sidebarOpen, sidebarExpanded, onSidebarExpand }: AsideProps) {
  const pathname = usePathname();
  
  // Extract locale from current pathname
  const locale = pathname.split('/')[1] || 'en';
  
  // Role-based navigation items
  const getNavigationItems = (role: string) => {
    const roleSpecificItems = {
      'super_admin': [
        { icon: Home, label: 'Dashboard', path: `/${locale}/super-admin/dashboard`, gradient: 'from-blue-500 to-cyan-500' },
        { icon: School, label: 'Organizations', path: `/${locale}/super-admin/organizations`, gradient: 'from-purple-500 to-pink-500' },
        { icon: Users, label: 'All Users', path: `/${locale}/super-admin/users`, gradient: 'from-green-500 to-emerald-500' },
        { icon: BarChart3, label: 'Global Analytics', path: `/${locale}/super-admin/analytics`, gradient: 'from-orange-500 to-red-500' },
        { icon: Target, label: 'Advanced Analytics', path: `/${locale}/analytics`, gradient: 'from-purple-500 to-indigo-500' },
        { icon: Settings, label: 'System Settings', path: `/${locale}/super-admin/settings`, gradient: 'from-gray-500 to-gray-700' },
      ],
      'admin': [
        { icon: Home, label: 'Dashboard', path: `/${locale}/admin/dashboard`, gradient: 'from-blue-500 to-cyan-500' },
        { icon: Users, label: 'Manage Users', path: `/${locale}/admin/users`, gradient: 'from-green-500 to-emerald-500' },
        { icon: Shield, label: 'Guardians', path: `/${locale}/admin/guardians`, gradient: 'from-teal-500 to-cyan-500' },
        { icon: BookOpen, label: 'Curriculum', path: `/${locale}/admin/curriculum`, gradient: 'from-violet-500 to-purple-500' },
        { icon: ClipboardCheck, label: 'Evaluations', path: `/${locale}/admin/evaluations`, gradient: 'from-yellow-500 to-orange-500' },
        { icon: Monitor, label: 'Smart Learning', path: `/${locale}/admin/smart`, gradient: 'from-indigo-500 to-purple-500' },
        { icon: UserCheck, label: 'Personalization', path: `/${locale}/admin/personalization`, gradient: 'from-pink-500 to-rose-500' },
        { icon: BarChart3, label: 'School Analytics', path: `/${locale}/admin/analytics`, gradient: 'from-orange-500 to-red-500' },
        { icon: Target, label: 'Advanced Analytics', path: `/${locale}/analytics`, gradient: 'from-purple-500 to-indigo-500' },
        { icon: Settings, label: 'School Settings', path: `/${locale}/admin/settings`, gradient: 'from-gray-500 to-gray-700' },
      ],
      'teacher': [
        { icon: Home, label: 'Dashboard', path: `/${locale}/teacher/dashboard`, gradient: 'from-blue-500 to-cyan-500' },
        { icon: BookOpen, label: 'My Subjects', path: `/${locale}/teacher/curriculum`, gradient: 'from-violet-500 to-purple-500' },
        { icon: ClipboardCheck, label: 'Assessments', path: `/${locale}/teacher/assessments`, gradient: 'from-yellow-500 to-orange-500' },
        { icon: Users, label: 'My Students', path: `/${locale}/teacher/students`, gradient: 'from-green-500 to-teal-500' },
        { icon: Monitor, label: 'Smart Learning', path: `/${locale}/teacher/smart`, gradient: 'from-indigo-500 to-purple-500' },
        { icon: UserCheck, label: 'Personalization', path: `/${locale}/teacher/personalization`, gradient: 'from-pink-500 to-rose-500' },
        { icon: BarChart3, label: 'Class Progress', path: `/${locale}/teacher/progress`, gradient: 'from-pink-500 to-rose-500' },
        { icon: Target, label: 'Advanced Analytics', path: `/${locale}/analytics`, gradient: 'from-purple-500 to-indigo-500' },
        { icon: FileText, label: 'Upload Content', path: `/${locale}/teacher/rag`, gradient: 'from-indigo-500 to-purple-500' },
      ],
      'student': [
        { icon: Home, label: 'Dashboard', path: `/${locale}/student/dashboard`, gradient: 'from-blue-500 to-cyan-500' },
        { icon: Brain, label: 'AI Teacher', path: `/${locale}/student/ai-teacher`, gradient: 'from-violet-600 to-indigo-600', glow: true },
        { icon: BookMarked, label: 'My Courses', path: `/${locale}/student/courses`, gradient: 'from-blue-500 to-purple-500' },
        { icon: Monitor, label: 'Smart Learning', path: `/${locale}/student/smart`, gradient: 'from-indigo-500 to-purple-500' },
        { icon: UserCheck, label: 'My Learning', path: `/${locale}/student/personalization`, gradient: 'from-pink-500 to-rose-500' },
        { icon: BrainCircuit, label: 'AI Assessments', path: `/${locale}/student/adaptive-assessment`, gradient: 'from-emerald-500 to-teal-500' },
        { icon: ClipboardCheck, label: 'My Assessments', path: `/${locale}/student/assessments`, gradient: 'from-green-500 to-emerald-500' },
        { icon: Trophy, label: 'Achievements', path: `/${locale}/student/achievements`, gradient: 'from-amber-500 to-yellow-500' },
        { icon: MessageSquare, label: 'Study Chat', path: `/${locale}/student/chat`, gradient: 'from-pink-500 to-rose-500' },
        { icon: BarChart3, label: 'My Progress', path: `/${locale}/student/progress`, gradient: 'from-cyan-500 to-blue-500' },
        { icon: Sparkles, label: 'Adaptive Teaching', path: `/${locale}/student/adaptive-teaching`, gradient: 'from-purple-500 to-pink-500' },
      ],
      'guardian': [
        { icon: Home, label: 'Dashboard', path: `/${locale}/guardian/dashboard`, gradient: 'from-blue-500 to-cyan-500' },
        { icon: Users, label: 'My Children', path: `/${locale}/guardian/children`, gradient: 'from-green-500 to-emerald-500' },
        { icon: BarChart3, label: 'Progress Reports', path: `/${locale}/guardian/reports`, gradient: 'from-blue-500 to-purple-500' },
        { icon: Target, label: 'Advanced Analytics', path: `/${locale}/analytics`, gradient: 'from-purple-500 to-indigo-500' },
        { icon: MessageSquare, label: 'Teacher Chat', path: `/${locale}/guardian/chat`, gradient: 'from-pink-500 to-rose-500' },
      ],
    };

    return roleSpecificItems[role as keyof typeof roleSpecificItems] || [];
  };

  const navigationItems = getNavigationItems(currentUser.role);

  // Learning modes for students
  const learningModes = [
    { icon: Eye, label: 'Visual', active: true },
    { icon: Headphones, label: 'Audio', active: false },
    { icon: PenTool, label: 'Interactive', active: true },
    { icon: Video, label: 'Video', active: false },
  ];
  
  return (   
    <aside 
      className={`fixed left-0 top-16 bottom-0 bg-white/80 border-r border-white/20 shadow-xl transition-all duration-300 z-40 ${
        sidebarOpen ? (sidebarExpanded ? 'w-64' : 'w-24') : 'w-0 overflow-hidden'
      }`}
      onMouseEnter={() => onSidebarExpand(true)}
      onMouseLeave={() => onSidebarExpand(false)}
    >
      <div className="flex flex-col h-full">

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const isSelected = pathname === item.path;
            return (
              <Link
                key={index}
                href={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isSelected
                    ? (item as any).glow
                      ? 'bg-gradient-to-r from-violet-100 to-blue-100 border border-violet-300 shadow-lg'
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 shadow-md'
                    : 'hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 border border-transparent'
                }`}
              >
                {(item as any).glow && isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20"></div>
                )}
                <div className={`relative p-2 rounded-lg bg-gradient-to-r ${item.gradient} group-hover:scale-110 transition-transform ${
                  isSelected ? 'scale-110 shadow-lg' : ''
                }`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className={`relative font-medium transition-all duration-300 ${
                  sidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'
                } ${
                  isSelected
                    ? (item as any).glow
                      ? 'text-violet-700 font-semibold'
                      : 'text-gray-800 font-semibold'
                    : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  {item.label}
                </span>
                {isSelected && sidebarExpanded && (
                  <Sparkles className="w-4 h-4 text-violet-600 ml-auto transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Learning Mode Selector (for students) */}
        {currentUser.role === 'student' && sidebarExpanded && (
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Learning Modes</p>
            <div className="grid grid-cols-2 gap-2">
              {learningModes.map((mode, index) => (
                <button
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    mode.active 
                      ? 'bg-gradient-to-r from-violet-100 to-blue-100 border border-violet-300' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <mode.icon className={`w-4 h-4 ${mode.active ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${mode.active ? 'text-violet-700' : 'text-gray-500'}`}>
                    {mode.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily Motivation (for students) */}
        {currentUser.role === 'student' && sidebarExpanded && (
          <div className="p-4 m-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
            <p className="text-xs font-semibold mb-1 opacity-90">Today&apos;s Goal</p>
            <p className="text-sm font-bold">Complete 3 lessons to unlock a new badge! 🎯</p>
            <div className="mt-2 bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 w-2/3 transition-all duration-500"></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
