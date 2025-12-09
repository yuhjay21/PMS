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
      const body = new URLSearchParams();
      body.append('login', login);
      body.append('password', password);
      
      await fetch(`${API_BASE}/csrf/`, {
        method: 'GET',
        credentials: 'include', // important so cookie is stored
      });

      const csrftoken = getCookie('csrftoken');

      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrftoken,  // 👈 IMPORTANT
        },
        credentials: 'include', // keep Django session cookie
        body,
      });
      console.log(res);
      if (!res.ok) {
        setError('Invalid credentials or login failed.');
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
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Account Login</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="login"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                marginBottom: 4,
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
                padding: '0.45rem 0.55rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                marginBottom: 4,
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
                padding: '0.45rem 0.55rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>
          
          {/* ➜ Forget Password link */}
          <p style={{fontSize: '0.8rem',marginTop: '0.3rem',}}>
              <a href="/accounts/forgot-password" style={{ color: '#4f46e5' }}>
                Forgot your password?
              </a>
          </p>

          {error && (
            <p
              style={{
                color: 'crimson',
                fontSize: '0.8rem',
                marginBottom: '0.5rem',
              }}
            >
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
              marginBottom: '0.75rem',
            }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        {/* ➜ Register link */}
        <p
          style={{
            fontSize: '0.85rem',
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
              fontWeight: 600,
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
            marginTop: '0.75rem',
          }}
        >
        </p>
      </div>
    </div>
  );
}
