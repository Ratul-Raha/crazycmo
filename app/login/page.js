'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loader" /></div>;
  if (user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else router.push('/dashboard');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>CrazyCMO</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>AI CMO · Sign in</div>
        {error && <div style={{ color: 'var(--accent3)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
        </div>
        <button type="submit" disabled={busy}
          style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '11px 22px', fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>
          {busy ? <><span className="loader" /> SIGNING IN</> : 'SIGN IN'}
        </button>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          No account? <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register</Link>
        </div>
      </form>
    </div>
  );
}
