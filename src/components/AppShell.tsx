import type { PropsWithChildren } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../auth';
import logo from '../assets/logo.png';

export default function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <header className="top-bar">
          <div className="brand-block">
            <a href="/">
              <div className='logo'>
                <img src={logo} width={20} />
                <strong>LLMS</strong>
              </div>
            </a>
          </div>
          <div className="top-actions">
            {user ? <span className="user-chip">{user.name}</span> : null}
            {user ? (
              <button className="menu-btn logout-btn" type="button" onClick={logout}>
                Logout
              </button>
            ) : (
              <button className="menu-btn" type="button" aria-label="Menu">
                <Menu />
              </button>
            )}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
