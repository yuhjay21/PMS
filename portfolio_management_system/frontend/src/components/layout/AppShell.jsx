'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopBar from './TopBar';

export default function AppShell({ children }) {
  const pathname = usePathname();

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
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    // more: { href: '/dividends', label: 'Dividends' }, etc.
  ];

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="layout-root">
      <aside className="sidebar">
        <div className="sidebar-header">
          PMS<span style={{ opacity: 0.6 }}> / Web</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <TopBar/>
        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
}
