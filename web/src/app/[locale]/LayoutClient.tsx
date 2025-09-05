"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Aside from '@/components/layout/Aside';
import Topbar from "@/components/layout/Topbar";
import Footer from '@/components/layout/Footer';
import NavigationTabs from '@/components/layout/NavigationTabs';

interface LayoutClientProps {
  children: React.ReactNode;
  user: any;
  locale: string;
}

export default function LayoutClient({ children, user, locale }: LayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const { data: session, status } = useSession();

  // Use session data if available, fallback to server-side user data
  const currentUser = session?.user || user;
  
  // Transform user data for components
  const transformedUser = currentUser ? {
    name: currentUser.name || 'User',
    role: (currentUser as any).role || currentUser.role,
    avatar: currentUser.name?.charAt(0).toUpperCase() || 'U',
    organization: (currentUser as any).organizationId || 'Default Organization'
  } : null;

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div className='flex min-h-screen'>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen'>
      {/* Sidebar - Fixed position, covers full height */}
      {transformedUser && (
        <Aside 
          sidebarOpen={sidebarOpen}
          sidebarHovered={sidebarHovered}
          currentUser={transformedUser}
          onSidebarHover={setSidebarHovered}
        />
      )}

      {/* Main content area - positioned to the right of sidebar */}
      <div className="flex flex-col flex-1 min-h-screen transition-all duration-300">
        {/* Topbar - takes remaining width */}
        <Topbar />
        
        {/* Navigation Tabs - Only show when user is logged in */}
        {transformedUser && (
          <NavigationTabs 
            userRole={transformedUser.role} 
          />
        )}
        
        {/* Main Content Area */}
        <main className="flex-1 relative">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
