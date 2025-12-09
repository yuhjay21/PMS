'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';


export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        const res = await fetch(`${API_BASE}/accounts/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: new URLSearchParams({}), // some allauth setups expect POST
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
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Logging out…</div>
        </div>
        <p style={{ fontSize: '0.9rem' }}>Please wait.</p>
      </div>
    </div>
  );
}
