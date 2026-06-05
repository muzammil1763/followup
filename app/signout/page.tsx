'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
  useEffect(() => {
    // Automatically sign out and redirect to login
    signOut({ callbackUrl: '/login' });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-gray-900">
          SIGNING OUT
        </h1>
        <p className="mt-2 text-sm font-light text-gray-600">
          Please wait...
        </p>
      </div>
    </div>
  );
}
