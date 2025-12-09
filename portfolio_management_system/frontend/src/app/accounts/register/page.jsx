'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';


export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // optional, if you use username
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password1 !== password2) {
      setError('Passwords do not match.');
      return;
    }
    // #await fetch(`${API_BASE}/csrf/`, { credentials: "include" });

    setLoading(true);

    try {
      console.log(JSON.stringify({
          email,
          username,
          password: password1,
        }));
      
      const res = await fetch(`${API_BASE}/accounts/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          username,
          password: password1,
        }),
      });
      if (!res.ok) {
        console.log(res);
        let msg = 'Registration failed.';
        try {
          const data = await res.json();
          if (data.detail) msg = data.detail;
          if (data.error) msg = data.error;
        } catch {}
        setError(msg);
        setLoading(false);
        return;
      }

      // Option 1: backend logs in the user & sets session cookie -> go dashboard
      // Option 2: backend just creates user -> redirect to login
      router.push('/accounts/login');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while registering.');
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
            Create Account
          </div>
        </div>

        <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
                Email
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
                  //color: '#1f2937',
                  fontSize: '0.95rem',
                  //background: '#f9fafb',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  marginBottom: 6,
                  color: '#1f2937',
                  fontWeight: 600,
                }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

            <div>
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
                Password
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
                  //color: '#1f2937',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  //background: '#f9fafb',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            <div>
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
                Confirm Password
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
                {loading ? 'Registering…' : 'Register'}
              </button>
            </div>
          </form>

          <p
            style={{
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              color: '#374151',
              textAlign: 'center',
            }}
          >
            Already have an account?{' '}
            <a
              href="/accounts/login"
              style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}
            >
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
