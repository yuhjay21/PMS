'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';


export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('oldpassword', oldPassword);
      body.append('password1', password1);
      body.append('password2', password2);

      const res = await fetch(`${API_BASE}/accounts/password/change/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        setError('Password change failed. Check your current password and requirements.');
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while changing your password.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 1rem' }}>
      <div className="card" style={{
          marginTop: '1rem',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          boxShadow: '0 16px 32px rgba(31, 41, 55, 0.08)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          overflow: 'hidden',
        }}
        >
        <div className="card-header"
          style={{
            padding: '1.1rem 1.5rem',
            background: 'linear-gradient(90deg, #4f46e5, #6366f1)',
            color: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div className="card-title" style={{ fontWeight: 700, fontSize: '1.05rem' }}>Change Password</div>
        </div>
        <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {done ? (
            <p style={{ fontSize: '0.95rem', color: '#16a34a', margin: 0 }}>
              Password changed successfully. Redirecting…
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label
                  htmlFor="oldpassword"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: 6,
                    color: '#1f2937',
                    fontWeight: 600,
                  }}
                >
                  Current password
                </label>
                <input
                  id="oldpassword"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    //color: '#1f2937',
                    //background: '#f9fafb',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="password1"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: 6,
                    color: '#1f2937',
                    fontWeight: 600,
                  }}
                >
                  New password
                </label>
                <input
                  id="password1"
                  type="password"
                  required
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    //color: '#1f2937',
                    //background: '#f9fafb',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  htmlFor="password2"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: 6,
                    color: '#1f2937',
                    fontWeight: 600,
                  }}
                >
                  Confirm new password
                </label>
                <input
                  id="password2"
                  type="password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: '0.95rem',
                    //color: '#1f2937',
                    //background: '#f9fafb',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                  }}
                />
              </div>

              {error && (
                <p style={{ color: 'crimson', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  borderRadius: 999,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#4f46e5',
                  color: '#f9fafb',
                }}
              >
                {loading ? 'Saving…' : 'Change password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
