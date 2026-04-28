import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const theme = {
  bg: '#efe8d8',
  surface: '#fbf6ea',
  surfaceAlt: '#e5dbc4',
  ink: '#1d1712',
  inkSoft: '#6b5d4a',
  inkMuted: '#9c8c72',
  accent: '#b8441f',
  accentSoft: '#e8cfbf',
  line: '#d8cdb3',
  green: '#4a6b3a',
};

const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,400..700&family=DM+Sans:opsz,wght@9..40,400..700&display=swap');
`;

const fmt = (n) => {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  if (n >= 10000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString('en-IN')}`;
};

const fmtFull = (n) => `৳${n.toLocaleString('en-IN')}`;

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const todayISO = () => new Date().toISOString().split('T')[0];

// ---------- Seed ----------
const SEED = [
  { id: 's1', date: '2026-04-03', amounts: [2667], note: '' },
  { id: 's2', date: '2026-04-03', amounts: [3000], note: '' },
  { id: 's3', date: '2026-04-06', amounts: [890, 500, 1320, 10000], note: '' },
];

// ---------- Main App ----------
export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    async function load() {
      let loaded = null;
      try {
        const result = await window.storage.get('tracker_entries');
        if (result && result.value) loaded = JSON.parse(result.value);
      } catch (e) {
        // key doesn't exist
      }
      if (!loaded) {
        loaded = SEED;
        try { await window.storage.set('tracker_entries', JSON.stringify(SEED)); } catch {}
      }
      setEntries(loaded);
      setLoading(false);
    }
    load();
  }, []);

  const persist = async (next) => {
    setEntries(next);
    try { await window.storage.set('tracker_entries', JSON.stringify(next)); } catch {}
  };

  const saveEntry = (entry) => {
    if (entry.id) {
      persist(entries.map(e => e.id === entry.id ? entry : e));
    } else {
      persist([...entries, { ...entry, id: `e_${Date.now()}` }]);
    }
  };

  const deleteEntry = (id) => persist(entries.filter(e => e.id !== id));

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: theme.bg, minHeight: '100vh', color: theme.ink }}>
      <style>{fontImport}</style>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .serif { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .num { font-variant-numeric: tabular-nums; }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gentle { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 280ms cubic-bezier(0.32, 0.72, 0, 1); }
        .fade-in { animation: fadeIn 200ms ease; }
        .gentle { animation: gentle 400ms cubic-bezier(0.32, 0.72, 0, 1) both; }
      `}</style>

      <div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', position: 'relative', background: theme.bg, boxShadow: '0 0 60px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            <div style={{ paddingBottom: 110 }}>
              {view === 'home' && <HomeView entries={entries} onOpenEntry={(e) => { setEditing(e); setShowAdd(true); }} />}
              {view === 'list' && <ListView entries={entries} onOpenEntry={(e) => { setEditing(e); setShowAdd(true); }} onDelete={deleteEntry} />}
            </div>

            <BottomNav view={view} setView={setView} onAdd={() => { setEditing(null); setShowAdd(true); }} />

            {showAdd && (
              <AddEntrySheet
                entry={editing}
                onClose={() => { setShowAdd(false); setEditing(null); }}
                onSave={(e) => { saveEntry(e); setShowAdd(false); setEditing(null); }}
                onDelete={editing ? () => { deleteEntry(editing.id); setShowAdd(false); setEditing(null); } : null}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Loading ----------
function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="serif" style={{ fontSize: 28, fontStyle: 'italic', color: theme.inkSoft, letterSpacing: '-0.02em' }}>ledger</div>
    </div>
  );
}

// ---------- Home View ----------
function HomeView({ entries, onOpenEntry }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { monthLabel, monthKey, daysInMonth, year, month } = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return {
      monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  }, [monthOffset]);

  const monthEntries = useMemo(() => entries.filter(e => e.date.startsWith(monthKey)), [entries, monthKey]);

  const total = useMemo(() => monthEntries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0), [monthEntries]);
  const count = monthEntries.length;
  const txCount = monthEntries.reduce((s, e) => s + e.amounts.length, 0);

  const chartData = useMemo(() => {
    const map = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = 0;
    monthEntries.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + e.amounts.reduce((a, b) => a + b, 0);
    });
    return Object.entries(map).map(([day, amount]) => ({ day: parseInt(day), amount }));
  }, [monthEntries, daysInMonth]);

  const maxDay = useMemo(() => {
    if (chartData.every(d => d.amount === 0)) return null;
    return chartData.reduce((m, d) => d.amount > (m?.amount || 0) ? d : m, null);
  }, [chartData]);

  const avgDay = count > 0 ? total / new Set(monthEntries.map(e => e.date)).size : 0;

  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4);

  return (
    <div className="gentle">
      {/* Header */}
      <div style={{ padding: '28px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="serif" style={{ fontSize: 26, fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1 }}>
            ledger
          </div>
          <div style={{ fontSize: 11, color: theme.inkMuted, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>
            a quiet money journal
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.surface, fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 18, fontWeight: 500 }}>
          ৳
        </div>
      </div>

      {/* Month selector */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setMonthOffset(monthOffset - 1)} style={navBtn} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>Summary</div>
          <div className="serif" style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>{monthLabel}</div>
        </div>
        <button onClick={() => setMonthOffset(Math.min(0, monthOffset + 1))} disabled={monthOffset >= 0} style={{ ...navBtn, opacity: monthOffset >= 0 ? 0.3 : 1 }} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Hero total */}
      <div style={{ padding: '20px 24px 28px', textAlign: 'center' }}>
        <div className="serif num" style={{ fontSize: 64, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, color: theme.ink }}>
          {fmtFull(total)}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 12, color: theme.inkSoft }}>
          <span><span className="num" style={{ color: theme.ink, fontWeight: 500 }}>{count}</span> entries</span>
          <span style={{ color: theme.line }}>·</span>
          <span><span className="num" style={{ color: theme.ink, fontWeight: 500 }}>{txCount}</span> items</span>
          <span style={{ color: theme.line }}>·</span>
          <span><span className="num" style={{ color: theme.ink, fontWeight: 500 }}>{fmt(Math.round(avgDay))}</span> / day</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ margin: '0 16px', padding: '22px 16px 10px', background: theme.surface, borderRadius: 20, border: `1px solid ${theme.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 6px 8px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.inkMuted }}>Daily flow</div>
          {maxDay && (
            <div style={{ fontSize: 11, color: theme.inkSoft }}>
              peak <span className="num" style={{ color: theme.accent, fontWeight: 600 }}>{fmt(maxDay.amount)}</span>
            </div>
          )}
        </div>
        <div style={{ height: 160, marginLeft: -10 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 14, right: 8, left: 8, bottom: 0 }} barCategoryGap={2}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity={1} />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: theme.inkMuted }}
                interval={Math.floor(daysInMonth / 6)}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: theme.accentSoft, opacity: 0.4 }}
                contentStyle={{
                  background: theme.ink,
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 10px',
                  fontSize: 11,
                  color: theme.surface,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                itemStyle={{ color: theme.surface }}
                labelStyle={{ color: theme.inkMuted, fontSize: 10 }}
                formatter={(value) => [fmtFull(value), 'Total']}
                labelFormatter={(day) => `Day ${day}`}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.amount > 0 ? 'url(#barGrad)' : theme.line} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px 0', fontSize: 9, color: theme.inkMuted, letterSpacing: '0.1em' }}>
          <span>1</span>
          <span>{daysInMonth}</span>
        </div>
      </div>

      {/* Recent */}
      <div style={{ padding: '32px 24px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div className="serif" style={{ fontSize: 20, fontStyle: 'italic', letterSpacing: '-0.02em' }}>recent</div>
        <div style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          last {recent.length}
        </div>
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        {recent.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: theme.inkMuted, fontSize: 13 }}>
            No entries yet. Tap + to log one.
          </div>
        )}
        {recent.map((e, i) => (
          <EntryCard key={e.id} entry={e} onClick={() => onOpenEntry(e)} index={i} />
        ))}
      </div>
    </div>
  );
}

