import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import type { MatchSettings, WelfareOffice } from '@shared/settings';
import type { SettingsService } from '../../core/data/settingsService';
import { Button } from '../../core/presenter/Button';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';

type SettingsSectionProps = {
  settingsService: SettingsService;
};

type SettingsCardProps = {
  title: string;
  successMessage: string;
  /** Saves what the Administrator wrote. If it throws, its message is shown. */
  onSave: () => Promise<void>;
  children: ReactNode;
};

/** A box of settings with its "Guardar" button, its error and its "Guardado" message. */
function SettingsCard({ title, successMessage, onSave, children }: SettingsCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave();
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
      onChange={() => setHasSaved(false)}
      className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
    >
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {children}
      {error && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          {error}
        </p>
      )}
      {hasSaved && (
        <p role="status" className="rounded-xl bg-success-50 p-2 text-sm text-success-700">
          {successMessage}
        </p>
      )}
      <Button type="submit" isLoading={isSaving} loadingText="Guardando…" className="w-full">
        Guardar
      </Button>
    </form>
  );
}

type WelfareOfficeFormProps = {
  savedWelfareOffice: WelfareOffice;
  onSave: (welfareOffice: WelfareOffice) => Promise<void>;
};

/** The place and opening hours of Bienestar that users see in the app. */
function WelfareOfficeForm({ savedWelfareOffice, onSave }: WelfareOfficeFormProps) {
  const [welfareOffice, setWelfareOffice] = useState(savedWelfareOffice);

  function changeField(field: keyof WelfareOffice, value: string) {
    setWelfareOffice((current) => ({ ...current, [field]: value }));
  }

  return (
    <SettingsCard
      title="Bienestar Estudiantil"
      successMessage="Guardado. Los usuarios verán la nueva ubicación y horario al volver a Perdi-U."
      onSave={() => onSave(welfareOffice)}
    >
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
    </SettingsCard>
  );
}

type MatchSettingsFormProps = {
  savedMatchSettings: MatchSettings;
  onSave: (matchSettings: MatchSettings) => Promise<void>;
};

/** How similar a found item must be to a lost one to be shown as a match. */
function MatchSettingsForm({ savedMatchSettings, onSave }: MatchSettingsFormProps) {
  const [minSimilarity, setMinSimilarity] = useState(String(savedMatchSettings.minSimilarity));

  return (
    <SettingsCard
      title="Coincidencias"
      successMessage="Guardado. Las nuevas coincidencias usarán este nivel."
      onSave={() => onSave({ minSimilarity: Number(minSimilarity) })}
    >
      <Field id="min-similarity" label="Nivel mínimo de similitud (de 0 a 100)">
        <input
          id="min-similarity"
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          value={minSimilarity}
          onChange={(event) => setMinSimilarity(event.target.value)}
          className={INPUT_CLASSES}
        />
      </Field>
      <p className="text-xs text-neutral-500">
        Un objeto encontrado se muestra como coincidencia solo si se parece al perdido al menos este
        nivel. Más alto: menos coincidencias, pero más acertadas.
      </p>
    </SettingsCard>
  );
}

function WelfareOfficeSettings({ settingsService }: SettingsSectionProps) {
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
    return <SkeletonList rows={2} label="Cargando la ubicación de Bienestar…" />;
  }
  return <WelfareOfficeForm savedWelfareOffice={welfareOffice} onSave={saveWelfareOffice} />;
}

function MinSimilaritySettings({ settingsService }: SettingsSectionProps) {
  const loadMatchSettings = useCallback(
    () => settingsService.getMatchSettings(),
    [settingsService],
  );
  const { data: matchSettings, hasFailed, retry } = useLoadedData(loadMatchSettings);

  async function saveMatchSettings(newMatchSettings: MatchSettings) {
    await settingsService.updateMatchSettings(newMatchSettings);
  }

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudo cargar el nivel mínimo. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (matchSettings === undefined) {
    return <SkeletonList rows={1} label="Cargando el nivel mínimo…" />;
  }
  return <MatchSettingsForm savedMatchSettings={matchSettings} onSave={saveMatchSettings} />;
}

/** Settings of the app that only the Administrator can change. */
export function SettingsSection({ settingsService }: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <WelfareOfficeSettings settingsService={settingsService} />
      <MinSimilaritySettings settingsService={settingsService} />
    </div>
  );
}
