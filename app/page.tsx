'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, ArrowRight, Send, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function HomePage() {
  const [form, setForm] = useState(emptyFollowup);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  function handleChange(field: keyof typeof emptyFollowup, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    <div className="mesh-bg min-h-screen">
      {/* Floating orbs */}
      <div className="orb h-80 w-80 bg-violet-400/20 top-[-80px] left-[-60px]" />
      <div className="orb h-96 w-96 bg-blue-400/15 top-[20%] right-[-80px]" style={{ animationDelay: '3s' }} />
      <div className="orb h-64 w-64 bg-emerald-400/15 bottom-[10%] left-[10%]" style={{ animationDelay: '5s' }} />

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        {/* Title */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl shadow-xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-gray-800">Follow-Up Form</h2>
          <p className="mt-2 text-sm text-gray-500">Log a customer follow-up record below</p>
        </div>

        {/* Glass form card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* AWB + Customer */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">AWB #</Label>
                <Input
                  value={form.awbNumber}
                  onChange={(e) => handleChange('awbNumber', e.target.value)}
                  placeholder="e.g. AWB-123456"
                  className="input-glass h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Customer Name</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  placeholder="Full name"
                  className="input-glass h-12"
                />
              </div>
            </div>

            {/* Contact + Country */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Contact #</Label>
                <Input
                  value={form.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="+966 or +971..."
                  className="input-glass h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Country *</Label>
                <Select value={form.country} onValueChange={(v) => handleChange('country', v)}>
                  <SelectTrigger className="input-glass h-12">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="glass rounded-2xl border-white/70">
                    <SelectItem value="KSA">🇸🇦 KSA — Saudi Arabia</SelectItem>
                    <SelectItem value="UAE">🇦🇪 UAE — United Arab Emirates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">City</Label>
              <Input
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="e.g. Riyadh, Dubai..."
                className="input-glass h-12"
              />
            </div>

            {/* Updated Address + Courier Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Updated Address</Label>
                <Input
                  value={form.updatedAddress}
                  onChange={(e) => handleChange('updatedAddress', e.target.value)}
                  placeholder="Full updated delivery address"
                  className="input-glass h-12"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Courier Current Status</Label>
                <Input
                  value={form.courierCurrentStatus}
                  onChange={(e) => handleChange('courierCurrentStatus', e.target.value)}
                  placeholder="e.g. Out for delivery, Pending pickup..."
                  className="input-glass h-12"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold uppercase tracking-wider disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Saving…</>
              ) : (
                <><Send className="h-5 w-5" />Submit Follow-Up<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>

            {/* Success */}
            {submitSuccess && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/70 px-5 py-4 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700">
                  Record saved! View it in the admin dashboard.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-xs text-gray-400">
          All records are timestamped and stored securely.
        </p>
      </main>
    </div>
  );
}
