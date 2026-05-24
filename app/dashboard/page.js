'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import { OverviewView, WorkspaceStrategyView, PlansView, ContentsView, LeadsView, OutreachView, BatchView, HistoryView, SettingsView } from './views';

const PROGRESS_STEPS = [
  { id: 'crawl', label: 'Crawling website', emoji: '🔍' },
  { id: 'icp', label: 'Analyzing target audience', emoji: '🎯' },
  { id: 'positioning', label: 'Crafting positioning & messaging', emoji: '💬' },
  { id: 'competitors', label: 'Analyzing competitors', emoji: '🏆' },
  { id: 'contentStrategy', label: 'Building content strategy', emoji: '📝' },
  { id: 'tasks', label: 'Creating action tasks', emoji: '✅' },
  { id: 'outreach', label: 'Writing outreach sequences', emoji: '📧' },
  { id: 'calendar', label: 'Building content calendar', emoji: '📅' },
];

const MONO = { fontFamily: "'Space Mono', monospace" };

const TAB_META = {
  dashboard: { title: 'Dashboard', sub: 'Workspace overview & metrics' },
  workspace: { title: 'Workspace Strategy', sub: 'ICP, Positioning, Competitors, Content Strategy' },
  plans: { title: 'Plans & Calendars', sub: 'Marketing calendar & task timeline' },
  contents: { title: 'Content Library', sub: 'Content strategy & generated pieces' },
  leads: { title: 'Leads & ICP', sub: 'Ideal customer profile breakdown' },
  outreach: { title: 'Outreach', sub: 'Cold email & LinkedIn sequences' },
  batch: { title: 'Batch & Jobs', sub: 'Batch automation & job queue' },
  history: { title: 'History', sub: 'All generated outputs' },
  settings: { title: 'Workspace Settings', sub: 'Configure your product/service details' },
};

function fieldLabel(text) {
  return <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>{text}</div>;
}

const inputStyle = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  color: 'var(--text)', outline: 'none',
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };

const STAGE_GOALS = {
  'pre-launch': ['Build anticipation', 'Validate demand', 'Grow waitlist'],
  'just-launched': ['Acquire first users', 'Get first paying customers', 'Build brand awareness'],
  established: ['Scale user base', 'Increase revenue', 'Expand to new markets'],
  pivoting: ['Re-introduce brand', 'Enter new segment', 'Win back users'],
};

const CHANNELS = ['LinkedIn', 'Twitter/X', 'Email', 'Blog/SEO', 'Community', 'Partnerships', 'Content Marketing'];

// ---- Step-based Workspace Form ---- //
const FORM_STEPS = [
  { label: 'Product', emoji: '📦' },
  { label: 'Audience', emoji: '🎯' },
  { label: 'Stage', emoji: '🚀' },
  { label: 'Channels', emoji: '📡' },
];

