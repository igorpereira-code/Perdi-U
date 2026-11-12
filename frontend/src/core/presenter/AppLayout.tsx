import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { HandHeart, House, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import type { Role } from '@shared/user';
import { canManageUsers } from '../../admin/logic/canManageUsers';
import { Logo } from './Logo';
import { canUseWelfareOptions } from '../logic/canUseWelfareOptions';

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

type AppLayoutProps = {
  children: ReactNode;
  role: Role;
  /** Shown at the right of the header, e.g. the notifications option. */
  headerAction?: ReactNode;
};

export function AppLayout({ children, role, headerAction }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="flex items-center justify-between bg-blue-700 px-4 py-3 text-neutral-0">
        <Logo />
        {headerAction}
      </header>
      <main className="p-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-neutral-200 bg-neutral-0">
        <NavItem to="/" icon={House} label="Inicio" />
        {canUseWelfareOptions(role) && (
          <NavItem to="/bienestar" icon={HandHeart} label="Bienestar" />
        )}
        {canManageUsers(role) && (
          <NavItem to="/administracion" icon={ShieldCheck} label="Administración" />
        )}
        <NavItem to="/perfil" icon={UserRound} label="Mi perfil" />
      </nav>
    </div>
  );
}
