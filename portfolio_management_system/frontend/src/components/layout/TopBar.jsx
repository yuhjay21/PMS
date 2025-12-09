'use client';

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-title">Portfolio Dashboard</div>
      <div className="topbar-right">{new Date().toLocaleString()}</div>
    </header>
  );
}
