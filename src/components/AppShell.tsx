import type { PropsWithChildren } from 'react';
import logo from '../assets/logo.png';
import {Menu} from 'lucide-react'

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-bg">
      <div className="phone-shell">
        <header className="top-bar">
          <div className="brand-block">
            <a href="/">
              <div className='logo'>
                <img src={logo} width={20}/>
                <strong>LLMS</strong>
              </div>
            </a>
          </div>
          <a>
            <Menu />
          </a>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
