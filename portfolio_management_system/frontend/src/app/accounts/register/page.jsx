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
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Create Account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
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
                padding: '0.45rem 0.55rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="username"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
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
                padding: '0.45rem 0.55rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label
              htmlFor="password1"
              style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}
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
                padding: '0.45rem 0.55rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
              }}
            />
          </div>

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
            }}
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p
          style={{
            fontSize: '0.85rem',
            color: '#374151',
            marginTop: '0.75rem',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <a href="/accounts/login" style={{ color: '#4f46e5', fontWeight: 600 }}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
