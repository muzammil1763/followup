'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const emptyFollowup = {
  awbNumber: '',
  customerName: '',
  contactNumber: '',
  city: '',
  country: '',
  updatedAddress: '',
  courierCurrentStatus: '',
};

const COUNTRY_CODES: Record<string, string> = {
  KSA: '+966',
  UAE: '+971',
};

export default function HomePage() {
  const [form, setForm] = useState(emptyFollowup);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [today, setToday] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () =>
      setToday(
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
      );
    update();
    // Refresh at midnight
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => { update(); }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  function handleChange(field: keyof typeof emptyFollowup, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitSuccess(false);
  }

  function handleCountryChange(value: string) {
    const code = COUNTRY_CODES[value] ?? '';
    setForm((prev) => ({
      ...prev,
      country: value,
      contactNumber:
        prev.contactNumber === '' ||
        Object.values(COUNTRY_CODES).some((c) => prev.contactNumber === c)
          ? code
          : prev.contactNumber,
    }));
    setSubmitSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.country) { toast.error('Please select a country'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setForm(emptyFollowup);
      setSubmitSuccess(true);
      toast.success('Follow-up record saved!');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
      }}
    >
      {/* Watermark text */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-2%',
          top: '18%',
          fontSize: 'clamp(80px, 18vw, 200px)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'rgba(0,0,0,0.055)',
          letterSpacing: '-0.03em',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Follow
        <br />
        Up
      </div>

      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 20,
          background: '#f0ede8',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="15" y2="17"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', color: '#111', whiteSpace: 'nowrap' }}>
              FOLLOW UP
            </span>
          </div>

          {/* Desktop nav — hidden on mobile via Tailwind */}
          <nav className="hidden sm:flex" style={{ alignItems: 'center', gap: '32px' }}>
            <a href="/" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#111', textDecoration: 'none', borderBottom: '1px solid #111', paddingBottom: '1px' }}>HOME</a>
            <a href="/admin" style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: '#888', textDecoration: 'none' }}>DASHBOARD</a>
            <div style={{ width: '1px', height: '14px', background: 'rgba(0,0,0,0.15)' }} />
            <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '0.08em' }}>{today}</span>
          </nav>

          {/* Mobile hamburger — hidden on desktop */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex sm:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Toggle menu"
          >
            <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(6.5px)' : 'none' }} />
            <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="flex sm:hidden" style={{ flexDirection: 'column', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#f0ede8' }}>
            <a href="/" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: '#111', textDecoration: 'none', padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>HOME</a>
            <a href="/admin" style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', color: '#555', textDecoration: 'none', padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>DASHBOARD</a>
            <p style={{ padding: '10px 24px 14px', fontSize: '10px', color: '#bbb', letterSpacing: '0.08em', margin: 0 }}>{today}</p>
          </div>
        )}
      </header>

      {/* Form area */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'clamp(24px, 10%, 160px)',
          padding: 'clamp(24px, 5vw, 48px)',
          paddingBottom: '80px',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* AWB */}
          <Field label="AWB #">
            <LineInput
              value={form.awbNumber}
              onChange={(v) => handleChange('awbNumber', v)}
              placeholder="AWB-123456"
            />
          </Field>

          {/* Customer Name */}
          <Field label="CUSTOMER NAME">
            <LineInput
              value={form.customerName}
              onChange={(v) => handleChange('customerName', v)}
              placeholder="Full name"
            />
          </Field>

          {/* Country */}
          <Field label="COUNTRY">
            <div style={{ borderBottom: '1px solid #111', paddingBottom: '6px' }}>
              <Select value={form.country} onValueChange={handleCountryChange}>
                <SelectTrigger
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0',
                    height: 'auto',
                    fontSize: '14px',
                    color: form.country ? '#111' : '#aaa',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KSA">🇸🇦 KSA — Saudi Arabia</SelectItem>
                  <SelectItem value="UAE">🇦🇪 UAE — United Arab Emirates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>

          {/* Contact */}
          <Field label="CONTACT #">
            <LineInput
              value={form.contactNumber}
              onChange={(v) => handleChange('contactNumber', v)}
              placeholder={form.country ? `${COUNTRY_CODES[form.country]}...` : 'Select country first'}
            />
          </Field>

          {/* City */}
          <Field label="CITY">
            <LineInput
              value={form.city}
              onChange={(v) => handleChange('city', v)}
              placeholder="Riyadh / Dubai"
            />
          </Field>

          {/* Updated Address */}
          <Field label="UPDATED ADDRESS">
            <LineInput
              value={form.updatedAddress}
              onChange={(v) => handleChange('updatedAddress', v)}
              placeholder="Full delivery address"
            />
          </Field>

          {/* Courier Status */}
          <Field label="COURIER STATUS">
            <LineInput
              value={form.courierCurrentStatus}
              onChange={(v) => handleChange('courierCurrentStatus', v)}
              placeholder="e.g. Out for delivery"
            />
          </Field>

          {/* Submit */}
          <div style={{ marginTop: '36px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                padding: '14px 40px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? (
                <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />SENDING</>
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>

          {/* Success */}
          {submitSuccess && (
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#3a7d44',
              }}
            >
              <CheckCircle2 style={{ width: 16, height: 16 }} />
              Record saved successfully.
            </div>
          )}
        </form>
      </main>

      {/* Bottom bar */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '0.08em' }}>
          {new Date().getFullYear()}
        </span>
        <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '0.08em' }}>
          FOLLOW UP SYSTEM
        </span>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: '#888',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function LineInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        display: 'block',
        width: '100%',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid #111',
        outline: 'none',
        fontSize: '14px',
        color: '#111',
        padding: '4px 0 8px',
        letterSpacing: '0.02em',
      }}
      onFocus={(e) => { e.target.style.borderBottomColor = '#000'; e.target.style.borderBottomWidth = '2px'; }}
      onBlur={(e) => { e.target.style.borderBottomColor = '#111'; e.target.style.borderBottomWidth = '1px'; }}
    />
  );
}
