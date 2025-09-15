"use client";

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Aside from '@/components/layout/Aside';
import Topbar from "@/components/layout/Topbar";
import Footer from '@/components/layout/Footer';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';

interface LayoutClientProps {
  children: React.ReactNode;
  user: any;
  locale: string;
}

export default function LayoutClient({ children, user, locale }: LayoutClientProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  // Use session data if available, fallback to server-side user data
  const currentUser = session?.user || user;
  console.log(locale);
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
    <div className="flex flex-col bg-gray-50">
      <Topbar               
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 pt-16">
        {transformedUser && ( 
        <Aside 
          currentUser={transformedUser}
          sidebarOpen={sidebarOpen}
          sidebarExpanded={sidebarExpanded}
          onSidebarExpand={setSidebarExpanded}
        />
        )}
        {/* Main content area - positioned to the right of sidebar */}
        <main className={`flex-1 transition-all duration-300 ${
                  sidebarOpen ? (sidebarExpanded ? 'ml-64' : 'ml-24') : 'ml-0'
                }`}>
          <div className="h-full overflow-y-auto">        
            <div className="p-6">
              {children}
            </div>
              <Footer />
          </div>        
        </main>
      </div>
      
      {/* Floating Feedback Button */}
      <FeedbackButton 
        context={{
          page: window?.location?.pathname || 'unknown',
          feature: 'global_feedback'
        }}
      />
    </div>  
  );
}
