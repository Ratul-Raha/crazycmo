'use client';
import { useState } from 'react';

export default function OutputBox({ id, label, text }) {
  const [copyText, setCopyText] = useState('COPY');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopyText('COPIED!');
    setTimeout(() => setCopyText('COPY'), 1500);
  };

  if (!text) return null;

  return (
    <div style={styles.outputBox}>
      <div style={styles.outputHeader}>
        <span style={styles.outputHeaderText}>{label}</span>
        <button style={styles.copyBtn} onClick={handleCopy}>{copyText}</button>
      </div>
      <div style={styles.outputBody}>{text}</div>
    </div>
  );
}

const styles = {
  outputBox: {
    marginTop: 20, background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden',
  },
  outputHeader: {
    padding: '10px 16px', background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  outputHeaderText: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'var(--muted)' },
  outputBody: {
    padding: 20, fontSize: 14, lineHeight: 1.8,
    color: 'var(--text)', whiteSpace: 'pre-wrap', minHeight: 120,
  },
  copyBtn: {
    fontSize: 11, fontFamily: "'Space Mono', monospace",
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--muted)', padding: '4px 10px', borderRadius: 4,
    cursor: 'pointer',
  },
};
