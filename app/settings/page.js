'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

const TABS = ['Company', 'Services', 'Products', 'Target Markets'];

export default function SettingsPage() {
  const { user, company, loading, refetchCompany } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('Company');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (company) {
      const svcs = (company.services || []).map(s =>
        typeof s === 'string' ? { name: s, description: '' } : s
      );
      const prods = (company.products || []).map(p =>
        typeof p === 'string' ? { name: p, description: '' } : p
      );
      setForm({ ...company, services: svcs, products: prods });
    }
  }, [company]);

  if (loading || !form) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="loader" /></div>;
  if (!user) return null;

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateService = (idx, field, value) => {
    const svcs = [...form.services];
    svcs[idx] = { ...svcs[idx], [field]: value };
    setForm(prev => ({ ...prev, services: svcs }));
  };

  const addService = () => {
    setForm(prev => ({
      ...prev,
      services: [...prev.services, { name: '', description: '' }],
    }));
  };

  const removeService = (idx) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx),
    }));
  };

  const updateProduct = (idx, field, value) => {
    const prods = [...form.products];
    prods[idx] = { ...prods[idx], [field]: value };
    setForm(prev => ({ ...prev, products: prods }));
  };

  const addProduct = () => {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { name: '', description: '' }],
    }));
  };

  const removeProduct = (idx) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
  };

  const updateTargetMarket = (idx, value) => {
    const markets = [...(form.targetMarkets || [])];
    markets[idx] = value;
    setForm(prev => ({ ...prev, targetMarkets: markets }));
  };

  const addTargetMarket = () => {
    setForm(prev => ({
      ...prev,
      targetMarkets: [...(prev.targetMarkets || []), ''],
    }));
  };

  const removeTargetMarket = (idx) => {
    setForm(prev => ({
      ...prev,
      targetMarkets: prev.targetMarkets.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'updateCompany', company: form }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg('Saved successfully!');
        await refetchCompany();
      } else {
        setMsg('Error: ' + (data.error || 'Save failed'));
      }
    } catch (e) {
      setMsg('Error: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeTab="settings" onTabChange={() => {}} company={company} />
      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="topbar" style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <div>
            <div className="topbar-title" style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: 'var(--text)' }}>Settings</div>
            <div className="topbar-sub" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{company?.name || 'Agency'} configuration</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '9px 22px', fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer' }}>
              {saving ? <><span className="loader" /> SAVING</> : 'SAVE'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          {TABS.map(t => (
            <div key={t} onClick={() => setTab(t)}
              style={{
                padding: '10px 24px', fontSize: 12, fontFamily: "'Space Mono', monospace",
                cursor: 'pointer', letterSpacing: 0.5,
                color: tab === t ? 'var(--accent)' : 'var(--muted)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {t}
            </div>
          ))}
        </div>

        <div className="content" style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {msg && <div style={{ color: msg.includes('Error') ? 'var(--accent3)' : 'var(--accent)', fontSize: 12, marginBottom: 16 }}>{msg}</div>}

          <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {tab === 'Company' && (
              <>
                <Field label="Company Name" value={form.name} onChange={v => updateField('name', v)} />
                <Field label="Tagline" value={form.tagline} onChange={v => updateField('tagline', v)} />
                <Field label="Description" value={form.description} onChange={v => updateField('description', v)} textarea />
                <Field label="Website" value={form.website} onChange={v => updateField('website', v)} />
                <Field label="Location" value={form.location} onChange={v => updateField('location', v)} />
                <Field label="Founder" value={form.founder} onChange={v => updateField('founder', v)} />
              </>
            )}

            {tab === 'Services' && (
              <div>
                {form.services.map((s, i) => (
                  <ServiceCard
                    key={i}
                    index={i}
                    data={s}
                    onChange={(field, value) => updateService(i, field, value)}
                    onRemove={() => removeService(i)}
                  />
                ))}
                <button onClick={addService}
                  style={{ background: 'transparent', border: '1px dashed var(--muted2)', color: 'var(--muted)', borderRadius: 6, padding: '12px 14px', fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  + Add Service
                </button>
              </div>
            )}

            {tab === 'Products' && (
              <div>
                {form.products.map((p, i) => (
                  <ServiceCard
                    key={i}
                    index={i}
                    data={p}
                    label="Product"
                    onChange={(field, value) => updateProduct(i, field, value)}
                    onRemove={() => removeProduct(i)}
                  />
                ))}
                <button onClick={addProduct}
                  style={{ background: 'transparent', border: '1px dashed var(--muted2)', color: 'var(--muted)', borderRadius: 6, padding: '12px 14px', fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  + Add Product
                </button>
              </div>
            )}

            {tab === 'Target Markets' && (
              <div>
                {(form.targetMarkets || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input value={m} onChange={e => updateTargetMarket(i, e.target.value)} placeholder="e.g. Bangladesh businesses"
                      style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => removeTargetMarket(i)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>×</button>
                  </div>
                ))}
                <button onClick={addTargetMarket}
                  style={{ background: 'transparent', border: '1px dashed var(--muted2)', color: 'var(--muted)', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer', width: '100%' }}>
                  + Add Target Market
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
  outline: 'none', width: '100%',
};

function ServiceCard({ index, data, onChange, onRemove, label }) {
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const result = await res.json();
      if (result.text) {
        onChange('description', result.text);
        setImportUrl('');
      } else {
        setImportError(result.error || 'Import failed');
      }
    } catch (e) {
      setImportError(e.message);
    }
    setImporting(false);
  };

  return (
    <div style={{ marginBottom: 16, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase' }}>{label || 'Service'} {index + 1}</span>
        <button onClick={onRemove}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent3)', cursor: 'pointer', fontSize: 14 }}>× Remove</button>
      </div>
      <input value={data.name || ''} onChange={e => onChange('name', e.target.value)}
        placeholder={label === 'Product' ? 'Product name (e.g. Consulta CRM)' : 'Service name (e.g. Web Development)'}
        style={{ ...inputStyle, marginBottom: 8 }} />
      <textarea value={data.description || ''} onChange={e => onChange('description', e.target.value)}
        placeholder={label === 'Product' ? 'Details — describe the product, features, pricing, target audience...' : 'Details — describe the service, tech stack, deliverables, pricing, features...'}
        style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
          placeholder="Or import from URL..." style={{ ...inputStyle, flex: 1 }} />
        <button onClick={handleImport} disabled={importing || !importUrl.trim()}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, padding: '9px 14px', fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {importing ? <span className="loader" /> : 'IMPORT'}
        </button>
      </div>
      {importError && <div style={{ color: 'var(--accent3)', fontSize: 11, marginTop: 4 }}>{importError}</div>}
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <Tag value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, ...(textarea ? { minHeight: 80, resize: 'vertical', fontFamily: "'DM Sans', sans-serif" } : {}) }} />
    </div>
  );
}