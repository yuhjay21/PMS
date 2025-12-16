const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // if using session auth
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

// Dashboard endpoints
export function getDashboardHoldings(portfolio = 'all') {
  const params = new URLSearchParams({ portfolio });
  return apiFetch(`/api/v1/dashboard/holdings/?${params.toString()}`);
}

export function getPortfolioPerformance(timeframe = '3m', portfolio = 'all') {
  const params = new URLSearchParams({ timeframe, portfolio });
  return apiFetch(`/api/v1/dashboard/performance/?${params.toString()}`);
}

export function getPortfolioInsights(portfolio = 'all') {
  const params = new URLSearchParams({ portfolio });
  return apiFetch(`/api/v1/dashboard/insights/?${params.toString()}`);
}

export function getPriceHistory(symbol, range = '1y') {
  const params = new URLSearchParams({ symbol, range });
  return apiFetch(`/api/v1/dashboard/prices/history/?${params.toString()}`);
}

export function getUserPortfolios() {
  return apiFetch('/api/v1/dashboard/portfolios/');
}