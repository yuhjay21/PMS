'use client';

import '@/styles/globals.css';
import { useEffect, useState, useRef, useMemo  } from 'react';
import { toast  } from 'react-hot-toast';
import { getCurrentUser } from "@/lib/auth";
import { getDashboardHoldings } from "@/services/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const API_VER =
  process.env.NEXT_PUBLIC_API_VER_URL ;

const ALL_PORTFOLIOS = 'all';

function getStoredPortfolioId() {
  if (typeof window === 'undefined') return ALL_PORTFOLIOS;
  return localStorage.getItem('selectedPortfolioId') || ALL_PORTFOLIOS;
}


function loadScriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();
    if (id && document.getElementById(id)) return resolve();

    const existing = [...document.scripts].find((s) => s.src === src);
    if (existing) return resolve();

    const s = document.createElement('script');
    if (id) s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}


/* ========= Stock Details Modal component ========= */

function StockDetailsModal({ c, transactions }) {
  const modalId = `stockdetails-${c.CompanySymbol}`;
  const tvChartId = `tradingview_${c.CompanySymbol}`;
  const symbolInfoHostId = `tv_symbol_info_${c.CompanySymbol}`;

  const holdingTxns = useMemo(() => {
    return (transactions || []).filter(
      (t) => String(t.Holding) === String(c.id)
    );
  }, [transactions, c.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;

    const onShown = async () => {
      // 1) Symbol info widget (external-embedding)
      const symbolInfoHost = document.getElementById(symbolInfoHostId);
      if (symbolInfoHost) {
        symbolInfoHost.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'tradingview-widget-container';

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src =
          'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
        script.async = true;

        const symbol = `${c.exchange}:${c.CompanySymbol}`;
        script.innerHTML = JSON.stringify({
          symbol,
          width: '100%',
          locale: 'in',
          colorTheme: 'light',
          isTransparent: false,
        });

        container.appendChild(script);
        symbolInfoHost.appendChild(container);
      }

      // 2) Chart widget (tv.js + TradingView.widget)
      await loadScriptOnce('https://s3.tradingview.com/tv.js', 'tvjs');

      const chartHost = document.getElementById(tvChartId);
      if (chartHost) {
        chartHost.innerHTML = '';

        // TradingView is global from tv.js
        // eslint-disable-next-line no-undef
        new TradingView.widget({
          width: '100%',
          height: 610,
          symbol: `${c.exchange}:${c.CompanySymbol}`,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'light',
          style: '1',
          locale: 'in',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          withdateranges: true,
          container_id: tvChartId,
        });
      }
    };

    const onHidden = () => {
      // optional cleanup
      const symbolInfoHost = document.getElementById(symbolInfoHostId);
      if (symbolInfoHost) symbolInfoHost.innerHTML = '';
      const chartHost = document.getElementById(tvChartId);
      if (chartHost) chartHost.innerHTML = '';
    };

    modalEl.addEventListener('shown.bs.modal', onShown);
    modalEl.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalEl.removeEventListener('shown.bs.modal', onShown);
      modalEl.removeEventListener('hidden.bs.modal', onHidden);
    };
  }, [modalId, symbolInfoHostId, tvChartId, c.exchange, c.CompanySymbol]);

  return (
    <div id={modalId} className="modal fade" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg" >
        <div className="modal-content" >
          <div className="modal-header">
            <h4 className="modal-title">
              {c.CompanyName} ({c.CompanySymbol})
            </h4>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              data-bs-dismiss="modal"
            />
          </div>

          <div className="modal-body">
            <div className="col-12 justify-content-center">
              <div id={symbolInfoHostId} />
            </div>

            <div className="col-12 justify-content-center mt-3">
              <div className="tradingview-widget-container">
                <div id={tvChartId} />
                <div className="tradingview-widget-copyright">&nbsp;</div>
              </div>
            </div>

            <div className="col-12 justify-content-center mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="p-2 fs-5 card-title mb-0">Holding Transactions</p>
              </div>

              <div
                className="table-responsive"
                id={`financials-${c.CompanySymbol}`}
              >
                <table className="table table-centered table-nowrap mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th className="text-center h6">Portfolio</th>
                      <th className="text-center h6">Date of Transaction</th>
                      <th className="text-center h6">Symbol</th>
                      <th className="text-center h6">Type</th>
                      <th className="text-center h6">Shares</th>
                      <th className="text-center h6">Buy Price</th>
                      <th className="text-center h6">Commission</th>
                      <th className="text-center h6">Total Cost</th>
                      <th className="text-center h6">Realized PnL</th>
                    </tr>
                  </thead>

                  <tbody>
                    {holdingTxns.map((t) => (
                      <tr key={t.id} id={`Holding_transaction_${t.id}`}>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 12}}
                        >
                          {t.portfolio_name}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 12 }}
                        >
                          {t.date_transaction}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 12 }}
                        >
                          {t.symbol}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 12 }}
                        >
                          {t.transaction_type}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 15 }}
                        >
                          {formatMoney(Number(t.Quantity || 0))}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 15 }}
                        >
                          ${formatMoney(Number(t.Buy_Price || 0))}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 15 }}
                        >
                          ${formatMoney(Number(t.Commission || 0))}
                        </td>
                        <td
                          className="text-body text-center"
                          style={{ fontSize: 15 }}
                        >
                          ${formatMoney(Number(t.Total || 0))}
                        </td>
                        <td
                          className="fw-bold text-center"
                          style={{
                            fontSize: 15,
                            color: colorBySign(t.realized_pnl),
                          }}
                        >
                          {t.realized_pnl != null && t.realized_pnl !== ''
                            ? `$${formatMoney(Number(t.realized_pnl))}`
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-12 justify-content-center">
              {/* Placeholder for Dividends Information */}
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
  );
}


