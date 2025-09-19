"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, LogOut, Users, Building2, Globe, X, MessageCircle, Brain, BookOpen, FileText, BarChart3, Sparkles,
  ChevronDown, Zap, Award, Moon, Sun, Bell, Search, Menu
} from "lucide-react";
import { locales, Locale } from "@/lib/i18n";
import { useTranslations } from "@/lib/useTranslations";

interface HeaderProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function Topbar({ sidebarOpen, onSidebarToggle }: HeaderProps) {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = params.locale as Locale;
  const homeHref = session ? `/${currentLocale}/dashboard` : `/${currentLocale}`;
  const userRole = (session as any)?.role;
  const { dict } = useTranslations();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [_searchOpen, _setSearchOpen] = useState(false);

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin': return { text: dict?.roles?.superAdmin || 'Super Admin', variant: 'destructive' as const };
      case 'admin': return { text: dict?.roles?.admin || 'Admin', variant: 'destructive' as const };
      case 'teacher': return { text: dict?.roles?.teacher || 'Teacher', variant: 'default' as const };
      case 'guardian': return { text: dict?.roles?.guardian || 'Guardian', variant: 'secondary' as const };
      case 'student': return { text: dict?.roles?.student || 'Student', variant: 'outline' as const };
      default: return { text: dict?.roles?.user || 'User', variant: 'outline' as const };
    }
  };

  const getCurrentUser = () => {
    return {
      name: session?.user?.name || 'User',
      role: userRole,
      avatar: userRole === 'student' ? '👩‍🎓' : userRole === 'teacher' ? '👨‍🏫' : userRole === 'admin' ? '👨‍💼' : '👤',
      organization: 'AI Academy'
    };
  };

  const currentUser = getCurrentUser();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-4">
        <button
            onClick={onSidebarToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {/* Logo and Brand */}
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-violet-600 to-blue-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              {currentLocale === 'ar' ? 'أكاديمية اجواء العلم بالذكاء الصناعي' : 'AI Academy'}
            </span>
          </Link>
        </div>

        {/* Center Section - Search Bar (for authenticated users) */}
        {session && (
          <div className="flex-1 max-w-xl mx-6 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search lessons, topics, assessments..."
                className="pl-10 pr-4 w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-700 transition-colors"
                onFocus={() => _setSearchOpen(true)}
                onBlur={() => _setSearchOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Center Section - Learning Streak for Students */}
        {session && currentUser.role === 'student' && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">7 Day Streak!</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        )}

        {/* Right Section */}
        {session && (
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  {currentLocale === 'ar' ? 'العربية' : 'English'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {locales.map((locale) => {
                  const newPathname = pathname.replace(`/${currentLocale}`, `/${locale}`);
                  return (
                    <DropdownMenuItem key={locale} asChild>
                      <Link href={newPathname}>
                        {locale === 'ar' ? 'العربية' : 'English'}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="hidden md:flex"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs bg-orange-500 hover:bg-orange-500">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <div 
              className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={(e) => {
                // Check if mouse is moving to the dropdown menu
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
                  // Add a small delay to allow mouse to move to dropdown
                  setTimeout(() => {
                    if (!e.currentTarget.querySelector(':hover')) {
                      setIsUserDropdownOpen(false);
                    }
                  }, 100);
                }
              }}
            >
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 transition-all duration-300"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm">
                    {session?.user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-700">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isUserDropdownOpen && (
                <div 
                  className="absolute right-0 top-full w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  onMouseEnter={() => setIsUserDropdownOpen(true)}
                  onMouseLeave={() => {
                    setTimeout(() => setIsUserDropdownOpen(false), 100);
                  }}
                >
                  {/* Welcome Header */}
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-blue-50">
                    <p className="font-semibold text-gray-700">
                      {dict?.userMenu?.welcomeBack || "Welcome back,"} {currentUser.name}
                    </p>
                    <p className="text-sm text-gray-500">{session?.user?.email}</p>
                    <div className="mt-2">
                      <Badge variant={getRoleDisplay(userRole).variant} className="text-xs">
                        {getRoleDisplay(userRole).text}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <Link 
                      href={`/${currentLocale}/dashboard`}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{dict?.userMenu?.dashboard || "Dashboard"}</span>
                    </Link>
                    
                    {userRole === 'student' && (
                      <>
                        <Link 
                          href={`/${currentLocale}/student/unified`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Brain className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">AI Learning Hub</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/student/assessments`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.assessments || "Assessments"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/student/adaptive-teaching`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Sparkles className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Adaptive Teaching</span>
                        </Link>
                      </>
                    )}
                    
                    {['teacher', 'admin', 'super_admin'].includes(userRole) && (
                      <>
                        <Link 
                          href={`/${currentLocale}/teacher/curriculum`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.curriculum || "Curriculum"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/teacher/assessments`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.assessments || "Assessments"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/teacher/adaptive-teaching`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Sparkles className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Adaptive Teaching</span>
                        </Link>
                      </>
                    )}
                    
                    <Link 
                      href={`/${currentLocale}/chat`}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{dict?.chat?.title || "Classroom Chat"}</span>
                    </Link>
                    
                    {['admin', 'super_admin'].includes(userRole) && (
                      <Link 
                        href={`/${currentLocale}/admin`}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{dict?.userMenu?.adminPanel || "Admin Panel"}</span>
                      </Link>
                    )}
                    
                    {['admin', 'teacher', 'super_admin', 'guardian'].includes(userRole) && (
                      <Link 
                        href={`/${currentLocale}/analytics`}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <BarChart3 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Advanced Analytics</span>
                      </Link>
                    )}
                    
                    {userRole === 'super_admin' && (
                      <Link 
                        href={`/${currentLocale}/super-admin/organizations`}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{dict?.userMenu?.organizations || "Organizations"}</span>
                      </Link>
                    )}
                    
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: `/${currentLocale}/login` });
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{dict?.userMenu?.logout || "Logout"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}