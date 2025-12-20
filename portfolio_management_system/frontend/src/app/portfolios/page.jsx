'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserPortfolios } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await getUserPortfolios();
        setPortfolios(response.portfolios || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to fetch portfolios');
        toast.error('Unable to load portfolios');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Investments</p>
          <h1 className="h3 mb-0">Your portfolios</h1>
        </div>
        <Link href="/portfolios/new" className="btn btn-primary">
          Add portfolio
        </Link>
      </div>

      {loading && <p>Loading portfolios...</p>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="row g-4">
          {portfolios.length === 0 && (
            <div className="col-12">
              <div className="alert alert-info mb-0">
                No portfolios found for your account. Create one to start tracking holdings.
              </div>
            </div>
          )}

          {portfolios.map((portfolio) => (
            <div className="col-12 col-md-6 col-lg-4" key={portfolio.id}>
              <div className="card shadow-sm h-100">
                <div className="card-body d-flex flex-column gap-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <h2 className="h5 mb-0">{portfolio.name || `Portfolio ${portfolio.id}`}</h2>
                    <span className="badge bg-secondary">ID: {portfolio.id}</span>
                  </div>
                  <p className="text-muted small mb-0">
                    {portfolio.description || 'No description provided'}
                  </p>
                  {portfolio.created_at && (
                    <div className="text-muted small">Created {new Date(portfolio.created_at).toLocaleDateString()}</div>
                  )}
                  {typeof portfolio.total_value !== 'undefined' && (
                    <div className="fw-semibold">
                      Total value: {portfolio.total_value}
                    </div>
                  )}
                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <Link href="/dashboard" className="btn btn-sm btn-outline-primary">
                      View dashboard
                    </Link>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toast('Add edit flow once available')}>
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}