import { useState, type ReactNode } from 'react';
import type { CatalogChanges } from '@shared/admin';
import { Button } from '../../core/presenter/Button';
import { getActivationAction } from '../logic/getActivationAction';
import { ActiveChip } from './ActiveChip';
import { NameForm } from './NameForm';

type EditableItemProps = {
  name: string;
  active: boolean;
  /** Extra line under the name, for example "Bloque". */
  detail?: string;
  /** Saves the changes. If it throws, its message is shown. */
  onUpdate: (changes: CatalogChanges) => Promise<void>;
  /** Smaller and lighter, for an item inside another one (a classroom inside its block). */
  isCompact?: boolean;
  /** What goes under the buttons, for example the classrooms of a block. */
  children?: ReactNode;
};

const CARD_CLASSES = 'rounded-2xl border border-neutral-200 bg-neutral-0 p-4';
const COMPACT_CLASSES = 'rounded-xl bg-neutral-50 p-3';

/** A category, place or classroom with its buttons to rename it and to (de)activate it. */
export function EditableItem({
  name,
  active,
  detail,
  onUpdate,
  isCompact = false,
  children,
}: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingActive, setIsChangingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activationAction = getActivationAction(active);

  async function rename(newName: string) {
    await onUpdate({ name: newName });
    setIsEditing(false);
  }

  async function changeActive() {
    setIsChangingActive(true);
    setError(null);
    try {
      await onUpdate({ active: activationAction.newActive });
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
          label={`Nuevo nombre de ${name}`}
          initialName={name}
          submitText="Guardar"
          loadingText="Guardando…"
          onSubmit={rename}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className={`space-y-3 ${isCompact ? COMPACT_CLASSES : CARD_CLASSES}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
          {detail && <p className="text-xs text-neutral-500">{detail}</p>}
        </div>
        <ActiveChip active={active} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={isCompact ? 'ghost' : 'outline'}
          onClick={() => setIsEditing(true)}
          disabled={isChangingActive}
        >
          Editar
        </Button>
        <Button
          variant={isCompact ? 'ghost' : 'outline'}
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
      {children}
    </li>
  );
}
