'use client';

import React from 'react';

// Presentational auth screens: loading / login / pending-approval / blocked.
// All logic (session, profile, sign-in/out) lives in the parent (page.jsx).
export function AuthScreens({ mode, email, onSignIn, onSignOut }) {
  const shell = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--panel, #f5f5f7)', padding: 24,
  };
  const card = {
    width: '100%', maxWidth: 420, background: '#fff', border: '1px solid var(--line, #e5e5ea)',
    borderRadius: 16, padding: '36px 32px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
  };
  const logo = (
    <div style={{ width: 64, height: 64, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/logo.png" alt="Recykal" style={{ width: 56, height: 56, objectFit: 'contain' }} />
    </div>
  );

  if (mode === 'loading') {
    return (
      <div style={shell}><div style={card}>{logo}<p style={{ color: 'var(--ink-soft, #6e6e73)', margin: 0 }}>Checking your session…</p></div></div>
    );
  }

  if (mode === 'login') {
    return (
      <div style={shell}>
        <div style={card}>
          {logo}
          <h1 style={{ fontSize: 22, margin: '0 0 6px' }}>DRS Roadmap Engine</h1>
          <p style={{ color: 'var(--ink-soft, #6e6e73)', margin: '0 0 26px', fontSize: 14 }}>Sign in with your Recykal account to continue.</p>
          <button onClick={onSignIn} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 46, borderRadius: 10, border: '1px solid var(--line, #e5e5ea)', background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>
          <p style={{ color: 'var(--ink-soft, #6e6e73)', margin: '20px 0 0', fontSize: 12 }}>Only @recykal.com and retearn.in accounts are allowed.</p>
        </div>
      </div>
    );
  }

  if (mode === 'pending') {
    return (
      <div style={shell}>
        <div style={card}>
          {logo}
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Access pending approval</h1>
          <p style={{ color: 'var(--ink-soft, #6e6e73)', margin: '0 0 8px', fontSize: 14 }}>You're signed in as <strong>{email}</strong>.</p>
          <p style={{ color: 'var(--ink-soft, #6e6e73)', margin: '0 0 26px', fontSize: 14 }}>An admin needs to approve your access. You'll be in as soon as they do.</p>
          <button onClick={onSignOut} style={{ height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid var(--line, #e5e5ea)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Sign out</button>
        </div>
      </div>
    );
  }

  // blocked (wrong domain or revoked)
  return (
    <div style={shell}>
      <div style={card}>
        {logo}
        <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Access not available</h1>
        <p style={{ color: 'var(--ink-soft, #6e6e73)', margin: '0 0 26px', fontSize: 14 }}>{email ? <>The account <strong>{email}</strong> isn't allowed. Use your Recykal account.</> : 'This account is not allowed.'}</p>
        <button onClick={onSignOut} style={{ height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid var(--line, #e5e5ea)', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Sign out</button>
      </div>
    </div>
  );
}
