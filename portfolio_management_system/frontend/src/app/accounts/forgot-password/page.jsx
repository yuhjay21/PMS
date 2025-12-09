'use client';

import { useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('email', email);

      const res = await fetch(`${API_BASE}/accounts/password/reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        setError('Could not send reset email. Please check the address.');
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while sending the reset email.');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Forgot Password</div>
        </div>

        {sent ? (
          <p style={{ fontSize: '0.9rem', color: '#16a34a' }}>
            If an account with that email exists, a password reset link has been sent.
            Please check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p
          style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            marginTop: '0.75rem',
          }}
        >
          You will receive an email with a link to reset your password using the
          Django Allauth flow.
        </p>
      </div>
    </div>
  );
}
