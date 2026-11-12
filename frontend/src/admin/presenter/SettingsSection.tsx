import { useCallback, useState, type FormEvent } from 'react';
import type { WelfareOffice } from '@shared/settings';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { SettingsService } from '../../core/data/settingsService';

type SettingsSectionProps = {
  settingsService: SettingsService;
};

type WelfareOfficeFormProps = {
  savedWelfareOffice: WelfareOffice;
  onSave: (welfareOffice: WelfareOffice) => Promise<void>;
};

/** The place and opening hours of Bienestar that users see in the app. */
function WelfareOfficeForm({ savedWelfareOffice, onSave }: WelfareOfficeFormProps) {
  const [welfareOffice, setWelfareOffice] = useState(savedWelfareOffice);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  function changeField(field: keyof WelfareOffice, value: string) {
    setWelfareOffice((current) => ({ ...current, [field]: value }));
    setHasSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave(welfareOffice);
      setHasSaved(true);
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
    >
      <h2 className="text-sm font-semibold text-neutral-900">Bienestar Estudiantil</h2>
      <Field id="welfare-place" label="Ubicación">
        <input
          id="welfare-place"
          value={welfareOffice.place}
          onChange={(event) => changeField('place', event.target.value)}
          className={INPUT_CLASSES}
        />
      </Field>
      <Field id="welfare-hours" label="Horario de atención">
        <input
          id="welfare-hours"
          value={welfareOffice.hours}
          onChange={(event) => changeField('hours', event.target.value)}
          className={INPUT_CLASSES}
        />
      </Field>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          {error}
        </p>
      )}
      {hasSaved && (
        <p role="status" className="rounded-xl bg-success-50 p-2 text-sm text-success-700">
          Guardado. Los usuarios ya ven la nueva ubicación y horario.
        </p>
      )}
      <Button type="submit" isLoading={isSaving} loadingText="Guardando…" className="w-full">
        Guardar
      </Button>
    </form>
  );
}

/** Settings of the app that only the Administrator can change. */
export function SettingsSection({ settingsService }: SettingsSectionProps) {
  const loadWelfareOffice = useCallback(
    () => settingsService.getWelfareOffice(),
    [settingsService],
  );
  const { data: welfareOffice, hasFailed, retry } = useLoadedData(loadWelfareOffice);

  async function saveWelfareOffice(newWelfareOffice: WelfareOffice) {
    await settingsService.updateWelfareOffice(newWelfareOffice);
  }

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudo cargar la ubicación de Bienestar. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (welfareOffice === undefined) {
    return <SkeletonList rows={2} label="Cargando ajustes…" />;
  }
  return <WelfareOfficeForm savedWelfareOffice={welfareOffice} onSave={saveWelfareOffice} />;
}
