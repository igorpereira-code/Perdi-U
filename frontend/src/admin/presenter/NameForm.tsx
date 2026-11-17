import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';

type NameFormProps = {
  label: string;
  initialName?: string;
  submitText: string;
  loadingText: string;
  /** Empties the box after saving, to add another one. */
  clearAfterSubmit?: boolean;
  /** On big screens, the box and the button go side by side. */
  isRow?: boolean;
  /** Saves the name. If it throws, its message is shown under the box. */
  onSubmit: (name: string) => Promise<void>;
  onCancel?: () => void;
};

/** A box to write the name of a category, place or classroom, with its save button. */
export function NameForm({
  label,
  initialName = '',
  submitText,
  loadingText,
  clearAfterSubmit = false,
  isRow = false,
  onSubmit,
  onCancel,
}: NameFormProps) {
  const inputId = useId();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);
    try {
      await onSubmit(name.trim());
      if (clearAfterSubmit) {
        setName('');
      }
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={isRow ? 'space-y-3 lg:flex lg:items-start lg:gap-3 lg:space-y-0' : 'space-y-3'}
    >
      <div className={isRow ? 'lg:flex-1' : ''}>
        <Field id={inputId} label={label} error={error}>
          <input
            id={inputId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASSES}
          />
        </Field>
      </div>
      <div className={onCancel ? 'grid grid-cols-2 gap-2' : isRow ? 'lg:pt-6' : ''}>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={name.trim() === ''}
          isLoading={isSaving}
          loadingText={loadingText}
          className={onCancel ? '' : 'w-full lg:w-auto'}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
}
