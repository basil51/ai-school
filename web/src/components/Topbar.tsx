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
  //DropdownMenuLabel,
  //DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
//import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, Users, Building2, Globe, User } from "lucide-react";
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



  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link href={homeHref} className="text-lg font-semibold text-gray-900 hover:opacity-80">
            {currentLocale === 'ar' ? 'أكاديمية اجواء العلم بالذكاء الصناعي' : 'EduVibe AI Academy'}
          </Link>
          
          {session && (
            <div className="flex items-center gap-4">
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

              {/* User Menu */}
              <div 
                className="relative"
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={(e) => {
                  // Check if we're moving to the dropdown
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
                    setTimeout(() => setIsUserDropdownOpen(false), 50);
                  }
                }}
              >
                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {dict?.userMenu?.hi || "Hi,"} {session.user?.name || session.user?.email}
                  </span>
                </div>
                
                {/* Custom Dropdown */}
                {isUserDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                    style={{ marginTop: '0px' }}
                    onMouseEnter={() => setIsUserDropdownOpen(true)}
                    onMouseLeave={() => {
                      setTimeout(() => setIsUserDropdownOpen(false), 50);
                    }}
                  >
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {dict?.userMenu?.welcomeBack || "Welcome back,"} {session.user?.name || (dict?.userMenu?.user || 'User')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.user?.email}
                      </p>
                      <div className="mt-2">
                        <Badge variant={getRoleDisplay(userRole).variant} className="text-xs">
                          {getRoleDisplay(userRole).text}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        href={`/${currentLocale}/dashboard`}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {dict?.userMenu?.dashboard || "Dashboard"}
                      </Link>
                      
                      {['admin', 'super_admin'].includes(userRole) && (
                        <Link 
                          href={`/${currentLocale}/admin`}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {dict?.userMenu?.adminPanel || "Admin Panel"}
                        </Link>
                      )}
                      
                      {userRole === 'super_admin' && (
                        <Link 
                          href={`/${currentLocale}/super-admin/organizations`}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          {dict?.userMenu?.organizations || "Organizations"}
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => {
                          signOut();
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {dict?.userMenu?.logOut || "Log out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


