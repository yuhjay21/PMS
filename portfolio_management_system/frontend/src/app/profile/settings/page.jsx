'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load your profile details');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Account</p>
          <h1 className="h3 mb-0">Profile settings</h1>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">Your details</h2>
            </div>
            <div className="card-body">
              {loading && <p className="mb-0">Loading profile...</p>}
              {!loading && !user && (
                <p className="mb-0">No user is currently logged in.</p>
              )}
              {!loading && user && (
                <dl className="row mb-0">
                  <dt className="col-sm-4">Username</dt>
                  <dd className="col-sm-8">{user.username}</dd>
                  <dt className="col-sm-4">Email</dt>
                  <dd className="col-sm-8">{user.email || 'Not provided'}</dd>
                  <dt className="col-sm-4">Joined</dt>
                  <dd className="col-sm-8">
                    {user.date_joined
                      ? new Date(user.date_joined).toLocaleDateString()
                      : '—'}
                  </dd>
                </dl>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">Preferences</h2>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Manage your account visibility and notification preferences. These options are
                placeholders and should be wired to backend endpoints when available.
              </p>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="prefNews" defaultChecked />
                <label className="form-check-label" htmlFor="prefNews">
                  Receive product updates
                </label>
              </div>
              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="prefAlerts" />
                <label className="form-check-label" htmlFor="prefAlerts">
                  Enable important alerts
                </label>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>
                Save preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}