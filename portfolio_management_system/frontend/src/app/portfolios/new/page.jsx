'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createUserPortfolio } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function AddPortfolioPage() {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [platform, setPlatform] = useState('STAKE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createUserPortfolio({ name, currency, platform, description });
      toast.success('Portfolio created successfully');
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to create portfolio');
      toast.error('Unable to create portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Investments</p>
          <h1 className="h3 mb-0">Add a portfolio</h1>
        </div>
        <Link href="/portfolios" className="btn btn-outline-secondary">
          Back to portfolios
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">Portfolio details</h2>
            </div>
            <div className="card-body">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-12">
                  <label className="form-label" htmlFor="portfolioName">Portfolio name</label>
                  <input
                    id="portfolioName"
                    className="form-control"
                    placeholder="Long-term holdings"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-3">
                  <label className="form-label" htmlFor="portfolioCurrency">Portfolio Currency</label>
                </div>
                <div className="col-9">  
                  <select
                    id="portfolioCurrency"
                    className="form-select"
                    placeholder="AUD"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                  >
                  <option key="AUD" value="AUD" defaultValue>AUD</option>
                  <option key="USD" value="USD">USD</option>
                  <option key="PKR" value="PKR">PKR</option>
                  </select>
                </div>
                <div className="col-3">
                  <label className="form-label" htmlFor="portfolioPlatform">Portfolio Platform</label>
                </div>
                <div className="col-9">  
                  <select
                    id="portfolioPlatform"
                    className="form-select"
                    placeholder="Stake"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    required
                  >
                  <option key="STAKE" value="STAKE" defaultValue>STAKE</option>
                  <option key="JsHolding" value="JsHolding">Js Holding</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="portfolioDescription">Description</label>
                  <textarea
                    id="portfolioDescription"
                    className="form-control"
                    rows={4}
                    placeholder="Add a note about this portfolio"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {error && <div className="alert alert-danger mb-0">{error}</div>}

                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create portfolio'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setName('');
                      setDescription('');
                      setCurrency('');
                      setPlateform('');
                      setError('');
                    }}
                    disabled={submitting}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Guidance</h2>
            </div>
            <div className="card-body">
              <ul className="mb-0 small text-muted">
                <li className="mb-2">Use meaningful names so you can quickly select portfolios in the top bar.</li>
                <li className="mb-2">Descriptions help teammates understand the goal for this set of holdings.</li>
                <li>Creation uses the authenticated session; ensure you are logged in.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}