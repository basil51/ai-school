"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, Users, Building2, Globe } from "lucide-react";
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
          
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
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
          </div>
          
          {session && (
            <div className="flex items-center gap-4">
              {/* Quick Navigation for Admins */}
              {['admin', 'super_admin'].includes(userRole) && (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/${currentLocale}/admin`}>
                      <Users className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                  {userRole === 'super_admin' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${currentLocale}/super-admin/organizations`}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Organizations
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                      <div className="pt-1">
                        <Badge variant={getRoleDisplay(userRole).variant} className="text-xs">
                          {getRoleDisplay(userRole).text}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${currentLocale}/dashboard`}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {['admin', 'super_admin'].includes(userRole) && (
                    <DropdownMenuItem asChild>
                      <Link href={`/${currentLocale}/admin`}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {userRole === 'super_admin' && (
                    <DropdownMenuItem asChild>
                      <Link href={`/${currentLocale}/super-admin/organizations`}>
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Organizations</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


