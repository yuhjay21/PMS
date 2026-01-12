'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import TopBar from './TopBar';
import { Toaster } from 'react-hot-toast';


export default function AppShell({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  //Accounts Auth pages
  const authRoots = ['/accounts/', ];

  const isAuthPage =
    pathname === '/' ||
    authRoots.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/reset-password');

  // For home & auth pages, render without sidebar/topbar
  if (isAuthPage) {
    return <div className="main-page-wrapper">{children}</div>;
  }

  const navItems = [
    //{ href: '/', label: 'Home', description: 'Welcome hub' },
    { href: '/dashboard', label: 'Dashboard', description: 'Insights & KPIs' },
    { href: '/tax', label: "Tax", descriptors: 'Tax Overview'},
    // more: { href: '/dividends', label: 'Dividends' }, etc.
  ];

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="layout-root">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-glow" aria-hidden="true" />
          {!collapsed && 
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={!collapsed}
          >
            ☰
          </button>
          }
          <div className="sidebar-header">
            {collapsed ? <button type="button" onClick={toggleSidebar}>
                          <div className="sidebar-badge">☰</div>
                        </button> 
                        :
                        <div className="sidebar-badge">PMS</div>
            }
            
            {!collapsed && (
              <div>
                <div className="sidebar-title">Portfolio Web</div>
                <div className="sidebar-subtitle">Control center</div>
              </div>
            )}
          </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
                <div className={`nav-label ${collapsed ? 'collapsed' : ''}`}>{item.label}</div>
                {!collapsed && <div className="nav-desc">{item.description}</div>}
                {!collapsed && <span className="active-indicator" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

          {!collapsed && (
        <div className="sidebar-footer">
            <div>
                <div className="footer-title">Need help?</div>
                {!collapsed && <p className="footer-text">View docs or contact support anytime.</p>}
                <a className="footer-link" href="/accounts/forgot-password">
                  Account recovery
                </a>
              </div>
          
          
        </div>
            )}
        <a className="footer-link" href="/accounts/logout">
            Logout
          </a>
      </aside>

      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <TopBar />
        <Toaster />
        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
}