// ---------- Entry Card ----------
function EntryCard({ entry, onClick, index = 0 }) {
  const total = entry.amounts.reduce((a, b) => a + b, 0);
  const multi = entry.amounts.length > 1;
  return (
    <button
      onClick={onClick}
      className="gentle"
      style={{
        width: '100%',
        background: theme.surface,
        border: `1px solid ${theme.line}`,
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left',
        cursor: 'pointer',
        color: theme.ink,
        animationDelay: `${index * 40}ms`,
        transition: 'transform 120ms ease',
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: multi ? theme.accentSoft : theme.surfaceAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          color: multi ? theme.accent : theme.inkSoft,
        }}>
          <div className="serif" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
            {new Date(entry.date).getDate()}
          </div>
          <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 1 }}>
            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: 11, color: theme.inkSoft, marginTop: 2 }}>
            {multi ? `${entry.amounts.length} items` : entry.note || 'single item'}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="serif num" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {fmtFull(total)}
        </div>
        {multi && (
          <div className="num" style={{ fontSize: 10, color: theme.inkMuted, marginTop: 3 }}>
            {entry.amounts.join(' + ')}
          </div>
        )}
      </div>
    </button>
  );
}

// ---------- List View ----------
function ListView({ entries, onOpenEntry, onDelete }) {
  const sorted = useMemo(() =>
    [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [entries]
  );

  const grouped = useMemo(() => {
    const g = {};
    sorted.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [sorted]);

  const total = entries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);

  return (
    <div className="gentle">
      <div style={{ padding: '28px 24px 0' }}>
        <div style={{ fontSize: 11, color: theme.inkMuted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>All time</div>
        <div className="serif" style={{ fontSize: 36, fontStyle: 'italic', letterSpacing: '-0.03em', marginTop: 6 }}>
          everything
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div className="serif num" style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em' }}>
            {fmtFull(total)}
          </div>
          <div style={{ fontSize: 12, color: theme.inkSoft }}>across {entries.length} entries</div>
        </div>
      </div>

      <div style={{ padding: '28px 16px 0' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '60px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, color: theme.inkMuted, marginBottom: 14 }}>·</div>
            <div className="serif" style={{ fontSize: 18, fontStyle: 'italic', color: theme.inkSoft }}>nothing yet</div>
            <div style={{ fontSize: 12, color: theme.inkMuted, marginTop: 6 }}>Tap + to create your first entry</div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
            return (
              <div key={date} style={{ marginBottom: 22 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '0 8px 10px',
                  borderBottom: `1px dashed ${theme.line}`,
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: 11, color: theme.inkSoft, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                    {formatDate(date)}
                  </div>
                  <div className="num" style={{ fontSize: 11, color: theme.inkMuted }}>
                    {fmtFull(dayTotal)}
                  </div>
                </div>
                {items.map((e, i) => (
                  <EntryCard key={e.id} entry={e} onClick={() => onOpenEntry(e)} index={i} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------- Bottom Nav ----------
function BottomNav({ view, setView, onAdd }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 420,
      padding: '10px 20px 20px',
      background: `linear-gradient(to top, ${theme.bg} 55%, transparent)`,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      zIndex: 10,
    }}>
      <div style={{
        flex: 1,
        background: theme.surface,
        border: `1px solid ${theme.line}`,
        borderRadius: 999,
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        boxShadow: '0 6px 20px rgba(29,23,18,0.06)',
      }}>
        <NavTab active={view === 'home'} onClick={() => setView('home')} icon={<HouseIcon />} label="Home" />
        <NavTab active={view === 'list'} onClick={() => setView('list')} icon={<ListIcon />} label="Entries" />
        <button
          onClick={onAdd}
          aria-label="Add entry"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: theme.ink,
            color: theme.surface,
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            marginLeft: 'auto',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(29,23,18,0.2)',
          }}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 10px',
        border: 'none',
        background: active ? theme.ink : 'transparent',
        color: active ? theme.surface : theme.inkSoft,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
        transition: 'all 180ms ease',
        letterSpacing: '-0.01em',
      }}
    >
      {icon}
      {active && <span>{label}</span>}
    </button>
  );
}

// --- Inline icons (lightweight so we don't depend on a specific lucide export) ---
function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V11z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ---------- Add/Edit Sheet ----------
function AddEntrySheet({ entry, onClose, onSave, onDelete }) {
  const [date, setDate] = useState(entry?.date || todayISO());
  const [amounts, setAmounts] = useState(entry?.amounts?.map(String) || ['']);
  const [note, setNote] = useState(entry?.note || '');

  const total = amounts.reduce((s, a) => s + (parseFloat(a) || 0), 0);
  const canSave = amounts.some(a => parseFloat(a) > 0);

  const update = (i, v) => {
    const next = [...amounts];
    next[i] = v.replace(/[^0-9.]/g, '');
    setAmounts(next);
  };
  const addLine = () => setAmounts([...amounts, '']);
  const removeLine = (i) => {
    if (amounts.length === 1) setAmounts(['']);
    else setAmounts(amounts.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    const cleaned = amounts.map(a => parseFloat(a)).filter(n => !isNaN(n) && n > 0);
    if (cleaned.length === 0) return;
    onSave({
      id: entry?.id,
      date,
      amounts: cleaned,
      note: note.trim(),
    });
  };

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(29,23,18,0.35)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: theme.bg,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '10px 0 24px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderTop: `1px solid ${theme.line}`,
        }}
      >
        {/* grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
          <div style={{ width: 42, height: 4, background: theme.line, borderRadius: 999 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px 16px' }}>
          <div>
            <div style={{ fontSize: 10, color: theme.inkMuted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {entry ? 'Edit' : 'New'}
            </div>
            <div className="serif" style={{ fontSize: 26, fontStyle: 'italic', letterSpacing: '-0.03em', marginTop: 2 }}>
              {entry ? 'adjust entry' : 'an entry'}
            </div>
          </div>
          <button onClick={onClose} style={circleBtn}>
            <XIcon />
          </button>
        </div>

        {/* Date */}
        <div style={{ padding: '0 20px' }}>
          <Label>Date</Label>
          <div style={inputBoxWrap}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                ...inputStyle,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
              }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 8px' }}>
            <Label style={{ margin: 0 }}>Amounts</Label>
            <div className="num" style={{ fontSize: 11, color: theme.inkSoft }}>
              total <span className="serif" style={{ fontSize: 15, color: theme.accent, fontWeight: 600, marginLeft: 4 }}>{fmtFull(total)}</span>
            </div>
          </div>

          {amounts.map((amt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ ...inputBoxWrap, flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                <span className="serif" style={{ fontSize: 18, color: theme.inkMuted, marginRight: 10, fontStyle: 'italic' }}>৳</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amt}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder="0"
                  autoFocus={i === amounts.length - 1 && !entry}
                  className="num"
                  style={{
                    ...inputStyle,
                    padding: '16px 0',
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                />
              </div>
              {amounts.length > 1 && (
                <button onClick={() => removeLine(i)} style={{ ...circleBtn, background: theme.surface, border: `1px solid ${theme.line}`, width: 52, height: 'auto' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addLine}
            style={{
              width: '100%',
              padding: '13px 16px',
              background: 'transparent',
              border: `1px dashed ${theme.inkMuted}`,
              borderRadius: 14,
              color: theme.inkSoft,
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 4,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another amount
          </button>
        </div>

        {/* Note */}
        <div style={{ padding: '22px 20px 0' }}>
          <Label>Note <span style={{ color: theme.inkMuted, fontWeight: 400 }}>(optional)</span></Label>
          <div style={inputBoxWrap}>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="groceries, rent, etc."
              style={{ ...inputStyle, fontSize: 14 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '26px 20px 8px', display: 'flex', gap: 10 }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: '16px',
                background: theme.surface,
                color: theme.accent,
                border: `1px solid ${theme.line}`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                width: 56,
              }}
            >
              <TrashIcon />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: '17px',
              background: canSave ? theme.ink : theme.surfaceAlt,
              color: canSave ? theme.surface : theme.inkMuted,
              border: 'none',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: "'DM Sans', sans-serif",
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all 160ms ease',
            }}
          >
            {entry ? 'Save changes' : 'Log entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Style helpers ----------
const navBtn = {
  width: 32, height: 32,
  borderRadius: '50%',
  background: theme.surface,
  border: `1px solid ${theme.line}`,
  color: theme.inkSoft,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};

const circleBtn = {
  width: 36, height: 36,
  borderRadius: '50%',
  background: theme.surfaceAlt,
  border: 'none',
  color: theme.inkSoft,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};

const inputBoxWrap = {
  background: theme.surface,
  border: `1px solid ${theme.line}`,
  borderRadius: 14,
  overflow: 'hidden',
};

const inputStyle = {
  width: '100%',
  padding: '15px 16px',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: theme.ink,
  fontFamily: "'DM Sans', sans-serif",
};

function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: theme.inkMuted,
      marginBottom: 8,
      padding: '0 4px',
      fontWeight: 600,
      ...style,
    }}>{children}</div>
  );
}
