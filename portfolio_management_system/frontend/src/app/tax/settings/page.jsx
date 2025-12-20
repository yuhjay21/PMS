'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function TaxSettingsPage() {
  const [taxResidence, setTaxResidence] = useState('');
  const [filingStatus, setFilingStatus] = useState('single');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.success('Tax preferences saved locally. Connect to backend to persist.');
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Compliance</p>
          <h1 className="h3 mb-0">Tax settings</h1>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">Tax profile</h2>
            </div>
            <div className="card-body">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="taxResidence">
                    Tax residency
                  </label>
                  <input
                    id="taxResidence"
                    className="form-control"
                    placeholder="e.g. United States"
                    value={taxResidence}
                    onChange={(e) => setTaxResidence(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="filingStatus">
                    Filing status
                  </label>
                  <select
                    id="filingStatus"
                    className="form-select"
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value)}
                  >
                    <option value="single">Single</option>
                    <option value="married_joint">Married filing jointly</option>
                    <option value="married_separate">Married filing separately</option>
                    <option value="head_of_household">Head of household</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="currency">
                    Preferred currency
                  </label>
                  <select
                    id="currency"
                    className="form-select"
                    value={preferredCurrency}
                    onChange={(e) => setPreferredCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="notes">Additional notes</label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={4}
                    placeholder="Include any compliance guidance or filing reminders"
                  />
                </div>

                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    Save tax settings
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => toast('Restore from backend when available')}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Tips</h2>
            </div>
            <div className="card-body">
              <ul className="mb-0 small text-muted">
                <li className="mb-2">Use your primary tax residency for accurate reporting.</li>
                <li className="mb-2">All currency selections are applied to dashboards and exports.</li>
                <li>Consult your tax advisor before submitting official filings.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}