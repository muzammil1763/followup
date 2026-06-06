'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, ArrowRight, Send, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="mesh-bg min-h-screen flex items-center justify-center px-4 py-12">

      {/* Background orbs */}
      <div className="orb h-[500px] w-[500px] bg-violet-500/20 top-[-120px] left-[-120px]" />
      <div className="orb h-[400px] w-[400px] bg-blue-500/15 bottom-[-80px] right-[-80px]" style={{ animationDelay: '3s' }} />
      <div className="orb h-[300px] w-[300px] bg-emerald-400/15 top-[40%] right-[15%]" style={{ animationDelay: '5s' }} />
      <div className="orb h-[250px] w-[250px] bg-pink-400/10 bottom-[20%] left-[10%]" style={{ animationDelay: '2s' }} />

      {/* Outer glow wrapper — creates the 3D floating depth */}
      <div className="relative z-10 w-full max-w-3xl">

        {/* Shadow layer 3 — deepest */}
        <div
          className="absolute inset-0 rounded-[2.5rem] opacity-30"
          style={{
            transform: 'translateY(24px) scale(0.94)',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            filter: 'blur(40px)',
          }}
        />
        {/* Shadow layer 2 */}
        <div
          className="absolute inset-0 rounded-[2.5rem] opacity-20"
          style={{
            transform: 'translateY(14px) scale(0.97)',
            background: 'linear-gradient(135deg,#818cf8,#a78bfa)',
            filter: 'blur(24px)',
          }}
        />
        {/* Shadow layer 1 — closest */}
        <div
          className="absolute inset-0 rounded-[2.5rem] opacity-40"
          style={{
            transform: 'translateY(6px) scale(0.99)',
            boxShadow: '0 20px 60px rgba(99,102,241,0.25)',
          }}
        />

        {/* Main card */}
        <div
          className="relative overflow-hidden rounded-[2.5rem]"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 2px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.04) inset, 0 8px 32px rgba(99,102,241,0.10)',
          }}
        >
          {/* Top gradient strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }}
          />

          <div className="px-8 pb-8 pt-7 sm:px-10 sm:pb-10">

            {/* Header */}
            <div className="mb-7 flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-800">Follow-Up Form</h1>
                <p className="text-xs text-gray-400 tracking-wide">Log a customer follow-up record</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* AWB + Customer */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">AWB #</Label>
                  <Input
                    value={form.awbNumber}
                    onChange={(e) => handleChange('awbNumber', e.target.value)}
                    placeholder="e.g. AWB-123456"
                    className="input-glass h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Customer Name</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    placeholder="Full name"
                    className="input-glass h-11"
                  />
                </div>
              </div>

              {/* Country + Contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Country *</Label>
                  <Select value={form.country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="input-glass h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="glass rounded-2xl border-white/70">
                      <SelectItem value="KSA">🇸🇦 KSA — Saudi Arabia</SelectItem>
                      <SelectItem value="UAE">🇦🇪 UAE — United Arab Emirates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Contact #</Label>
                  <Input
                    value={form.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder={form.country ? `${COUNTRY_CODES[form.country]} ...` : 'Select country first'}
                    className="input-glass h-11"
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="e.g. Riyadh, Dubai..."
                  className="input-glass h-11"
                />
              </div>

              {/* Updated Address + Courier Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Updated Address</Label>
                  <Input
                    value={form.updatedAddress}
                    onChange={(e) => handleChange('updatedAddress', e.target.value)}
                    placeholder="Full updated delivery address"
                    className="input-glass h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Courier Current Status</Label>
                  <Input
                    value={form.courierCurrentStatus}
                    onChange={(e) => handleChange('courierCurrentStatus', e.target.value)}
                    placeholder="e.g. Out for delivery, Pending pickup..."
                    className="input-glass h-11"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="pt-1">
                <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.15),transparent)' }} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary group flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:transform-none"
              >
                {submitting ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" style={{width:'18px',height:'18px'}} />Saving…</>
                ) : (
                  <>
                    <Send style={{width:'16px',height:'16px'}} />
                    Submit Follow-Up
                    <ArrowRight style={{width:'16px',height:'16px'}} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Success */}
              {submitSuccess && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3.5 backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700">
                    Record saved! View it in the admin dashboard.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
