"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, LogOut, Users, Building2, Globe, User, MessageCircle, Brain, BookOpen, FileText, BarChart3, Sparkles,
  ChevronDown, Zap, Award
} from "lucide-react";
import { locales, Locale } from "@/lib/i18n";
import { useTranslations } from "@/lib/useTranslations";

export default function Topbar() {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = params.locale as Locale;
  const homeHref = session ? `/${currentLocale}/dashboard` : `/${currentLocale}`;
  const userRole = (session as any)?.role;
  const { dict } = useTranslations();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
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

        {/* Center - Learning Streak for Students */}
        {session && currentUser.role === 'student' && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">7 Day Streak!</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        )}

        {/* Right Section */}
        {session && (
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentLocale === 'ar' ? 'العربية' : 'EN'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
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

            {/* User Profile Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={(e) => {
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
                  setTimeout(() => setIsUserDropdownOpen(false), 50);
                }
              }}
            >
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-violet-100 hover:to-blue-100 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {currentUser.avatar}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-700">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {isUserDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  onMouseEnter={() => setIsUserDropdownOpen(true)}
                  onMouseLeave={() => {
                    setTimeout(() => setIsUserDropdownOpen(false), 50);
                  }}
                >
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-blue-50">
                    <p className="font-semibold text-gray-700">{currentUser.name}</p>
                    <p className="text-sm text-gray-500">{currentUser.organization}</p>
                    <div className="mt-2">
                      <Badge variant={getRoleDisplay(userRole).variant} className="text-xs">
                        {getRoleDisplay(userRole).text}
                      </Badge>
                    </div>
                  </div>
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
                          href={`/${currentLocale}/ai-teacher`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Brain className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.aiTeacher || "AI Teacher"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/assessments`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.assessments || "Assessments"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/adaptive-teaching`}
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
                          href={`/${currentLocale}/admin/evaluations`}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{dict?.userMenu?.assessments || "Assessments"}</span>
                        </Link>
                        
                        <Link 
                          href={`/${currentLocale}/adaptive-teaching`}
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