export default function DashboardPageClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [valueMode, setValueMode] = useState('%'); // "Value", "%", "PnL"
  const [timeframe, setTimeframe] = useState('3m'); // "1m", "3m", "6m", "1y", "5y", ""
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(ALL_PORTFOLIOS);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  const tableRef = useRef(null);
  const footerRef = useRef(null);
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

  async function handleCsvUpload(files) {

    if (!csvFile) {
      alert('No file selected!');
      return;
    }

    try {
      setCsvUploading(true);
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('reset_portfolio','true');
      const uploadPortfolioId =
        selectedPortfolio && selectedPortfolio !== ALL_PORTFOLIOS
          ? selectedPortfolio
          : '';
      formData.append('portfolio_id', uploadPortfolioId);

      const res = await fetch(`${API_BASE}/api/v1/dashboard/csv/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
      });

      const data = await res.json();
      console.log(data);
      alert(data.message || 'Upload finished');
    } catch (err) {
      console.error(err);
      alert('Upload failed, please try again.');
    } finally {
      setCsvUploading(false);
    }
  }

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
    getCurrentUser().then(setUser);
    import('bootstrap/dist/js/bootstrap.bundle.min.js');

  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function fetchDashboard() {
      try {
        setLoading(true);
        const json = await getDashboardHoldings(selectedPortfolio || ALL_PORTFOLIOS);
        if (!isCancelled) setData(json);
      } catch (e) {
        console.error(e);
        if (!isCancelled) toast.error('Failed to load dashboard data.');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    fetchDashboard();

    return () => {
      isCancelled = true;
    };
  }, [selectedPortfolio]);
  
  useEffect(() => {
    if (!tableRef.current || !footerRef.current) return;

    const tableRows = tableRef.current.querySelectorAll("tbody tr");
    const tableFooterRow = footerRef.current;

    let sum_Invested = 0,
      sum_Value = 0,
      sum_PnL = 0,
      sum_CGrowth = 0,
      sum_Dividends = 0,
      sum_total = 0;

    const toNumber = (el) =>
      parseFloat(el?.textContent.replace(/[^\d.-]/g, "")) || 0;

    tableRows.forEach((row) => {
      //const amountValue = toNumber(row.querySelector("td:nth-child(3)"));
      const Invest_V = toNumber(row.querySelector("td:nth-child(3)"));
      const Value_V = toNumber(row.querySelector("td:nth-child(4)"));
      const Pnl_V = toNumber(row.querySelector("td:nth-child(5)"));
      const CGrowth_V = toNumber(row.querySelector("td:nth-child(6)"));
      const Dividends_V = toNumber(row.querySelector("td:nth-child(7)"));
      const Total_V = toNumber(row.querySelector("td:nth-child(8)"));


      sum_Invested += Invest_V;
      sum_Value += Value_V;
      sum_PnL += Pnl_V;
      sum_CGrowth += CGrowth_V;
      sum_Dividends += Dividends_V;
      sum_total += Total_V;
    });

    const fmt = (n) =>
      `$ ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const setCell = (idx, value, color) => {
      const td = tableFooterRow.querySelector(`td:nth-child(${idx})`);
      if (!td) return;
      td.textContent = fmt(value);
      if (color) td.style.color = color;
    };

    setCell(2, sum_Invested);
    setCell(3, sum_Value);
    setCell(4, sum_PnL, sum_PnL > 0 ? "green" : sum_PnL < 0 ? "red" : "black");
    setCell(5, sum_CGrowth, sum_CGrowth > 0 ? "green" : sum_CGrowth < 0 ? "red" : "black");
    setCell(6, sum_Dividends);
    setCell(7, sum_total, sum_total > 0 ? "green" : sum_total < 0 ? "red" : "black");
  }, [showOpenOnly, data]);

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
  ? holdings.filter((h) => h["NumberShares"] > 0)
  : holdings;
  const transactions = summary.transactions || [];

  const performanceTitle =
    valueMode === 'Value'
      ? 'Portfolio Value vs ASX200'
      : valueMode === 'PnL'
      ? 'Portfolio PnL Analysis vs ASX200'
      : 'Portfolio Performance vs ASX200';
  //console.log(data);
  


  return (
    <div className="page-content">
      <div className="container-fluid">

        {/* === Notification Div === */}

        <div className="row">
          <div className="col-12">
             
          </div>
        </div>



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
                    {formatMoney(summary.Total_Value)}
                  </h5>
                  <small className="text-muted">
                    Cash : $
                    {formatMoney(summary.total_cash)}
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
                      style={{ color: colorBySign(summary.unadjusted_PnL) }}
                    >
                      $
                      {formatMoney(summary.unadjusted_PnL)}
                    </h5>
                    <small
                      style={{
                        color: colorBySign(summary.current_growth),
                      }}
                    >
                      {formatMoney(summary.current_growth)}%
                    </small>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                    }}
                  >
                    <small style={{ color: colorBySign(summary.yesterday_PnL) }}>
                      Day: $
                      {formatMoney(summary.yesterday_PnL )}
                    </small>
                    <small style={{ color: colorBySign(summary.y_current_growth) }}>
                      {formatMoney(summary.y_current_growth )}%
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
                    {formatMoney(summary.realizedPnl )}
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
                      {formatMoney(summary.Total_dividends )}
                    </small>
                    <small>
                      ( Yield: {formatMoney(summary.Dividend_per )}% )
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
                    style={{ color: colorBySign(summary.Total_Returns) }}
                  >
                    $
                    {formatMoney(summary.Total_Returns )}
                  </h5>
                  <small
                    style={{ color: colorBySign(summary.Total_Pnl_per) }}
                  >
                    {formatMoney(summary.Total_Pnl_per )}%
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
                  <h5 className="fw-bold mb-0">Your Holdings</h5>
                  <div className="d-flex align-items-center gap-2 align-items-stretch">
                    {/* Toggle */}
                    <div className="d-flex align-items-center">
                      <div className="form-check form-switch me-1 mr-2" role="switch">
                        <input
                          type="checkbox"
                          className="form-check-input h-75 w-100"
                          
                          checked={showOpenOnly}
                          onChange={() => setShowOpenOnly((x) => !x)}
                        />
                        <label className="slider" />
                      </div>
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
                      <button
                        type="button"
                        className="btn btn-primary dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        role="group"
                      >
                        <i className="fa fa-plus" /> Insert Item
                      </button>
                      <div className="dropdown-menu">
                        <h6 className="dropdown-header">Single Item</h6>
                        <button
                          type="button"
                          className="dropdown-item"
                          data-bs-toggle="modal"
                          data-bs-target="#myTransactionModal"
                        >
                          Add Transaction
                        </button>
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
                        <span
                          id="csvtooltipWrapper"
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          data-bs-title="Tooltip on top"
                        >
                          <a
                            className={`dropdown-item ${
                              selectedPortfolio == 'all' ? 'disabled' : ''
                            }`}
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
                  <table ref={tableRef}
                    className="table table-centered table-nowrap mb-0"
                    id="portfolio-table"
                  >
                    <thead className="thead-light">
                      <tr>
                        <th className="text-center align-middle h6">Company Name</th>
                        <th className="text-center align-middle h6">Shares</th>
                        <th className="text-center align-middle h6">Investment</th>
                        <th className="text-center align-middle h6">Value</th>
                        <th className="text-center align-middle lh-sm h6">
                          P&amp;L
                          <br />
                          <small className="text-muted fs-6 fw-light">
                            (unRealized)
                          </small>
                        </th>
                        <th className="text-center align-middle lh-sm h6">
                          Capital Growth
                          <br />
                          <small className="text-muted fs-6 fw-light h6">
                            (Realized + unRealized)
                          </small>
                        </th>
                        <th className="text-center align-middle h6">Dividends</th>
                        <th className="text-center align-middle h6">Total</th>
                        <th className="text-center align-middle h6">Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredHoldings.map((c) => (
                        <tr key={c.id} id={`${c.CompanySymbol}_${c.id}`}>
                          <td className="text-center" style={{ fontSize: 15 }}>
                            {c.CompanySymbol}
                          </td>

                          <td className="text-center" style={{ fontSize: 15 }}>
                            {c.NumberShares}
                          </td>

                          <td className="text-center" style={{ fontSize: 15 }}>
                            {c.NumberShares > 0 ? `$${formatMoney(c.InvestmentAmount)}` : '-'}
                          </td>

                          <td className="text-center" style={{ fontSize: 15 }}>
                            {c.NumberShares > 0 ? `$${formatMoney(c.Value)}` : '-'}
                          </td>

                          <td
                            className="text-center"
                            style={{ fontSize: 15, color: colorBySign(c.uPnL) }}
                          >
                            {c.NumberShares > 0 ? `$${formatMoney(c.uPnL)}` : '-'}
                          </td>

                          <td
                            className="text-center"
                            style={{ fontSize: 15, color: colorBySign(c.PnL) }}
                          >
                            ${formatMoney(c.PnL)}
                          </td>

                          <td
                            className="text-center"
                            style={{
                              fontSize: 15,
                              color: c.Dividends_total > 0 ? 'green' : 'black',
                            }}
                          >
                            {c.Dividends_total > 0
                              ? `$${formatMoney(c.Dividends_total)}`
                              : '-'}
                          </td>

                          <td
                            className="text-center"
                            style={{ fontSize: 15, color: colorBySign(c.Total) }}
                          >
                            {c.Total !== 0 ? `$${formatMoney(c.Total)}` : '-'}
                          </td>

                          <td className="text-center">
                            {/* ✅ Open the correct modal */}
                            <button
                              type="button"
                              className="btn btn-primary btn-md btn-rounded waves-effect waves-light"
                              data-bs-toggle="modal"
                              data-bs-target={`#stockdetails-${c.CompanySymbol}`}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr ref={footerRef}>
                        <td className="text-end fw-bold" colSpan={2} style={{ fontSize: 15 }}>
                          Total
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.totalInvestment)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.Total_Value)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.unadjusted_PnL)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.realizedPnl) + formatMoney(summary.unrealizedPnl)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.totalDividends)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }}>
                          ${formatMoney(summary.totalReturns)}
                        </td>
                        <td className="text-center" style={{ fontSize: 15 }} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* React modals for CSV / Deposit etc. can be added later */}
        
        
        <div className="row">

        {filteredHoldings.map((c) => (
          <StockDetailsModal key={`modal-${c.id || c.CompanySymbol}`} c={c} transactions={transactions} />
        ))}


          {/* === Deposit Modal === */}
          <div id="myModal_csv" className="modal fade" tabIndex={-1} aria-hidden="true" >
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

          {/* === Transaction Modal === */}
          <div
            id="myTransactionModal"
            className="modal fade"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">
                    Add Transactions to your Portfolio
                  </h4>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    data-bs-dismiss="modal"
                  />
                </div>
                <div className="modal-body">
                  <form id="add-transaction-form" >
                    <input
                      name="p_id"
                      type="hidden"
                      className="form-control"
                      value={summary.selectedPortfolioId ?? ''}
                      readOnly
                    />
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
                        htmlFor="Symbol"
                        className="col-sm-3 col-form-label"
                      >
                        Company Symbol
                      </label>
                      <div className="col-sm-9">
                        <input
                          name="Symbol"
                          className="form-control"
                          id="Symbol"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="form-group row mb-4">
                      <label
                        htmlFor="type"
                        className="col-sm-3 col-form-label"
                      >
                        Type
                      </label>
                      <div className="col-sm-9">
                        <select
                          name="type"
                          className="form-control"
                          //type="number"
                          defaultValue="buy"
                          id="type"
                        >
                          <option value="Buy">Buy</option>
                          <option value="Sell">Sell</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group row mb-4">
                      <label
                        htmlFor="price"
                        className="col-sm-3 col-form-label"
                      >
                        Price
                      </label>
                      <div className="col-sm-9">
                        <input
                          name="price"
                          className="form-control"
                          type="number"
                          defaultValue="0"
                          id="price"
                        />
                      </div>
                    </div>

                    <div className="form-group row mb-4">
                      <label
                        htmlFor="quantity"
                        className="col-sm-3 col-form-label"
                      >
                        Quantity
                      </label>
                      <div className="col-sm-9">
                        <input
                          name="quantity"
                          className="form-control"
                          type="number"
                          defaultValue={0}
                          min={0}
                          step={1}
                          id="quantity"
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
                    
                    
                    <div className="form-group row mb-4">
                      <label
                        htmlFor="Exchange"
                        className="col-sm-3 col-form-label"
                      >
                        Exchange
                      </label>
                      <div className="col-sm-9">
                        <select
                          name="Exchange"
                          className="form-control"
                          defaultValue="ASX"
                          id="Exchange"
                        >
                          <option value="ASX">ASX</option>
                          <option value="PSX">PSX</option>
                          <option value="US">US</option>
                        </select>
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
  );
}

/* === helpers === */

function colorBySign(value) {
  if (value > 0) return 'green';
  if (value < 0) return 'red';
  return '#495057';
}

function formatMoney(value) {
  if (value === 0) return 0;
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not working";
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
