'use client';
import { useRouter, usePathname } from 'next/navigation';

const MONO = { fontFamily: "'Space Mono', monospace" };

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { id: 'workspace', label: 'Workspace Strategy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { id: 'plans', label: 'Plans & Calendars', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ],
  },
  {
    title: 'Assets',
    items: [
      { id: 'contents', label: 'Content Library', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
      { id: 'leads', label: 'Leads & ICP', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { id: 'outreach', label: 'Outreach', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { id: 'batch', label: 'Batch & Jobs', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    ],
  },
  {
    title: 'Records',
    items: [
      { id: 'history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'settings', label: 'Workspace Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
    ],
  },
];

export default function Sidebar({
  workspaces = [],
  activeWorkspaceId,
  activeTab,
  onTabChange = () => {},
  onNewWorkspace = () => {},
  onWorkspaceChange = () => {},
  company,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={{ ...styles.logoMark, ...MONO }}>CrazyCMO</div>
        <div style={styles.logoSub}>{company?.name || 'Agency'} · AI CMO</div>
      </div>

      {workspaces.length > 0 && (
        <div style={styles.wsSelector}>
          <select
            value={activeWorkspaceId || ''}
            onChange={e => {
              if (e.target.value) onWorkspaceChange(e.target.value);
            }}
            style={styles.wsSelect}
          >
            {!activeWorkspaceId && <option value="">Select workspace</option>}
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>
                {w.name.length > 22 ? w.name.slice(0, 22) + '...' : w.name}
              </option>
            ))}
          </select>
          <div style={styles.wsStatus}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: activeWs?.status === 'ready' ? 'var(--accent)' :
                          activeWs?.status === 'generating' ? '#f59e0b' :
                          activeWs?.status === 'failed' ? '#ef4444' : 'var(--muted2)',
              marginRight: 5,
            }} />
            {activeWs?.status === 'ready' ? 'Ready' :
             activeWs?.status === 'generating' ? 'Generating...' :
             activeWs?.status === 'crawling' ? 'Crawling...' :
             activeWs?.status === 'failed' ? 'Failed' : 'Idle'}
          </div>
        </div>
      )}

      <nav style={styles.nav}>
        {NAV_GROUPS.map(group => (
          <div key={group.title} style={styles.navGroup}>
            <div style={styles.navGroupTitle}>{group.title}</div>
            {group.items.map(item => {
              const isActive = activeTab === item.id;
              const accentColors = {
                dashboard: 'var(--accent4)',
                workspace: 'var(--accent2)',
                plans: 'var(--accent)',
                contents: 'var(--accent5)',
                leads: 'var(--accent3)',
                outreach: 'var(--accent2)',
                batch: 'var(--accent4)',
                history: 'var(--muted)',
                settings: 'var(--accent)',
              };
              const color = accentColors[item.id] || 'var(--accent)';
              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? { ...styles.navItemActive, borderLeftColor: color, color } : {}),
                  }}
                  onClick={() => {
                    if (pathname === '/settings') {
                      router.push('/dashboard?tab=' + item.id);
                    } else {
                      onTabChange(item.id);
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.navIcon}>
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={styles.bottomSection}>
        <button onClick={onNewWorkspace} style={styles.newWsBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Workspace
        </button>

        <div style={styles.sidebarFooter}>
          <span style={{ color: 'var(--accent)' }}>CrazyCMO</span> · {company?.name || 'Agency'}<br />
          Powered by Groq AI
        </div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240, minWidth: 240, background: 'var(--surface)',
    borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
  },
  logo: { padding: '20px 20px 12px', borderBottom: '1px solid var(--border)' },
  logoMark: { fontSize: 13, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase' },
  logoSub: { fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 },
  wsSelector: { padding: '10px 12px', borderBottom: '1px solid var(--border)' },
  wsSelect: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '7px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 12,
    color: 'var(--text)', outline: 'none', cursor: 'pointer',
  },
  wsStatus: {
    fontSize: 10, color: 'var(--muted)', marginTop: 5,
    display: 'flex', alignItems: 'center', fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
  },
  nav: { flex: 1, padding: '4px 0', overflowY: 'auto' },
  navGroup: { marginBottom: 4 },
  navGroupTitle: {
    fontSize: 9, fontFamily: "'Space Mono', monospace", letterSpacing: 1.5,
    textTransform: 'uppercase', color: 'var(--muted2)',
    padding: '10px 16px 3px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px',
    fontSize: 13, color: 'var(--muted)', cursor: 'pointer',
    borderLeft: '2px solid transparent', transition: 'all 0.15s',
    borderRadius: '0 4px 4px 0',
  },
  navItemActive: {
    background: 'rgba(0,0,0,0.03)',
    fontWeight: 500,
  },
  navIcon: { width: 15, height: 15, flexShrink: 0 },
  bottomSection: { borderTop: '1px solid var(--border)', paddingTop: 8 },
  newWsBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '0 12px 6px', padding: '8px 12px',
    width: 'calc(100% - 24px)',
    background: 'rgba(0,184,148,0.08)',
    border: '1px solid rgba(0,184,148,0.2)',
    borderRadius: 6, fontFamily: "'Space Mono', monospace", fontSize: 11,
    color: 'var(--accent)', letterSpacing: 0.5,
    cursor: 'pointer', fontWeight: 600,
  },
  sidebarFooter: {
    padding: '10px 16px', fontSize: 10, color: 'var(--muted)', lineHeight: 1.5,
    borderTop: '1px solid var(--border)',
  },
};
