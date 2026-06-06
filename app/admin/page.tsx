'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, Search, Download, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
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

const NAV: { id: TabType; label: string }[] = [
  { id: 'followups', label: 'Follow-ups' },
  { id: 'profile',   label: 'Profile' },
  { id: 'settings',  label: 'Settings' },
];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<TabType>('followups');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ── Follow-ups ──────────────────────────────────────────────────────────
  const [records, setRecords] = useState<FollowupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewRecord, setViewRecord] = useState<FollowupRecord | null>(null);

  // ── Profile ─────────────────────────────────────────────────────────────
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
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  const filtered = records.filter((r) => {
    if (country && r.country !== country) return false;
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) { const e = new Date(dateTo); e.setHours(23,59,59,999); if (new Date(r.createdAt) > e) return false; }
    if (search) {
      const s = search.toLowerCase();
      return [r.awbNumber, r.customerName, r.contactNumber, r.city, r.courierCurrentStatus].some(v => v.toLowerCase().includes(s));
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSel     = paginated.length > 0 && paginated.every(r => selected.has(r.id));

  function toggleOne(id: string) { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); }
  function toggleAll() { const n = new Set(selected); allSel ? paginated.forEach(r => n.delete(r.id)) : paginated.forEach(r => n.add(r.id)); setSelected(n); }

  function doExport(rows: FollowupRecord[]) {
    const data = rows.map(r => ({
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

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.currentPassword) { toast.error('Current password required'); return; }
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) { toast.error('Passwords do not match'); return; }
    setProfileLoading(true);
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profile.name, email: profile.email, currentPassword: profile.currentPassword, newPassword: profile.newPassword || undefined }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Profile updated!');
      setProfile(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch { toast.error('Error'); }
    finally { setProfileLoading(false); }
  }

  function navClick(id: TabType) { setTab(id); setMobileNavOpen(false); }

  // ── Shared styles ───────────────────────────────────────────────────────
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#f0ede8', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", display: 'flex', flexDirection: 'column' as const },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#f0ede8', position: 'relative' as const, zIndex: 30 },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    logo: { width: '28px', height: '28px', borderRadius: '6px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const },
    brandText: { fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em', color: '#111', whiteSpace: 'nowrap' as const },
    label: { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#888', marginBottom: '8px' },
    fieldWrap: { marginBottom: '28px' },
    lineInput: { display: 'block', width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #111', outline: 'none', fontSize: '14px', color: '#111', padding: '4px 0 8px', letterSpacing: '0.02em', fontFamily: 'inherit' },
    btn: { backgroundColor: '#111', color: '#fff', border: 'none', padding: '13px 36px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' },
    btnOutline: { backgroundColor: 'transparent', color: '#111', border: '1px solid #111', padding: '10px 24px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' },
    btnDanger: { backgroundColor: 'transparent', color: '#c00', border: '1px solid #c00', padding: '10px 24px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' },
    divider: { borderTop: '1px solid rgba(0,0,0,0.08)', margin: '32px 0' },
    sectionTitle: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', color: '#aaa', marginBottom: '24px' },
  };

  return (
    <div style={S.page}>

      {/* Watermark */}
      <div aria-hidden style={{ position: 'fixed', left: '-2%', top: '15%', fontSize: 'clamp(80px,18vw,200px)', fontWeight: 900, lineHeight: 0.85, color: 'rgba(0,0,0,0.04)', letterSpacing: '-0.03em', userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0 }}>
        Admin
      </div>

      {/* Header */}
      <header style={S.header}>
        <div style={S.brand}>
          <div style={S.logo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </div>
          <span style={S.brandText}>FOLLOW UP</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '32px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => navClick(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: tab === n.id ? 700 : 600, letterSpacing: '0.14em', color: tab === n.id ? '#111' : '#888', borderBottom: tab === n.id ? '1px solid #111' : 'none', paddingBottom: tab === n.id ? '1px' : '0' }}>
              {n.label.toUpperCase()}
            </button>
          ))}
          <div style={{ width: '1px', height: '14px', background: 'rgba(0,0,0,0.15)' }} />
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: '#c00' }}>
            LOGOUT
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileNavOpen(o => !o)} className="flex sm:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexDirection: 'column', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', transform: mobileNavOpen ? 'rotate(45deg) translateY(6.5px)' : 'none' }} />
          <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', opacity: mobileNavOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: '20px', height: '1.5px', background: '#111', transition: 'all 0.2s', transform: mobileNavOpen ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }} />
        </button>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="flex sm:hidden" style={{ flexDirection: 'column', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#f0ede8', position: 'relative', zIndex: 20 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => navClick(n.id)} style={{ background: 'none', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: tab === n.id ? 700 : 600, letterSpacing: '0.14em', color: tab === n.id ? '#111' : '#555', cursor: 'pointer' }}>
              {n.label.toUpperCase()}
            </button>
          ))}
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', color: '#c00', cursor: 'pointer' }}>
            LOGOUT
          </button>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10, padding: 'clamp(24px,5vw,48px) clamp(20px,6vw,60px)', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>

        {/* ── FOLLOW-UPS ──────────────────────────────────────────────── */}
        {tab === 'followups' && (
          <div>
            <div style={{ marginBottom: '36px' }}>
              <p style={S.sectionTitle}>RECORDS</p>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#111', margin: 0 }}>Follow-ups</h2>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'rgba(0,0,0,0.08)', marginBottom: '40px', border: '1px solid rgba(0,0,0,0.08)' }}>
              {[
                { label: 'TOTAL', val: records.length },
                { label: 'KSA', val: records.filter(r => r.country === 'KSA').length },
                { label: 'UAE', val: records.filter(r => r.country === 'UAE').length },
              ].map(s => (
                <div key={s.label} style={{ background: '#f0ede8', padding: '20px 24px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#aaa', margin: '0 0 6px' }}>{s.label}</p>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.03em' }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)', padding: '20px 0', marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '16px 24px', alignItems: 'end' }}>
              <div>
                <label style={S.label}>SEARCH</label>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="AWB, customer…" style={S.lineInput} />
              </div>
              <div>
                <label style={S.label}>COUNTRY</label>
                <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} style={{ ...S.lineInput, appearance: 'none' as const }}>
                  <option value="">All</option>
                  <option value="KSA">KSA</option>
                  <option value="UAE">UAE</option>
                </select>
              </div>
              <div>
                <label style={S.label}>FROM</label>
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={S.lineInput} />
              </div>
              <div>
                <label style={S.label}>TO</label>
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={S.lineInput} />
              </div>
              {(search || country || dateFrom || dateTo) && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => { setSearch(''); setCountry(''); setDateFrom(''); setDateTo(''); setPage(1); }} style={{ ...S.btnOutline, fontSize: '9px' }}>CLEAR</button>
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#888', margin: 0, letterSpacing: '0.06em' }}>
                {filtered.length} RECORD{filtered.length !== 1 ? 'S' : ''}
                {selected.size > 0 && <span style={{ color: '#111', fontWeight: 700 }}> · {selected.size} SELECTED</span>}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button onClick={fetchRecords} style={S.btnOutline}><RefreshCw style={{ width: 11, height: 11 }} />REFRESH</button>
                {selected.size > 0 && <>
                  <button onClick={() => doExport(records.filter(r => selected.has(r.id)))} style={S.btn}><Download style={{ width: 11, height: 11 }} />EXPORT ({selected.size})</button>
                  <button onClick={() => setShowDeleteDialog(true)} style={S.btnDanger}><Trash2 style={{ width: 11, height: 11 }} />DELETE ({selected.size})</button>
                </>}
                <button onClick={() => doExport(filtered)} disabled={!filtered.length} style={{ ...S.btn, opacity: filtered.length ? 1 : 0.4 }}><Download style={{ width: 11, height: 11 }} />EXPORT ALL</button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 style={{ width: 24, height: 24, color: '#aaa' }} className="animate-spin" />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#333' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #111' }}>
                      <th style={{ padding: '8px 12px 8px 0', textAlign: 'left', width: '32px' }}>
                        <input type="checkbox" checked={allSel} onChange={toggleAll} style={{ accentColor: '#111' }} />
                      </th>
                      {['AWB #','CUSTOMER','CONTACT','CITY','COUNTRY','ADDRESS','COURIER STATUS','DATE',''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '48px 0', textAlign: 'center', fontSize: '11px', color: '#bbb', letterSpacing: '0.1em' }}>NO RECORDS FOUND</td></tr>
                    ) : paginated.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                        <td style={{ padding: '12px 12px 12px 0' }}>
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} style={{ accentColor: '#111' }} />
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap' }}>{r.awbNumber || '—'}</td>
                        <td style={{ padding: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName || '—'}</td>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{r.contactNumber || '—'}</td>
                        <td style={{ padding: '12px' }}>{r.city || '—'}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{r.country || '—'}</td>
                        <td style={{ padding: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.updatedAddress || '—'}</td>
                        <td style={{ padding: '12px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.courierCurrentStatus || '—'}</td>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#aaa', fontSize: '11px' }}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => setViewRecord(r)}
                            title="View full record"
                            style={{ background: 'none', border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', padding: '4px 8px', fontSize: '11px', color: '#555', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            VIEW
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: '16px', paddingTop: '16px' }}>
                <span style={{ fontSize: '10px', color: '#aaa', letterSpacing: '0.08em' }}>PAGE {page} OF {totalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...S.btnOutline, opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft style={{ width: 12, height: 12 }} />PREV</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...S.btnOutline, opacity: page === totalPages ? 0.4 : 1 }}>NEXT<ChevronRight style={{ width: 12, height: 12 }} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ─────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div style={{ maxWidth: '440px' }}>
            <div style={{ marginBottom: '36px' }}>
              <p style={S.sectionTitle}>ACCOUNT</p>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#111', margin: 0 }}>Profile</h2>
            </div>

            <form onSubmit={handleProfileSave}>
              <div style={S.fieldWrap}>
                <label style={S.label}>NAME</label>
                <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" style={S.lineInput} onFocus={e => e.target.style.borderBottomWidth='2px'} onBlur={e => e.target.style.borderBottomWidth='1px'} />
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label}>EMAIL</label>
                <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" style={S.lineInput} required onFocus={e => e.target.style.borderBottomWidth='2px'} onBlur={e => e.target.style.borderBottomWidth='1px'} />
              </div>

              <div style={S.divider} />
              <p style={S.sectionTitle}>CHANGE PASSWORD</p>

              <div style={S.fieldWrap}>
                <label style={S.label}>CURRENT PASSWORD *</label>
                <input type="password" value={profile.currentPassword} onChange={e => setProfile({ ...profile, currentPassword: e.target.value })} placeholder="Required to save" style={S.lineInput} required onFocus={e => e.target.style.borderBottomWidth='2px'} onBlur={e => e.target.style.borderBottomWidth='1px'} />
              </div>
              <div style={S.fieldWrap}>
                <label style={S.label}>NEW PASSWORD (OPTIONAL)</label>
                <input type="password" value={profile.newPassword} onChange={e => setProfile({ ...profile, newPassword: e.target.value })} placeholder="Leave blank to keep current" style={S.lineInput} onFocus={e => e.target.style.borderBottomWidth='2px'} onBlur={e => e.target.style.borderBottomWidth='1px'} />
              </div>
              {profile.newPassword && (
                <div style={S.fieldWrap}>
                  <label style={S.label}>CONFIRM NEW PASSWORD</label>
                  <input type="password" value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} placeholder="Confirm" style={S.lineInput} onFocus={e => e.target.style.borderBottomWidth='2px'} onBlur={e => e.target.style.borderBottomWidth='1px'} />
                </div>
              )}

              <div style={{ marginTop: '36px' }}>
                <button type="submit" disabled={profileLoading} style={{ ...S.btn, opacity: profileLoading ? 0.6 : 1 }}>
                  {profileLoading ? <><Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />SAVING</> : 'SAVE CHANGES'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '24px', padding: '16px 0', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Signed in as <span style={{ color: '#111', fontWeight: 600 }}>{session?.user?.email}</span></p>
            </div>
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ maxWidth: '500px' }}>
            <div style={{ marginBottom: '36px' }}>
              <p style={S.sectionTitle}>SYSTEM</p>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#111', margin: 0 }}>Settings</h2>
            </div>

            {/* Stats */}
            <div style={{ border: '1px solid rgba(0,0,0,0.1)', marginBottom: '40px' }}>
              {[
                { label: 'Total Follow-up Records', val: records.length },
                { label: 'KSA Records', val: records.filter(r => r.country === 'KSA').length },
                { label: 'UAE Records', val: records.filter(r => r.country === 'UAE').length },
              ].map((s, i, arr) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#555' }}>{s.label}</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>{s.val}</span>
                </div>
              ))}
            </div>

            <div style={S.divider} />
            <p style={{ ...S.sectionTitle, color: '#c00' }}>DANGER ZONE</p>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>
              Permanently delete all <strong style={{ color: '#111' }}>{records.length}</strong> follow-up records. This cannot be undone.
            </p>
            <button
              onClick={() => { setSelected(new Set(records.map(r => r.id))); setShowDeleteDialog(true); }}
              disabled={records.length === 0}
              style={{ ...S.btnDanger, opacity: records.length === 0 ? 0.4 : 1 }}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
              DELETE ALL {records.length} RECORDS
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}>
        <span style={{ fontSize: '10px', color: '#bbb', letterSpacing: '0.08em' }}>© {new Date().getFullYear()}</span>
        <span style={{ fontSize: '10px', color: '#bbb', letterSpacing: '0.08em' }}>FOLLOW UP SYSTEM</span>
      </footer>

      {/* View Record Modal */}
      {viewRecord && (
        <div
          onClick={() => setViewRecord(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#f0ede8', border: '1px solid #111', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif" }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', color: '#aaa', margin: '0 0 4px' }}>RECORD DETAIL</p>
                <p style={{ fontSize: '16px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>{viewRecord.awbNumber || 'No AWB'}</p>
              </div>
              <button onClick={() => setViewRecord(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#888', lineHeight: 1, padding: '4px' }}>×</button>
            </div>

            {/* Fields */}
            <div style={{ padding: '24px' }}>
              {[
                { label: 'AWB #',                  value: viewRecord.awbNumber },
                { label: 'CUSTOMER NAME',           value: viewRecord.customerName },
                { label: 'CONTACT #',               value: viewRecord.contactNumber },
                { label: 'COUNTRY',                 value: viewRecord.country },
                { label: 'CITY',                    value: viewRecord.city },
                { label: 'UPDATED ADDRESS',         value: viewRecord.updatedAddress },
                { label: 'COURIER CURRENT STATUS',  value: viewRecord.courierCurrentStatus },
                { label: 'SUBMITTED ON',            value: new Date(viewRecord.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', color: '#aaa' }}>{label}</span>
                  <span style={{ fontSize: '14px', color: '#111', fontWeight: value ? 500 : 400 }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewRecord(null)} style={{ background: '#111', color: '#fff', border: 'none', padding: '11px 32px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={o => { if (!o) { setShowDeleteDialog(false); setSelected(new Set()); } }}>
        <AlertDialogContent style={{ fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", borderRadius: 0, border: '1px solid #111' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Delete Records?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: '13px', color: '#555' }}>
              Permanently delete <strong style={{ color: '#111' }}>{selected.size}</strong> follow-up record{selected.size !== 1 ? 's' : ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setSelected(new Set()); }} style={{ borderRadius: 0, border: '1px solid #ccc', fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700 }}>CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected} style={{ borderRadius: 0, background: '#111', fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700 }}>DELETE {selected.size}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
