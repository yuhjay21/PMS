const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  } 

async function apiFetch(path, options = {}) {

  const csrftoken = getCookie('csrftoken');

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // if using session auth
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken || '',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) {
    const msg =
      data?.detail ||            // 👈 DRF standard
      data?.error ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// Dashboard endpoints
export async function getDashboardHoldings(portfolio = 'all') {
  const params = new URLSearchParams({ portfolio });
  try {
    const response = await apiFetch(`/api/v1/dashboard/holdings/?${params.toString()}`);
    return response 
  } catch (err){
    if (err.message =="No Portfolio Exist for this user"){
      throw new Error("NO PORTFOLIO Exists");
    }
    throw err;
  }
}

export async function getPortfolioPerformance(timeframe = '3m', portfolio = 'all') {
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

export function createUserPortfolio(payload) {
  return apiFetch('/api/v1/dashboard/portfolios/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}