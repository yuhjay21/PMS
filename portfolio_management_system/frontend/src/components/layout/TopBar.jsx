'use client';
import { useEffect, useState } from 'react';
import { getCurrentUser } from "@/lib/auth";
import { getUserPortfolios } from "@/services/api";
import { toast  } from 'react-hot-toast';

const ALL_PORTFOLIOS = 'all';

function getStoredPortfolioId() {
  if (typeof window === 'undefined') return ALL_PORTFOLIOS;
  return localStorage.getItem('selectedPortfolioId') || ALL_PORTFOLIOS;
}

export default function TopBar() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState(ALL_PORTFOLIOS);

  useEffect(() => {
    setSelectedPortfolio(getStoredPortfolioId());

    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (!currentUser) {
          setPortfolioLoading(false);
          return;
        }

        const portfolioResponse = await getUserPortfolios();
        const userPortfolios = portfolioResponse.portfolios || [];
        setPortfolios(userPortfolios);

        // Ensure the selected portfolio exists; fall back to first portfolio or "all"
        const storedSelection = getStoredPortfolioId();
        const validIds = userPortfolios.map((p) => String(p.id));
        let resolvedSelection = storedSelection;

        if (storedSelection !== ALL_PORTFOLIOS && !validIds.includes(storedSelection)) {
          resolvedSelection = userPortfolios.length ? String(userPortfolios[0].id) : ALL_PORTFOLIOS;
        }

        if (resolvedSelection !== selectedPortfolio) {
          setSelectedPortfolio(resolvedSelection);
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedPortfolioId', resolvedSelection);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('Unable to load portfolios.');
      } finally {
        setPortfolioLoading(false);
        setUserLoading(false);
      }
    })();
  }, []);

  // useEffect(() => {
  //   if (user) {
  //     toast(`Logged In as ${user.username}`);
  //   }
  // }, [user]);

  const handlePortfolioChange = (event) => {
    const value = event.target.value;
    setSelectedPortfolio(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPortfolioId', value);
      window.dispatchEvent(new CustomEvent('portfolioSelected', { detail: value }));
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-title">Portfolio Dashboard</div>
      <div className="topbar-right d-flex align-items-center gap-3 fw-bold text-white">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="topbar-portfolio-select" className="mb-0">
            Portfolio:
          </label>
          <select
            id="topbar-portfolio-select"
            className="form-select form-select-sm"
            style={{ minWidth: '180px' }}
            value={selectedPortfolio}
            onChange={handlePortfolioChange}
            disabled={portfolioLoading || !user || portfolios.length === 0}
          >
            <option value={ALL_PORTFOLIOS}>All Portfolios</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name || `Portfolio ${portfolio.id}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          {userLoading
            ? 'Checking login...'
            : user
              ? `Logged in as: ${user.username} (${new Date().toDateString()})` 
              : 'Not logged in'}
        </div>
      </div>
    </header>
  );
}