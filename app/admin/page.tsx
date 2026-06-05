'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Search, Filter, Trash2, AlertCircle, RefreshCw,
  User, Save, Mail, Lock, LogOut, Download,
  Settings, ClipboardList, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';

type TabType = 'followups' | 'profile' | 'settings';

interface FollowupRecord {
  id: string;
  awbNumber: string;
  customerName: string;
  contactNumber: string;
  city: string;
  country: string;
  updatedAddress: string;
  courierCurrentStatus: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

const NAV = [
  { id: 'followups' as TabType, label: 'Follow-ups', icon: ClipboardList },
  { id: 'profile'   as TabType, label: 'Profile',    icon: User },
  { id: 'settings'  as TabType, label: 'Settings',   icon: Settings },
];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<TabType>('followups');

  // ── Follow-ups ───────────────────────────────────────────────────────────
  const [records, setRecords] = useState<FollowupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { fetchRecords(); }, []);
  useEffect(() => {
    if (session?.user) setProfile((p) => ({ ...p, name: session.user?.name || '', email: session.user?.email || '' }));
  }, [session]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch('/api/followup');
      if (res.ok) setRecords(await res.json());
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = records.filter((r) => {
    if (country && r.country !== country) return false;
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) { const e = new Date(dateTo); e.setHours(23,59,59,999); if (new Date(r.createdAt) > e) return false; }
    if (search) {
      const s = search.toLowerCase();
      return [r.awbNumber, r.customerName, r.contactNumber, r.city, r.courierCurrentStatus].some((v) => v.toLowerCase().includes(s));
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSel     = paginated.length > 0 && paginated.every((r) => selected.has(r.id));

  function toggleOne(id: string) {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  }
  function toggleAll() {
    const n = new Set(selected);
    allSel ? paginated.forEach((r) => n.delete(r.id)) : paginated.forEach((r) => n.add(r.id));
    setSelected(n);
  }

  function doExport(rows: FollowupRecord[]) {
    const data = rows.map((r) => ({
      'AWB #': r.awbNumber, 'Customer Name': r.customerName, 'Contact #': r.contactNumber,
      City: r.city, Country: r.country, 'Updated Address': r.updatedAddress,
      'Courier Status': r.courierCurrentStatus,
      'Date & Time': new Date(r.createdAt).toLocaleString('en-GB'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Follow-ups');
    XLSX.writeFile(wb, `followups-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${rows.length} records`);
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    try {
      const res = await fetch('/api/followup', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (res.ok) { toast.success(`${ids.length} record${ids.length !== 1 ? 's' : ''} deleted`); setSelected(new Set()); fetchRecords(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Network error'); }
    finally { setShowDeleteDialog(false); }
  }

  // ── Profile save ─────────────────────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.currentPassword) { toast.error('Current password required'); return; }
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) { toast.error('Passwords do not match'); return; }
    setProfileLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, email: profile.email, currentPassword: profile.currentPassword, newPassword: profile.newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Profile updated!');
      setProfile((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
      if (data.user.email !== session?.user?.email) { toast.info('Email changed — please login again'); setTimeout(() => signOut({ callbackUrl: '/login' }), 2000); }
    } catch { toast.error('Error updating profile'); }
    finally { setProfileLoading(false); }
  }

  const clearFilters = () => { setSearch(''); setCountry(''); setDateFrom(''); setDateTo(''); setPage(1); };
  const hasFilters   = search || country || dateFrom || dateTo;

  return (
    <div className="mesh-bg flex min-h-screen">
      {/* Orbs */}
      <div className="orb pointer-events-none h-96 w-96 bg-violet-400/15 top-[-80px] left-[180px]" />
      <div className="orb pointer-events-none h-72 w-72 bg-blue-400/12 bottom-[5%] right-[5%]" style={{ animationDelay: '4s' }} />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="glass-sidebar fixed left-0 top-0 z-20 flex h-screen w-60 flex-col p-5">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <img src="/logo.png" alt="" className="h-full w-full object-contain p-1.5" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-gray-800">FOLLOW UP</p>
            <p className="text-[10px] tracking-widest text-gray-400">ADMIN</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${tab === id ? 'nav-pill-active' : 'nav-pill'}`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: '18px', height: '18px' }} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="space-y-2 pt-4 border-t border-white/40">
          <a href="/" className="nav-pill flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium">
            ← Home
          </a>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="nav-pill flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50/50"
          >
            <LogOut className="h-4 w-4" />Logout
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="relative z-10 ml-60 flex-1 overflow-auto p-8">

        {/* ── FOLLOW-UPS ──────────────────────────────────────────────── */}
        {tab === 'followups' && (
          <div>
            <div className="mb-7">
              <h1 className="text-3xl font-black tracking-tight text-gray-800">Follow-ups</h1>
              <p className="mt-1 text-sm text-gray-500">All customer follow-up submissions</p>
            </div>

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Total', value: records.length, gradient: 'from-violet-500 to-purple-600' },
                { label: 'KSA', value: records.filter(r => r.country === 'KSA').length, gradient: 'from-emerald-500 to-teal-600' },
                { label: 'UAE', value: records.filter(r => r.country === 'UAE').length, gradient: 'from-blue-500 to-indigo-600' },
              ].map((s) => (
                <div key={s.label} className="card-3d p-5">
                  <div className={`mb-2 inline-flex rounded-xl bg-gradient-to-br ${s.gradient} p-2.5 shadow-lg`}>
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-3xl font-black text-gray-800">{s.value}</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="card-3d mb-5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-600">Filters</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="AWB, Customer, City…" className="input-glass h-11 pl-10" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">Country</label>
                  <Select value={country || 'all'} onValueChange={(v) => { setCountry(v === 'all' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="input-glass h-11"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent className="glass rounded-2xl border-white/70">
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="KSA">🇸🇦 KSA</SelectItem>
                      <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">Date From</label>
                  <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input-glass h-11" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">Date To</label>
                  <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input-glass h-11" />
                </div>
                {hasFilters && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <button onClick={clearFilters} className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100">
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table card */}
            <div className="card-3d overflow-hidden p-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 px-6 py-4">
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                    {selected.size > 0 && <span className="ml-2 text-indigo-500">· {selected.size} selected</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={fetchRecords} className="nav-pill flex items-center gap-1.5 rounded-xl border border-white/60 px-3 py-2 text-xs font-semibold">
                    <RefreshCw className="h-3.5 w-3.5" />Refresh
                  </button>
                  {selected.size > 0 && (
                    <>
                      <button onClick={() => doExport(records.filter(r => selected.has(r.id)))} className="btn-success flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold">
                        <Download className="h-3.5 w-3.5" />Export ({selected.size})
                      </button>
                      <button onClick={() => setShowDeleteDialog(true)} className="btn-danger flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold">
                        <Trash2 className="h-3.5 w-3.5" />Delete ({selected.size})
                      </button>
                    </>
                  )}
                  <button onClick={() => doExport(filtered)} disabled={filtered.length === 0} className="btn-primary flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40 disabled:transform-none">
                    <Download className="h-3.5 w-3.5" />Export All
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="table-glass">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 px-5">
                          <input type="checkbox" checked={allSel} onChange={toggleAll} className="h-4 w-4 cursor-pointer accent-indigo-500" />
                        </TableHead>
                        {['AWB #','Customer','Contact #','City','Country','Updated Address','Courier Status','Date & Time'].map((h) => (
                          <TableHead key={h} className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-40 text-center">
                            <div className="flex flex-col items-center text-gray-400">
                              <AlertCircle className="mb-2 h-8 w-8 text-indigo-200" />
                              <p className="text-sm font-medium">No records found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginated.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="px-5">
                            <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} className="h-4 w-4 cursor-pointer accent-indigo-500" />
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-indigo-700">{r.awbNumber || '—'}</TableCell>
                          <TableCell className="max-w-[130px] truncate font-medium text-gray-800">{r.customerName || '—'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{r.contactNumber || '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700">{r.city || '—'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.country === 'KSA' ? 'badge-ksa' : 'badge-uae'}`}>
                              {r.country === 'KSA' ? '🇸🇦' : '🇦🇪'} {r.country}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate text-sm text-gray-600">{r.updatedAddress || '—'}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-sm text-gray-600">{r.courierCurrentStatus || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/50 px-6 py-4">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="nav-pill flex items-center gap-1 rounded-xl border border-white/60 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" />Prev
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="nav-pill flex items-center gap-1 rounded-xl border border-white/60 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                      Next<ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROFILE ──────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div>
            <div className="mb-7">
              <h1 className="text-3xl font-black tracking-tight text-gray-800">Profile</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your account</p>
            </div>
            <div className="max-w-lg">
              <div className="card-3d p-7">
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      <User className="mr-1.5 inline h-3.5 w-3.5 text-indigo-400" />Name
                    </Label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" className="input-glass h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      <Mail className="mr-1.5 inline h-3.5 w-3.5 text-indigo-400" />Email
                    </Label>
                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" className="input-glass h-11" required />
                  </div>

                  <div className="border-t border-white/60 pt-5">
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Change Password</p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                          <Lock className="mr-1.5 inline h-3.5 w-3.5 text-indigo-400" />Current Password *
                        </Label>
                        <Input type="password" value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })} placeholder="Required to save" className="input-glass h-11" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">New Password (optional)</Label>
                        <Input type="password" value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })} placeholder="Leave blank to keep" className="input-glass h-11" />
                      </div>
                      {profile.newPassword && (
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Confirm New Password</Label>
                          <Input type="password" value={profile.confirmPassword} onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })} placeholder="Confirm" className="input-glass h-11" />
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={profileLoading} className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold uppercase tracking-wider disabled:opacity-50 disabled:transform-none">
                    <Save className="h-4 w-4" />
                    {profileLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>

              <div className="card-3d mt-4 px-6 py-4">
                <p className="text-xs text-gray-500">Logged in as <span className="font-semibold text-gray-800">{session?.user?.email}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ─────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div>
            <div className="mb-7">
              <h1 className="text-3xl font-black tracking-tight text-gray-800">Settings</h1>
              <p className="mt-1 text-sm text-gray-500">Data management</p>
            </div>
            <div className="max-w-lg space-y-4">
              {/* Stats */}
              <div className="card-3d p-6">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">System Info</p>
                <div className="space-y-3">
                  {[
                    { label: 'Total Follow-up Records', val: records.length, color: 'text-indigo-600' },
                    { label: 'KSA Records', val: records.filter(r => r.country === 'KSA').length, color: 'text-emerald-600' },
                    { label: 'UAE Records', val: records.filter(r => r.country === 'UAE').length, color: 'text-blue-600' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-white/40 px-4 py-2.5">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className={`text-lg font-black ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="card-3d border border-rose-200/60 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="text-sm font-bold text-rose-700">Danger Zone</p>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Permanently delete all <span className="font-bold text-gray-800">{records.length}</span> follow-up records. This cannot be undone.
                </p>
                <button
                  onClick={() => { setSelected(new Set(records.map(r => r.id))); setShowDeleteDialog(true); }}
                  disabled={records.length === 0}
                  className="btn-danger flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:transform-none"
                >
                  <Trash2 className="h-4 w-4" />Delete All {records.length} Records
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(o) => { if (!o) { setShowDeleteDialog(false); if (!records.find(r => !selected.has(r.id))) setSelected(new Set()); } }}>
        <AlertDialogContent className="glass-strong rounded-3xl border-white/70">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-800">Delete Records?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete <span className="font-semibold text-gray-800">{selected.size}</span> follow-up record{selected.size !== 1 ? 's' : ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/60 bg-white/60" onClick={() => { setShowDeleteDialog(false); setSelected(new Set()); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected} className="btn-danger rounded-xl border-none px-5">
              Delete {selected.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