function WorkspaceForm({ onCreate }) {
  const [step, setStep] = useState(0);
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('service');
  const [website, setWebsite] = useState('');
  const [targetRegion, setTargetRegion] = useState('');
  const [targetCountry, setTargetCountry] = useState('');
  const [stage, setStage] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [channels, setChannels] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggleChannel = (ch) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const canNext = () => {
    if (step === 0) return serviceName.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return stage.length > 0 && primaryGoal.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;
    setStep(s => Math.min(s + 1, FORM_STEPS.length - 1));
  };

  const handleSubmit = () => {
    if (!serviceName.trim() || busy) return;
    setBusy(true);
    onCreate({
      name: null, serviceName: serviceName.trim(), serviceType,
      website: website.trim(), stage, primaryGoal,
      channels: channels.length > 0 ? channels : null,
      targetRegion: targetRegion.trim() || null,
      targetCountry: targetCountry.trim() || null,
    });
  };

  const pct = ((step + 1) / FORM_STEPS.length) * 100;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              What are you marketing?
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Tell us about your product or service so we know what to build the strategy around.
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Product or Service Name')}
              <input autoFocus value={serviceName} onChange={e => setServiceName(e.target.value)} style={inputStyle} placeholder="e.g. AI Chatbot, Web Dev, ERP Solution" />
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Type')}
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={selectStyle}>
                <option value="service">Service</option><option value="product">Product</option>
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Website URL (optional — we crawl it for context)')}
              <input value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} placeholder="https://yoursite.com" />
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Who are you targeting?
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Where does your ideal customer live? This helps us tailor the messaging and channel strategy.
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Target Region')}
              <input autoFocus value={targetRegion} onChange={e => setTargetRegion(e.target.value)} style={inputStyle} placeholder="e.g. South Asia, Middle East, Europe" />
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Target Country')}
              <input value={targetCountry} onChange={e => setTargetCountry(e.target.value)} style={inputStyle} placeholder="e.g. Bangladesh, UAE, UK" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              Where are you in your journey?
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Your stage determines what kind of marketing moves will matter most right now.
            </div>
            <div style={{ marginBottom: 18 }}>
              {fieldLabel('Product Stage')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'pre-launch', label: 'Pre-launch' },
                  { value: 'just-launched', label: 'Just launched' },
                  { value: 'established', label: 'Established' },
                  { value: 'pivoting', label: 'Pivoting / Re-launching' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => { setStage(opt.value); setPrimaryGoal(''); }}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1px solid',
                      borderColor: stage === opt.value ? 'var(--accent)' : 'var(--border)',
                      background: stage === opt.value ? 'rgba(0,184,148,0.08)' : 'var(--surface)',
                      color: stage === opt.value ? 'var(--accent)' : 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {stage && (
              <div style={{ marginBottom: 18 }}>
                {fieldLabel('Primary Goal')}
                <select value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)} style={selectStyle}>
                  <option value="">Select a goal...</option>
                  {(STAGE_GOALS[stage] || []).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );
      case 3:
        return (
          <>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              How will you reach them?
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Pick the channels you want to focus on. We'll build your content and outreach around them.
            </div>
            <div style={{ marginBottom: 24 }}>
              {fieldLabel('Focus Channels')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CHANNELS.map(ch => (
                  <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                    style={{
                      padding: '8px 18px', borderRadius: 20, border: '1px solid',
                      borderColor: channels.includes(ch) ? 'var(--accent)' : 'var(--border)',
                      background: channels.includes(ch) ? 'var(--accent)' : 'var(--surface)',
                      color: channels.includes(ch) ? '#fff' : 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div style={styles.formWrap}>
      <div style={{ ...styles.formCard, maxWidth: 520 }}>
        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
          {FORM_STEPS.map((s, i) => (
            <div key={s.label} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {FORM_STEPS.map((s, i) => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontFamily: "'Space Mono', monospace",
              color: i === step ? 'var(--accent)' : i < step ? 'var(--muted)' : 'var(--muted2)',
              letterSpacing: 0.5,
            }}>
              <span style={{ fontSize: 13 }}>{s.emoji}</span>
              {s.label}
            </div>
          ))}
        </div>

        {renderStep()}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
              borderRadius: 6, padding: '9px 20px', fontFamily: "'Space Mono', monospace",
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>← BACK</button>
          ) : <div />}

          {step < FORM_STEPS.length - 1 ? (
            <button onClick={handleNext} disabled={!canNext()} style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
              padding: '9px 24px', fontFamily: "'Space Mono', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: 1, cursor: canNext() ? 'pointer' : 'not-allowed',
              opacity: canNext() ? 1 : 0.4,
            }}>NEXT →</button>
          ) : (
            <button onClick={handleSubmit} disabled={busy} style={{
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
              padding: '9px 24px', fontFamily: "'Space Mono', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: 1, cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}>
              {busy ? <><span className="loader" /> STARTING</> : 'START ONBOARDING'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Progress ---- //
function OnboardingProgress({ workspaceName, currentStepId, completedCount, error }) {
  const total = PROGRESS_STEPS.length;
  const pct = Math.min(100, Math.round((completedCount / total) * 100));
  return (
    <div style={styles.progressWrap}>
      <div style={{ ...styles.formCard, maxWidth: 540 }}>
        <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Setting up: {workspaceName}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Building your complete marketing strategy...</div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PROGRESS_STEPS.map((step, i) => {
            const isActive = currentStepId === step.id;
            const isDone = i < completedCount;
            return (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                background: isActive ? 'rgba(0,184,148,0.06)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(0,184,148,0.2)' : isDone ? 'rgba(0,184,148,0.1)' : 'var(--border)',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11,
                  background: isDone ? 'var(--accent)' : isActive ? 'rgba(0,184,148,0.15)' : 'var(--surface2)',
                  color: isDone ? '#fff' : isActive ? 'var(--accent)' : 'var(--muted2)',
                }}>
                  {isDone ? '✓' : isActive ? '⟳' : i + 1}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: isDone ? 'var(--accent)' : isActive ? 'var(--text)' : 'var(--muted2)', fontWeight: isActive ? 500 : 400 }}>{step.label}</span>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: isDone ? 'var(--accent)' : isActive ? 'var(--muted)' : 'var(--muted2)' }}>
                  {isDone ? 'Done' : isActive ? 'Working...' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        {error && <div style={{ marginTop: 16, padding: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>{error}</div>}
      </div>
    </div>
  );
}

// ---- Main ---- //
export default function DashboardPage() {
  const { user, company, loading, logout } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewForm, setShowNewForm] = useState(false);
  const [onboardingState, setOnboardingState] = useState('idle');
  const [onboardingStep, setOnboardingStep] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const loadWorkspaces = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/workspace', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.workspaces) {
        setWorkspaces(data.workspaces);
        if (data.workspaces.length > 0 && !activeWorkspaceId) {
          setActiveWorkspaceId(data.workspaces[0].id);
        }
      }
    } catch {}
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (user) loadWorkspaces();
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId || onboardingState !== 'generating') return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/workspace?id=${activeWorkspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.workspace) return;
        const ws = data.workspace;
        if (ws.outputs) {
          setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, outputs: ws.outputs, status: ws.status } : w));
          const filled = Object.entries(ws.outputs).filter(([, v]) => v?.length > 50).length;
          const stepKeys = ['icp', 'positioning', 'competitors', 'contentStrategy', 'tasks', 'outreach', 'calendar'];
          if (filled > 0 && filled <= stepKeys.length) setOnboardingStep(stepKeys[filled - 1]);
        }
        if (ws.status === 'ready' || ws.status === 'failed') clearInterval(interval);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId, onboardingState]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const outputs = activeWorkspace?.outputs || {};

  const handleCreateWorkspace = async ({ name, serviceName, serviceType, website, stage, primaryGoal, channels, targetRegion, targetCountry }) => {
    setOnboardingState('creating');
    setOnboardingStep('crawl');
    setOnboardingError('');

    try {
      const token = localStorage.getItem('token');
      const createRes = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, serviceName, serviceType, website, stage, primaryGoal, channels, targetRegion, targetCountry }),
      });
      const createData = await createRes.json();
      if (!createData.workspace) throw new Error(createData.error || 'Failed');
      const ws = createData.workspace;
      setWorkspaces(prev => [...prev, ws]);
      setActiveWorkspaceId(ws.id);
      setOnboardingState('crawling');

      if (website) {
        const crawlRes = await fetch('/api/crawl', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: website }),
        });
        if (crawlRes.ok) {
          const crawlData = await crawlRes.json();
          await fetch('/api/workspace', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: ws.id, crawledContent: crawlData.content }),
          });
        }
      }

      setOnboardingStep('icp');
      setOnboardingState('generating');

      const genRes = await fetch('/api/workspace/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId: ws.id }),
      });
      if (!genRes.ok) {
        const genErr = await genRes.json().catch(() => ({}));
        throw new Error(genErr.error || 'Generation failed');
      }
      const genData = await genRes.json();
      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, outputs: genData.outputs, status: 'ready' } : w));
      setOnboardingState('done');

      // Auto-populate structured tables from generated outputs
      const resources = ['tasks', 'leads', 'calendar', 'contents'];
      const results = await Promise.allSettled(resources.map(resource =>
        fetch(`/api/workspace/${ws.id}/${resource}/generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
      ));
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn('Resource generation failures:', failed.map(f => f.reason));
      }

      // Refresh workspace to get updated state
      await loadWorkspaces();
      setTimeout(() => setOnboardingState('idle'), 2000);
    } catch (e) {
      setOnboardingError(e.message);
      setOnboardingState('error');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;
    if (!window.confirm(`Delete "${activeWorkspace.serviceName}" workspace? This cannot be undone.`)) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/workspace?id=${activeWorkspace.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remaining = workspaces.filter(w => w.id !== activeWorkspace.id);
        setWorkspaces(remaining);
        if (remaining.length > 0) setActiveWorkspaceId(remaining[0].id);
        else { setActiveWorkspaceId(null); setShowNewForm(true); }
      }
    } catch {}
    setDeleteLoading(false);
  };

  const handleRegen = async (module) => {
    if (!activeWorkspace) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/workspace/regenerate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId: activeWorkspace.id, module }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setWorkspaces(prev => prev.map(w =>
        w.id === activeWorkspace.id
          ? { ...w, outputs: { ...w.outputs, [module]: data.output } }
          : w
      ));
    } catch {}
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loader" /></div>;
  if (!user) return null;

  const showSidebar = workspaces.length > 0 && (onboardingState === 'idle' || onboardingState === 'done') && !showNewForm;
  const completedSteps = PROGRESS_STEPS.findIndex(s => s.id === onboardingStep);

  return (
    <div className="shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {showSidebar && (
        <Sidebar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewWorkspace={() => { setShowNewForm(true); setOnboardingState('idle'); }}
          onWorkspaceChange={(id) => { setActiveWorkspaceId(id); setActiveTab('dashboard'); }}
          company={company}
        />
      )}

      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {showSidebar && (
          <div className="topbar" style={{
            padding: '14px 28px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface)',
          }}>
            <div>
              <div className="topbar-title" style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: 'var(--text)' }}>{TAB_META[activeTab]?.title || activeTab}</div>
              <div className="topbar-sub" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{TAB_META[activeTab]?.sub || ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {activeWorkspace && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--muted)', background: 'var(--bg)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                    {activeWorkspace.serviceName}
                  </span>
                  <button onClick={handleDeleteWorkspace} disabled={deleteLoading}
                    style={{
                      background: 'transparent', border: '1px solid #ef4444', color: '#ef4444',
                      borderRadius: 6, padding: '4px 10px', fontFamily: "'Space Mono', monospace",
                      fontSize: 10, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.5 : 1,
                    }}>
                    {deleteLoading ? 'DELETING' : 'DELETE'}
                  </button>
                </div>
              )}
              <button onClick={() => { logout(); router.push('/login'); }} style={{
                background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                borderRadius: 6, padding: '6px 14px', fontFamily: "'Space Mono', monospace", fontSize: 10, cursor: 'pointer',
              }}>LOGOUT</button>
            </div>
          </div>
        )}

        <div className="content" style={{ flex: 1, overflowY: 'auto', padding: showSidebar ? 24 : 0 }}>

          {workspaces.length === 0 && onboardingState === 'idle' && !showNewForm && <WorkspaceForm onCreate={handleCreateWorkspace} />}

          {showNewForm && workspaces.length > 0 && (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ marginBottom: 12 }}>
                <button onClick={() => setShowNewForm(false)} style={{
                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
                  borderRadius: 6, padding: '6px 14px', fontFamily: "'Space Mono', monospace", fontSize: 10, cursor: 'pointer',
                }}>← Back</button>
              </div>
              <WorkspaceForm onCreate={(data) => { setShowNewForm(false); handleCreateWorkspace(data); }} />
            </div>
          )}

          {(onboardingState === 'creating' || onboardingState === 'crawling' || onboardingState === 'generating') && (
            <OnboardingProgress
              workspaceName={activeWorkspace?.serviceName || 'Workspace'}
              currentStepId={onboardingStep}
              completedCount={completedSteps >= 0 ? completedSteps : 0}
              error={onboardingError}
            />
          )}

          {onboardingState === 'done' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Marketing workspace is ready!</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Complete strategy for {activeWorkspace?.serviceName} generated.</div>
            </div>
          )}

          {onboardingState === 'error' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 16, color: '#ef4444', marginBottom: 4 }}>Something went wrong</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{onboardingError}</div>
              <button onClick={() => { setOnboardingState('idle'); setShowNewForm(true); }} style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
                padding: '10px 20px', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>TRY AGAIN</button>
            </div>
          )}

          {workspaces.length > 0 && onboardingState === 'idle' && activeWorkspace && !showNewForm && (
            <>
              {activeTab === 'dashboard' && <OverviewView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'workspace' && <WorkspaceStrategyView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'plans' && <PlansView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'contents' && <ContentsView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'leads' && <LeadsView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'outreach' && <OutreachView workspace={activeWorkspace} outputs={outputs} onRegen={handleRegen} />}
              {activeTab === 'batch' && <BatchView workspace={activeWorkspace} outputs={outputs} />}
              {activeTab === 'history' && <HistoryView workspace={activeWorkspace} />}
              {activeTab === 'settings' && <SettingsView workspace={activeWorkspace} onUpdate={loadWorkspaces} />}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  formWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40 },
  formCard: { width: '100%', maxWidth: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 36 },
  progressWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 40 },
};
