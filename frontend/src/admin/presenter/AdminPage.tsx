import { useState } from 'react';
import type { AdminCatalogService } from '../data/adminCatalogService';
import type { AdminUsersService } from '../data/adminUsersService';
import { CategoriesSection } from './CategoriesSection';
import { PlacesSection } from './PlacesSection';
import { UsersSection } from './UsersSection';

type AdminPageProps = {
  adminUsersService: AdminUsersService;
  adminCatalogService: AdminCatalogService;
};

const ADMIN_TABS = [
  { id: 'users', label: 'Usuarios' },
  { id: 'categories', label: 'Categorías' },
  { id: 'places', label: 'Lugares' },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]['id'];

type AdminTabsProps = {
  selectedTab: AdminTab;
  onSelect: (tab: AdminTab) => void;
};

function AdminTabs({ selectedTab, onSelect }: AdminTabsProps) {
  return (
    <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
      {ADMIN_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={selectedTab === tab.id}
          onClick={() => onSelect(tab.id)}
          className={`min-h-11 rounded-lg text-sm font-semibold ${
            selectedTab === tab.id ? 'bg-neutral-0 text-blue-700 shadow-sm' : 'text-neutral-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** The Administrator's page: users and their roles, categories and places of the campus. */
export function AdminPage({ adminUsersService, adminCatalogService }: AdminPageProps) {
  const [selectedTab, setSelectedTab] = useState<AdminTab>('users');

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-blue-700">Administración</h1>
        <p className="text-sm text-neutral-500">
          Gestiona al personal de Bienestar, las categorías y los lugares del campus.
        </p>
      </div>
      <AdminTabs selectedTab={selectedTab} onSelect={setSelectedTab} />
      {selectedTab === 'users' && <UsersSection adminUsersService={adminUsersService} />}
      {selectedTab === 'categories' && (
        <CategoriesSection adminCatalogService={adminCatalogService} />
      )}
      {selectedTab === 'places' && <PlacesSection adminCatalogService={adminCatalogService} />}
    </section>
  );
}
