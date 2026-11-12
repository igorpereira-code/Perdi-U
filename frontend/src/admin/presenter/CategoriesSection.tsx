import { useCallback } from 'react';
import { Tags } from 'lucide-react';
import type { ManagedCategory } from '@shared/admin';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminCatalogService } from '../data/adminCatalogService';
import { ActiveChip } from './ActiveChip';

type CategoriesSectionProps = {
  adminCatalogService: AdminCatalogService;
};

function CategoryCard({ category }: { category: ManagedCategory }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
        {category.name}
      </p>
      <ActiveChip active={category.active} />
    </li>
  );
}

/** The categories that people choose when they report an item. */
export function CategoriesSection({ adminCatalogService }: CategoriesSectionProps) {
  const loadCategories = useCallback(
    async () => (await adminCatalogService.listCatalogs()).categories,
    [adminCatalogService],
  );
  const { data: categories, hasFailed, retry } = useLoadedData(loadCategories);

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar las categorías. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (categories === undefined) {
    return <SkeletonList rows={4} label="Cargando categorías…" />;
  }
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="Todavía no hay categorías"
        text="Aparecerán aquí cuando las crees."
      />
    );
  }
  return (
    <ul aria-label="Categorías" className="space-y-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </ul>
  );
}
