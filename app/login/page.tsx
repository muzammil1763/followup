'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
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
      window.location.href = '/admin';
    } else {
      toast.error('Invalid email or password');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0ede8',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-2%',
          top: '15%',
          fontSize: 'clamp(80px, 18vw, 200px)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'rgba(0,0,0,0.05)',
          letterSpacing: '-0.03em',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Sign
        <br />
        In
      </div>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'relative', zIndex: 10, background: '#f0ede8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', color: '#111' }}>FOLLOW UP</span>
        </div>
        <a href="/" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: '#888', textDecoration: 'none' }}>← HOME</a>
      </header>

      {/* Form */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: 'clamp(24px, 6vw, 60px) clamp(24px, 10%, 160px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', color: '#aaa', marginBottom: '10px' }}>ADMIN ACCESS</p>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#111', lineHeight: 1.1, margin: 0 }}>
              Sign In
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Field label="EMAIL ADDRESS">
              <LineInput type="email" value={email} onChange={setEmail} placeholder="admin@example.com" />
            </Field>
            <Field label="PASSWORD">
              <LineInput type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            </Field>

            <div style={{ marginTop: '40px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#111', color: '#fff', border: 'none',
                  padding: '14px 40px', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, display: 'inline-flex',
                  alignItems: 'center', gap: '8px', transition: 'opacity 0.2s',
                }}
              >
                {loading ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />SIGNING IN</> : 'SIGN IN'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}>
        <span style={{ fontSize: '10px', color: '#bbb', letterSpacing: '0.08em' }}>© {new Date().getFullYear()}</span>
        <span style={{ fontSize: '10px', color: '#bbb', letterSpacing: '0.08em' }}>FOLLOW UP SYSTEM</span>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#888', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function LineInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required
      style={{
        display: 'block', width: '100%', background: 'transparent',
        border: 'none', borderBottom: '1px solid #111', outline: 'none',
        fontSize: '14px', color: '#111', padding: '4px 0 8px', letterSpacing: '0.02em',
      }}
      onFocus={(e) => { e.target.style.borderBottomWidth = '2px'; }}
      onBlur={(e) => { e.target.style.borderBottomWidth = '1px'; }}
    />
  );
}
