'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, ArrowRight, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      toast.success('Welcome back!');
      router.push('/admin');
    } else {
      toast.error('Invalid email or password');
    }
  }

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center px-4">
      {/* Orbs */}
      <div className="orb h-96 w-96 bg-violet-400/20 top-[-60px] left-[-80px]" />
      <div className="orb h-80 w-80 bg-blue-400/15 bottom-[-40px] right-[-60px]" style={{ animationDelay: '4s' }} />
      <div className="orb h-64 w-64 bg-emerald-400/12 top-[40%] right-[10%]" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <img src="/logo.png" alt="DeliverTrack" className="h-full w-full object-contain p-3" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-800">DELIVERTRACK</h1>
          <p className="mt-1 text-sm text-gray-500 tracking-widest">ADMIN PORTAL</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-black tracking-tight text-gray-800">Sign In</h2>
            <p className="mt-1 text-sm text-gray-500">Access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                <Mail className="mr-1.5 inline h-3.5 w-3.5" />Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@delivertrack.com"
                className="input-glass h-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" />Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass h-12"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Signing In</>
              ) : (
                <>Sign In <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Secure admin access · DeliverTrack System
        </p>
      </div>
    </div>
  );
}
