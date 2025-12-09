'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const metadata = {
  title: 'Reset Password | Portfolio Management System',
};

export default function ResetPasswordTokenPage({ params }) {
  const router = useRouter();
  const { uidb64, token } = params;
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
      body.append('password1', password1);
      body.append('password2', password2);

      const res = await fetch(
        `${API_BASE}/accounts/password/reset/key/${uidb64}/${token}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body,
        }
      );

      if (!res.ok) {
        setError('Reset link is invalid or has expired, or passwords do not match.');
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
      // optionally redirect to login after a delay
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while resetting your password.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Set a new password</div>
        </div>

        {done ? (
          <p style={{ fontSize: '0.9rem', color: '#16a34a' }}>
            Password reset successfully. Redirecting to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="password1"
                style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
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
                  padding: '0.45rem 0.55rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="password2"
                style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
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
                  padding: '0.45rem 0.55rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
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
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
