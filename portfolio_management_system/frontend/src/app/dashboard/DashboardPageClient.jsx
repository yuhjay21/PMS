'use client';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { useEffect, useState, useRef  } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function DashboardPageClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [valueMode, setValueMode] = useState('%'); // "Value", "%", "PnL"
  const [timeframe, setTimeframe] = useState('3m'); // "1m", "3m", "6m", "1y", "5y", ""
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);

  const fileInputCsvRef = useRef(null);

  function handleCsvFiles(files) {
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  }

  function getCookie(name) {
    if (typeof document === 'undefined') return null;
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  async function handleCsvUpload() {
    if (!csvFile) {
      alert('No file selected!');
      return;
    }

    try {
      setCsvUploading(true);
      const formData = new FormData();
      formData.append('csv_file', csvFile);
      formData.append('portfolio_id', String(summary.selectedPortfolioId ?? ''));

      const res = await fetch(`${API_BASE}/api/v1/dashboard/csv/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      });

      const data = await res.json();
      alert(data.message || 'Upload finished');
    } catch (err) {
      console.error(err);
      alert('Upload failed, please try again.');
    } finally {
      setCsvUploading(false);
    }
  }

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/dashboard/holdings/`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: 300 }}
          >
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading dashboard…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  console.log(data);
  if (!data) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <p className="text-muted">No dashboard data available.</p>
        </div>
      </div>
    );
  }

  const summary = data;
  const holdings = summary.holdings || [];
  const filteredHoldings = showOpenOnly
    ? holdings.filter((h) => h.shares > 0)
    : holdings;

  const performanceTitle =
    valueMode === 'Value'
      ? 'Portfolio Value vs ASX200'
      : valueMode === 'PnL'
      ? 'Portfolio PnL Analysis vs ASX200'
      : 'Portfolio Performance vs ASX200';
  

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* === Page title row === */}
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0">Dashboard</h4>
            </div>
          </div>
        </div>

        {/* === Top stats cards (4 columns) === */}
        <div className="row">
          {/* Portfolio Value */}
          <div className="col-md-6 col-xl-3 mb-3">
            <div className="card shadow">
              <div className="card-body">
                <div className="float-end mt-2">
                  <div id="total-investment-chart" />
                </div>
                <div>
                  <p className="mb-0">Portfolio Value</p>
                  <h5 className="mb-1 mt-1">
                    $
                    {summary.portfolioValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h5>
                  <small className="text-muted">
                    Cash : $
                    {summary.cash.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Unrealized Gain */}
          <div className="col-md-6 col-xl-3 mb-3">
            <div className="card shadow">
              <div className="card-body">
                <div>
                  <p className="mb-0">Unrealized Gain</p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <h5
                      className="mb-1 mt-1"
                      style={{ color: colorBySign(summary.unrealizedPnl) }}
                    >
                      $
                      {summary.unrealizedPnl.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </h5>
                    <small
                      style={{
                        color: colorBySign(summary.unrealizedPnlPct),
                      }}
                    >
                      {summary.unrealizedPnlPct.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%
                    </small>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <small style={{ color: colorBySign(summary.dayPnl) }}>
                      Day: $
                      {summary.dayPnl.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </small>
                    <small style={{ color: colorBySign(summary.dayPnlPct) }}>
                      {summary.dayPnlPct.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}%
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Realized Gain */}
          <div className="col-md-6 col-xl-3 mb-3">
            <div className="card shadow">
              <div className="card-body">
                <div>
                  <p className="mb-0">Realized Gain</p>
                  <h5
                    className="mb-1 mt-1"
                    style={{ color: colorBySign(summary.realizedPnl) }}
                  >
                    $
                    {summary.realizedPnl.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h5>
                  <div
                    className="text-muted"
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <small>
                      Dividends: $
                      {summary.totalDividends.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </small>
                    <small>
                      ( Yield: {summary.dividendYieldPct.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}% )
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Returns */}
          <div className="col-md-6 col-xl-3 mb-3">
            <div className="card shadow">
              <div className="card-body">
                <div className="float-end mt-2">
                  <div id="pnl-chart" />
                </div>
                <div>
                  <p className="mb-0">Total Returns</p>
                  <h5
                    className="mb-1 mt-1"
                    style={{ color: colorBySign(summary.totalReturns) }}
                  >
                    $
                    {summary.totalReturns.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h5>
                  <small
                    style={{ color: colorBySign(summary.totalReturnsPct) }}
                  >
                    {summary.totalReturnsPct.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}%
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Performance chart section === */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card shadow position-relative">
              <div className="card-body">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                  <h5 className="mb-3" id="performance_chart-Title">
                    {performanceTitle}
                  </h5>
                  <div className="page-title-right d-flex align-items-center gap-2">
                    <select
                      id="Value%-select"
                      className="form-select w-auto me-1"
                      value={valueMode}
                      onChange={(e) => setValueMode(e.target.value)}
                    >
                      <option value="Value">Value</option>
                      <option value="%">Performance</option>
                      <option value="PnL">PnL Analysis</option>
                    </select>
                    <select
                      id="timeframe-select"
                      className="form-select w-auto me-1"
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                    >
                      <option value="1m">1M</option>
                      <option value="3m">3M</option>
                      <option value="6m">6M</option>
                      <option value="1y">1Y</option>
                      <option value="5y">5Y</option>
                      <option value="">Max</option>
                    </select>
                  </div>
                </div>

                {/* Chart placeholder – plug React Chart.js here if you want */}
                <div style={{ position: 'relative' }}>
                  <canvas
                    id="portfolioPerformanceChart"
                    style={{ height: 350, maxHeight: 350, width: '100%' }}
                  />
                  <div
                    id="PerformanceSpinner"
                    className="d-none justify-content-center align-items-center"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 10,
                    }}
                  >
                    <div
                      className="spinner-border text-dark"
                      role="status"
                      style={{ width: '3rem', height: '3rem' }}
                    >
                      <span className="visually-hidden">Loading…</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === 3 donut charts row === */}
        <div className="row mb-3">
          {/* Account */}
          <div className="col-md-4 col-sm-12 mb-3">
            <div className="card shadow mh-100">
              <div className="card-body d-flex flex-column align-items-center position-relative">
                <h5 className="text-center fw-bold mb-3">Account</h5>
                <canvas id="account-chart-container" className="mh-75 mw-50" />
                <div
                  id="AccountSpinner"
                  className="d-none justify-content-center align-items-center"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                  }}
                >
                  <div
                    className="spinner-grow text-dark"
                    role="status"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <span className="visually-hidden">Loading…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sectors */}
          <div className="col-md-4 col-sm-12 mb-3">
            <div className="card shadow mh-100">
              <div className="card-body d-flex flex-column align-items-center position-relative">
                <h5 className="text-center fw-bold mb-3">Sectors</h5>
                <canvas id="sector-chart-container" className="mh-75 mw-50" />
                <div
                  id="SectorSpinner"
                  className="d-none justify-content-center align-items-center"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                  }}
                >
                  <div
                    className="spinner-grow text-dark"
                    role="status"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <span className="visually-hidden">Loading…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stocks */}
          <div className="col-md-4 col-sm-12 mb-3">
            <div className="card shadow mh-100">
              <div className="card-body d-flex flex-column align-items-center position-relative">
                <h5 className="text-center fw-bold mb-3">Stocks</h5>
                <canvas id="stock-chart-container" className="mh-75 mw-50" />
                <div
                  id="StockSpinner"
                  className="d-none justify-content-center align-items-center"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10,
                  }}
                >
                  <div
                    className="spinner-grow text-dark"
                    role="status"
                    style={{ width: '3rem', height: '3rem' }}
                  >
                    <span className="visually-hidden">Loading…</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Holdings table === */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-body">

                {/* Header row with filter + Insert Item dropdown */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="p-2 card-title mb-0">Your Holdings</h4>
                  <div className="d-flex align-items-center gap-2 align-items-stretch">
                    
                    {/* Toggle */}
                    <div className="d-flex align-items-center">
                      <label className="switch me-1">
                        <input
                          type="checkbox"
                          checked={showOpenOnly}
                          onChange={() => setShowOpenOnly((x) => !x)}
                        />
                        <span className="slider" />
                      </label>
                      <small
                        id="filter-label"
                        style={{
                          minWidth: 130,
                          display: 'inline-block',
                        }}
                      >
                        {showOpenOnly ? 'Open Positions Only' : 'All Positions'}
                      </small>
                    </div>

                    {/* Insert Item dropdown */}
                    <div className="btn-group">
                      <button type="button" className="btn btn-primary dropdown-toggle" 
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        role="group"
                      >
                        <i className="fa fa-plus" /> Insert Item
                      </button>
                      <div className="dropdown-menu">
                        <h6 className="dropdown-header">Single Item</h6>
                        <a className="dropdown-item" href="#">
                          Add Transaction
                        </a>
                        <button
                          type="button"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#myDepositModal"
                        >
                          Add Deposit
                        </button>
                        <a className="dropdown-item" href="#">
                          Add Dividend
                        </a>

                        <div className="dropdown-divider" />
                        <h6 className="dropdown-header">Bundle</h6>
                        <span id="csvtooltipWrapper">
                          <a
                            className="dropdown-item"
                            href="#"
                            id="import_csv_button"
                            data-bs-toggle="modal"
                            data-bs-target="#myModal_csv"
                          >
                            Import CSV
                          </a>
                        </span>
                        <h6 className="dropdown-header">From Emails</h6>
                        <button className="dropdown-item" type="button">
                          Fetch Transaction
                        </button>
                        <button className="dropdown-item" type="button">
                          Fetch Dividend
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table
                    className="table table-centered table-nowrap mb-0"
                    id="portfolio-table"
                  >
                    <thead className="thead-light">
                      <tr>
                        <th className="text-center align-middle">Company Name</th>
                        <th className="text-center align-middle">Shares</th>
                        <th className="text-center align-middle">Investment</th>
                        <th className="text-center align-middle">Value</th>
                        <th className="text-center align-middle lh-sm">
                          P&amp;L
                          <br />
                          <small className="text-muted fs-6 fw-light">
                            (unRealized)
                          </small>
                        </th>
                        <th className="text-center align-middle lh-sm">
                          Capital Growth
                          <br />
                          <small className="text-muted fs-6 fw-light">
                            (Realized + unRealized)
                          </small>
                        </th>
                        <th className="text-center align-middle">Dividends</th>
                        <th className="text-center align-middle">Total</th>
                        <th className="text-center align-middle">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHoldings.map((c) => (
                        <tr key={c.symbol} id={c.symbol}>
                          <td
                            className="text-center fw-bold"
                            style={{ fontSize: 15 }}
                          >
                            {c.symbol}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{ fontSize: 15 }}
                          >
                            {c.shares}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{ fontSize: 15 }}
                          >
                            {c.shares > 0
                              ? `$${formatMoney(c.investment)}`
                              : '-'}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{ fontSize: 15 }}
                          >
                            {c.shares > 0
                              ? `$${formatMoney(c.value)}`
                              : '-'}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{
                              fontSize: 15,
                              color: colorBySign(c.unrealizedPnl),
                            }}
                          >
                            {c.shares > 0
                              ? `$${formatMoney(c.unrealizedPnl)}`
                              : '-'}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{
                              fontSize: 15,
                              color: colorBySign(c.capitalGrowth),
                            }}
                          >
                            ${formatMoney(c.capitalGrowth)}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{
                              fontSize: 15,
                              color: c.dividends > 0 ? 'green' : 'black',
                            }}
                          >
                            {c.dividends > 0
                              ? `$${formatMoney(c.dividends)}`
                              : '-'}
                          </td>
                          <td
                            className="text-center fw-bold"
                            style={{
                              fontSize: 15,
                              color: colorBySign(c.total),
                            }}
                          >
                            {c.total !== 0
                              ? `$${formatMoney(c.total)}`
                              : '-'}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-primary btn-md btn-rounded waves-effect waves-light"
                              onClick={() => {
                                console.log('View details for', c.symbol);
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          backgroundColor: '#f5f5f5',
                          fontWeight: 'bold',
                        }}
                      >
                        <td
                          className="text-end"
                          colSpan={2}
                          style={{ fontSize: 20 }}
                        >
                          Total
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          ${formatMoney(summary.totalInvestment)}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          ${formatMoney(summary.portfolioValue)}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          ${formatMoney(summary.unrealizedPnl)}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          $
                          {formatMoney(
                            summary.realizedPnl + summary.unrealizedPnl
                          )}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          ${formatMoney(summary.totalDividends)}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }}>
                          ${formatMoney(summary.totalReturns)}
                        </td>
                        <td className="text-center" style={{ fontSize: 20 }} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* React modals for CSV / Deposit etc. can be added later */}

                {/* === CSV Upload Modal === */}
                <div className="row">
                  <div
                    id="myModal_csv"
                    className="modal fade"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h4 className="modal-title">Add Stocks to your Portfolio</h4>
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            data-bs-dismiss="modal"
                          />
                        </div>

                        <div className="modal-body">
                          <div
                            id="drop-area"
                            className={`p-4 text-center border ${
                              csvDragActive ? 'highlight' : ''
                            }`}
                            style={{ cursor: 'pointer' }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCsvDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCsvDragActive(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCsvDragActive(false);
                              handleCsvFiles(e.dataTransfer.files);
                            }}
                            onClick={() => fileInputCsvRef.current?.click()}
                          >
                            {csvFile
                              ? `Selected file: ${csvFile.name}`
                              : 'Drop CSV here, or click to upload.'}
                          </div>

                          <input
                            type="file"
                            id="file-input-csv"
                            ref={fileInputCsvRef}
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={(e) => handleCsvFiles(e.target.files)}
                          />

                          <div id="preview-csv" className="mt-2">
                            {csvFile && (
                              <span className="text-muted">
                                Selected file: <strong>{csvFile.name}</strong>
                              </span>
                            )}
                          </div>

                          <div className="mt-3 d-flex gap-2">
                            <button
                              id="clear-btn"
                              className="btn btn-danger"
                              type="button"
                              onClick={() => setCsvFile(null)}
                            >
                              Clear
                            </button>
                            <button
                              id="submit-btn-csv"
                              className="btn btn-primary"
                              type="button"
                              onClick={handleCsvUpload}
                              disabled={csvUploading}
                            >
                              {csvUploading ? 'Uploading…' : 'Upload'}
                            </button>
                          </div>
                        </div>

                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-danger"
                            data-bs-dismiss="modal"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* === Deposit Modal === */}
                  <div
                    id="myDepositModal"
                    className="modal fade"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h4 className="modal-title">
                            Add Deposit to your Portfolio
                          </h4>
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            data-bs-dismiss="modal"
                          />
                        </div>
                        <div className="modal-body">
                          <form id="add-deposit-form">
                            <input
                              name="p_id"
                              type="hidden"
                              className="form-control"
                              value={summary.selectedPortfolioId ?? ''}
                              readOnly
                            />

                            <div className="form-group row mb-4">
                              <label
                                htmlFor="currency"
                                className="col-sm-3 col-form-label"
                              >
                                Currency
                              </label>
                              <div className="col-sm-9">
                                <input
                                  name="currency"
                                  className="form-control"
                                  id="currency"
                                  type="text"
                                  defaultValue="AUD"
                                />
                              </div>
                            </div>

                            <div className="form-group row mb-4">
                              <label
                                htmlFor="date-transaction"
                                className="col-sm-3 col-form-label"
                              >
                                Date of Transaction
                              </label>
                              <div className="col-sm-9">
                                <input
                                  name="date-transaction"
                                  className="form-control"
                                  type="date"
                                  id="date-transaction"
                                  defaultValue={todayStr}
                                  max={todayStr}
                                />
                              </div>
                            </div>

                            <div className="form-group row mb-4">
                              <label
                                htmlFor="amount"
                                className="col-sm-3 col-form-label"
                              >
                                Amount
                              </label>
                              <div className="col-sm-9">
                                <input
                                  name="amount"
                                  className="form-control"
                                  type="number"
                                  defaultValue={0}
                                  min={0}
                                  step={1}
                                  id="amount"
                                />
                              </div>
                            </div>

                            <div className="form-group row mb-4">
                              <label
                                htmlFor="platform"
                                className="col-sm-3 col-form-label"
                              >
                                Platform
                              </label>
                              <div className="col-sm-9">
                                <input
                                  name="platform"
                                  className="form-control"
                                  type="text"
                                  defaultValue="STAKE"
                                  id="platform"
                                />
                              </div>
                            </div>

                            <div className="row mt-4 justify-content-center">
                              <div className="col-auto mx-auto">
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                >
                                  Submit
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-danger"
                            data-bs-dismiss="modal"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end modals */}
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === helpers === */

function colorBySign(value) {
  if (value > 0) return 'green';
  if (value < 0) return 'red';
  return '#495057';
}

function formatMoney(value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
