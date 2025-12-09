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
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 1rem' }}>
      <div
        className="card"
        style={{
          marginTop: '1rem',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          boxShadow: '0 16px 32px rgba(31, 41, 55, 0.08)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          overflow: 'hidden',
        }}
      >
        <div
          className="card-header"
          style={{
            padding: '1.1rem 1.5rem',
            background: 'linear-gradient(90deg, #4f46e5, #6366f1)',
            color: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div className="card-title" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            Forgot Password
          </div>
        </div>

        <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {sent ? (
            <p style={{ fontSize: '0.95rem', color: '#16a34a', margin: 0 }}>
              If an account with that email exists, a password reset link has been sent.
              Please check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    marginBottom: 6,
                    color: '#1f2937',
                    fontWeight: 600,
                  }}
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
                <p
                  style={{
                    color: 'crimson',
                    fontSize: '0.9rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '58%',
                    minWidth: 180,
                    borderRadius: 12,
                    padding: '0.65rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                    color: '#f9fafb',
                    boxShadow: '0 8px 18px rgba(79, 70, 229, 0.35)',
                    transition: 'transform 120ms ease, box-shadow 120ms ease',
                  }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>
          )}

          <p
            style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              marginTop: '0.35rem',
            }}
          >
            You will receive an email with a link to reset your password using the
            Django Allauth flow.
          </p>
        </div>
      </div>
    </div>
  );
}
