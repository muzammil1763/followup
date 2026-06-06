'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, LayoutDashboard, User, LogOut } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide navbar on admin page and home page
  if (pathname === '/admin' || pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-black tracking-tighter text-gray-900">FOLLOW UP</span>
        </Link>

        {session && (
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium uppercase tracking-wide transition-all duration-200',
                pathname === '/'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium uppercase tracking-wide transition-all duration-200',
                pathname === '/admin'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium uppercase tracking-wide transition-all duration-200',
                pathname === '/profile'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
