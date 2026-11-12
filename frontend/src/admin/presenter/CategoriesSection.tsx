import { useCallback, useState } from 'react';
import { Tags } from 'lucide-react';
import type { CatalogChanges, ManagedCategory } from '@shared/admin';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminCatalogService } from '../data/adminCatalogService';
import { getActivationAction } from '../logic/getActivationAction';
import { saveInListByName } from '../logic/saveInListByName';
import { ActiveChip } from './ActiveChip';
import { NameForm } from './NameForm';

type CategoriesSectionProps = {
  adminCatalogService: AdminCatalogService;
};

type UpdateCategory = (categoryId: number, changes: CatalogChanges) => Promise<void>;

type CategoryCardProps = {
  category: ManagedCategory;
  onUpdate: UpdateCategory;
};

function CategoryCard({ category, onUpdate }: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingActive, setIsChangingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activationAction = getActivationAction(category.active);

  async function rename(name: string) {
    await onUpdate(category.id, { name });
    setIsEditing(false);
  }

  async function changeActive() {
    setIsChangingActive(true);
    setError(null);
    try {
      await onUpdate(category.id, { active: activationAction.newActive });
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setIsChangingActive(false);
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-2xl border border-blue-200 bg-neutral-0 p-4">
        <NameForm
          label={`Nuevo nombre de ${category.name}`}
          initialName={category.name}
          submitText="Guardar"
          loadingText="Guardando…"
          onSubmit={rename}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-900">
          {category.name}
        </p>
        <ActiveChip active={category.active} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isChangingActive}>
          Editar
        </Button>
        <Button
          variant="outline"
          onClick={changeActive}
          isLoading={isChangingActive}
          loadingText={activationAction.loadingText}
        >
          {activationAction.label}
        </Button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          {error}
        </p>
      )}
    </li>
  );
}

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
            <CategoryCard key={category.id} category={category} onUpdate={updateCategory} />
          ))}
        </ul>
      )}
    </div>
  );
}
