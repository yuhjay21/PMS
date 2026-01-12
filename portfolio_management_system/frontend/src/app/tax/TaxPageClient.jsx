'use client';

import '@/styles/globals.css';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getTaxOverview, getUserPortfolios } from '@/services/api';

const ALL_PORTFOLIOS = 'all';

function getStoredPortfolioId() {
  if (typeof window === 'undefined') return ALL_PORTFOLIOS;
  return localStorage.getItem('selectedPortfolioId') || ALL_PORTFOLIOS;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}



export default function TaxPageClient() {
  const [portfolios, setPortfolios] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(ALL_PORTFOLIOS);
  const [selectedFY, setSelectedFY] = useState('max');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    deposits: 0,
    capital_growth: 0,
    dividends: 0,
    total: 0,
  });
  const [transactions, setTransactions] = useState([]);

  const totalColor = useMemo(() => {
    if (summary.total > 0) return 'green';
    if (summary.total < 0) return 'red';
    return '#495057';
  }, [summary.total]);

  const capitalGrowthColor = useMemo(() => {
    if (summary.capital_growth > 0) return 'green';
    if (summary.capital_growth < 0) return 'red';
    return '#495057';
  }, [summary.capital_growth]);

  const handleFYChange = (event) => {
    const value = event.target.value;
    setSelectedFY(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedFY', value);
      window.dispatchEvent(new CustomEvent('FYSelected', { detail: value }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getUserPortfolios();
        if (!isMounted) return;
        const portfolioList = response.portfolios || [];
        setPortfolios(portfolioList);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError(err.message || 'Unable to load portfolios');
        toast.error('Unable to load portfolios');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
      if (typeof window === 'undefined') return undefined;
  
      setSelectedPortfolio(getStoredPortfolioId());
      
      const handlePortfolioSelected = (event) => {
        const value = event?.detail ?? ALL_PORTFOLIOS;
        setSelectedPortfolio(String(value || ALL_PORTFOLIOS));
      };
  
      window.addEventListener('portfolioSelected', handlePortfolioSelected);
  
      return () => {
        window.removeEventListener('portfolioSelected', handlePortfolioSelected);
      };
    }, []);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getTaxOverview({
          portfolio: selectedPortfolio || ALL_PORTFOLIOS,
          fy: selectedFY || 'max',
        });

        if (!isMounted) return;

        setFinancialYears(response.financial_years || []);
        setSummary({
          deposits: response.deposits ?? 0,
          capital_growth: response.capital_growth ?? 0,
          dividends: response.dividends ?? 0,
          total: response.total ?? 0,
        });
        setTransactions(response.transactions || []);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError(err.message || 'Unable to load tax overview');
        toast.error('Unable to load tax overview');
        setSummary({
          deposits: 0,
          capital_growth: 0,
          dividends: 0,
          total: 0,
        });
        setTransactions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedPortfolio, selectedFY]);

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row mb-2">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Tax overview</h4>
              <div className="d-flex align-items-center gap-2" >
                <label className="form-label mb-0" htmlFor="fy-select" style={{minWidth:'111px', }}>
                  Financial Year:
                </label>
                <select
                  id="fy-select"
                  className="form-select form-select-sm"
                  value={selectedFY}
                  style={{minWidth:'111px', }}
                  onChange={handleFYChange}
                >
                  <option value="max">Max</option>
                  {financialYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-0">Investment</p>
                <h5 className="mb-1 mt-2">{formatCurrency(summary.deposits)}</h5>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-0">Capital Growth</p>
                <h5 className="mb-1 mt-2" style={{ color: capitalGrowthColor }}>
                  {formatCurrency(summary.capital_growth)}
                </h5>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-0">Dividends</p>
                <h5 className="mb-1 mt-2">{formatCurrency(summary.dividends)}</h5>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-0">Total Realized Returns</p>
                <h5 className="mb-1 mt-2" style={{ color: totalColor }}>
                  {formatCurrency(summary.total)}
                </h5>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Transactions</h3>
            </div>

            {loading ? (
              <p className="mb-0">Loading transactions...</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-centered table-nowrap mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="text-center">Portfolio</th>
                      <th className="text-center">Date of Transaction</th>
                      <th className="text-center">Symbol</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Shares</th>
                      <th className="text-center">Buy Price</th>
                      <th className="text-center">Commission</th>
                      <th className="text-center">Total Cost</th>
                      <th className="text-center">Realized PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center text-muted py-4">
                          No transactions available for the selected filters.
                        </td>
                      </tr>
                    )}
                    {transactions.map((transaction) => {
                      const realizedPnl = transaction.realized_pnl ?? 0;
                      let pnlColor = 'black';
                      if (realizedPnl > 0) pnlColor = 'green';
                      if (realizedPnl < 0) pnlColor = 'red';

                      return (
                        <tr key={transaction.id}>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {transaction.portfolio_name}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {transaction.date_transaction}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {transaction.symbol}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {transaction.transaction_type}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {formatNumber(transaction.quantity ?? transaction.Quantity)}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {formatCurrency(transaction.buy_price ?? transaction.Buy_Price)}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {formatCurrency(transaction.commission ?? transaction.Commission)}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14 }}>
                            {formatCurrency(transaction.total ?? transaction.Total)}
                          </td>
                          <td className="text-body text-center" style={{ fontSize: 14, color: pnlColor }}>
                            {realizedPnl ? formatCurrency(realizedPnl) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}