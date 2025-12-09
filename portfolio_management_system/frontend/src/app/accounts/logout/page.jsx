'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}


export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        await fetch(`${API_BASE}/csrf/`, { method: 'GET', credentials: 'include' });
        
        const res = await fetch(`${API_BASE}/accounts/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          credentials: 'include',
          body: JSON.stringify({}),
        });
        // Ignore response, just redirect
      } catch (e) {
        console.error(e);
      } finally {
        router.push('/');
      }
    }
    doLogout();
  }, [router]);

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
          <div className="card-title" style={{ fontWeight: 700, fontSize: '1.05rem' }}>Logging out…</div>
        </div>
        <p style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0 }}>Please wait.</p>
      </div>
    </div>
  );
}
