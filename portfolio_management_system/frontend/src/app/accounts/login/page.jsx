'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// export const metadata = {
//   title: 'Login | Portfolio Management System',
// };

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  } 

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch(`${API_BASE}/csrf/`, {
        method: 'GET',
        credentials: 'include', // important so cookie is stored
      });

      const csrftoken = getCookie('csrftoken');

      const res = await fetch(`${API_BASE}/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || '',
        },
        credentials: 'include', // keep Django session cookie
        body: JSON.stringify({ login, password }),
      });
      
      if (!res.ok) {
        let msg = 'Invalid credentials or login failed.';
        try {
          const data = await res.json();
          if (data.detail) msg = data.detail;
        } catch (parseErr) {
          console.error('Error parsing login response', parseErr);
        }
        setError(msg);
        setLoading(false);
        return;
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while logging in.');
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
            Account Login
          </div>
        </div>

        <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label
                htmlFor="login"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  marginBottom: 6,
                  color: '#1f2937',
                  fontWeight: 600,
                }}
              >
                Email / Username
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
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
                htmlFor="password"
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
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  //background: '#f9fafb',
                  //color: '#1f2937',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                }}
              />
            </div>

            {/* ➜ Forget Password link */}
            <p style={{ fontSize: '0.85rem', marginTop: '-0.25rem' }}>
              <a
                href="/accounts/forgot-password"
                style={{
                  color: '#4f46e5',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Forgot your password?
              </a>
            </p>

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
                {loading ? 'Logging in…' : 'Login'}
              </button>
            </div>
          </form>

          {/* ➜ Register link */}
          <p
            style={{
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              color: '#374151',
              textAlign: 'center',
            }}
          >
            Don&apos;t have an account?{' '}
            <a
              href="/accounts/register"
              style={{
                color: '#4f46e5',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Register here
            </a>
          </p>

          <p
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              marginTop: '0.35rem',
              textAlign: 'center',
            }}
          ></p>
        </div>
      </div>
    </div>
  );
}
