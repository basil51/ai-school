import React from 'react';
import { X, Menu, Sparkles, Zap, Award, Globe, ChevronDown, User, Settings, LogOut } from 'lucide-react';

interface TopNewProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser?: {
    role: string;
    name: string;
    avatar: string;
    organization: string;
  };
}

export default function TopNew({ sidebarOpen, setSidebarOpen, currentUser }: TopNewProps) {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  
  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 transition-all duration-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-violet-600 to-blue-600 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                AI Academy
              </span>
            </div>
          </div>

          {/* Center - Learning Streak for Students */}
          {currentUser?.role === 'student' && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">7 Day Streak!</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">EN</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {currentUser?.avatar || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-700">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'user'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-blue-50">
                    <p className="font-semibold text-gray-700">{currentUser?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{currentUser?.organization || 'Organization'}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">My Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}