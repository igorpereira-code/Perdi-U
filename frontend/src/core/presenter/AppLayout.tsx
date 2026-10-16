import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { House, UserRound, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';

function NavItem({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-blue-700' : 'text-neutral-500'}`
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-blue-700 px-4 py-3 text-neutral-0">
        <Logo />
      </header>
      <main className="p-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-neutral-200 bg-neutral-0">
        <NavItem to="/" icon={House} label="Inicio" />
        <NavItem to="/perfil" icon={UserRound} label="Mi perfil" />
      </nav>
    </div>
  );
}
