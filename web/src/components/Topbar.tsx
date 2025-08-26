"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Topbar() {
  const { data: session } = useSession();
  const homeHref = session ? "/dashboard" : "/";

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <Link href={homeHref} className="text-lg font-semibold text-gray-900 hover:opacity-80">
            AI School
          </Link>
        </div>
      </div>
    </nav>
  );
}


