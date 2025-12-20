'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const menuRef = useRef(null);

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
        console.log(userPortfolios);
        setPortfolios(userPortfolios);

        // Ensure the selected portfolio exists; fall back to first portfolio or "all"
        const storedSelection = getStoredPortfolioId();
        const validIds = userPortfolios.map((p) => String(p.id));
        let resolvedSelection = storedSelection;

        if (storedSelection !== ALL_PORTFOLIOS && !validIds.includes(storedSelection)) {
          resolvedSelection = userPortfolios.length ? String(userPortfolios[0].id) : ALL_PORTFOLIOS;
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const profileMenuItems = [
    { href: '/profile/settings', label: 'Profile settings' },
    { href: '/tax/settings', label: 'Tax settings' },
    { href: '/portfolios', label: 'Portfolios' },
    { href: '/portfolios/new', label: 'Add Portfolio' },
    { href: '/accounts/logout', label: 'Log out' },
  ];

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
        <div className="d-flex align-items-center gap-2">
          <span>
            {userLoading
              ? 'Checking login...'
              : user
                ? `Logged in as: `
                : 'Not logged in'}
          </span>
          <div className="dropdown" ref={menuRef}>
            <button
              type="button"
              className="btn btn-outline-light btn-sm dropdown-toggle"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
            >
              {user?.username || 'Profile menu'}
            </button>
            {profileMenuOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show"
                style={{ minWidth: '220px' }}
              >
                {profileMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    className="dropdown-item"
                    href={item.href}
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}