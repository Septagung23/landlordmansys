import type { PropsWithChildren } from 'react';

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-bg">
      <div className="phone-shell">
        <header className="top-bar">
          <div className="brand-block">
            <a href="/">
              <strong>Mitratel</strong>
            </a>
          </div>
          <button className="menu-btn" aria-label="menu">
            ☰
          </button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
