import { useCallback } from 'react';
import { Tags } from 'lucide-react';
import type { CatalogChanges, ManagedCategory } from '@shared/admin';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminCatalogService } from '../data/adminCatalogService';
import { saveInListByName } from '../logic/saveInListByName';
import { EditableItem } from './EditableItem';
import { NameForm } from './NameForm';

type CategoriesSectionProps = {
  adminCatalogService: AdminCatalogService;
};

type UpdateCategory = (categoryId: number, changes: CatalogChanges) => Promise<void>;

/** The categories that people choose when they report an item. */
export function CategoriesSection({ adminCatalogService }: CategoriesSectionProps) {
  const loadCategories = useCallback(
    async () => (await adminCatalogService.listCatalogs()).categories,
    [adminCatalogService],
  );
  const {
    data: categories,
    setData: setCategories,
    hasFailed,
    retry,
  } = useLoadedData(loadCategories);

  function showSavedCategory(savedCategory: ManagedCategory) {
    setCategories((current) => current && saveInListByName(current, savedCategory));
  }

  async function createCategory(name: string) {
    showSavedCategory(await adminCatalogService.createCategory(name));
  }

  const updateCategory: UpdateCategory = async (categoryId, changes) => {
    showSavedCategory(await adminCatalogService.updateCategory(categoryId, changes));
  };

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
  return (
    <div className="space-y-4">
      <NameForm
        label="Nueva categoría"
        submitText="Agregar"
        loadingText="Agregando…"
        clearAfterSubmit
        onSubmit={createCategory}
      />
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Todavía no hay categorías"
          text="Agrega la primera con el formulario de arriba."
        />
      ) : (
        <ul aria-label="Categorías" className="space-y-3">
          {categories.map((category) => (
            <EditableItem
              key={category.id}
              name={category.name}
              active={category.active}
              onUpdate={(changes) => updateCategory(category.id, changes)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
