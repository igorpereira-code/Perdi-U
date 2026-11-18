import { useEffect, useRef, useState } from 'react';
import { Button } from '../../core/presenter/Button';
import { formatDay } from '../logic/formatDay';

type LostReportReviewProps = {
  description: string;
  category: string;
  places: string[];
  placeDescription: string | null;
  dateFrom: string;
  dateTo: string;
  photo: File | null;
  isSubmitting: boolean;
  onEdit: () => void;
  onConfirm: () => void;
};

/** Summary of the lost report that the owner checks before sending it. */
export function LostReportReview({
  description,
  category,
  places,
  placeDescription,
  dateFrom,
  dateTo,
  photo,
  isSubmitting,
  onEdit,
  onConfirm,
}: LostReportReviewProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(photo);
    setPhotoUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  return (
    <section aria-labelledby="lost-report-review-title" className="mx-auto max-w-lg space-y-4">
      <h1
        ref={heading}
        tabIndex={-1}
        id="lost-report-review-title"
        className="text-lg font-semibold text-blue-700"
      >
        Resumen del reporte
      </h1>
      <p className="text-sm text-neutral-600">Revisa que los datos estén bien antes de enviarlo.</p>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="Foto de referencia"
          className="max-h-72 w-full rounded-xl bg-neutral-100 object-contain"
        />
      ) : (
        <p className="text-sm text-neutral-500">Sin fotografía</p>
      )}
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold">Descripción</dt>
          <dd className="whitespace-pre-wrap break-words">{description}</dd>
        </div>
        <div>
          <dt className="font-semibold">Categoría</dt>
          <dd>{category}</dd>
        </div>
        <div>
          <dt className="font-semibold">Dónde pudo perderlo</dt>
          <dd>
            {places.length > 0 ? (
              <ul className="list-inside list-disc">
                {places.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
            ) : (
              'No sé dónde lo perdí'
            )}
          </dd>
        </div>
        {placeDescription && (
          <div>
            <dt className="font-semibold">Por dónde pudo perderlo</dt>
            <dd className="break-words">{placeDescription}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold">Fechas</dt>
          <dd>{`Del ${formatDay(dateFrom)} al ${formatDay(dateTo)}`}</dd>
        </div>
      </dl>
      <Button variant="outline" className="w-full" disabled={isSubmitting} onClick={onEdit}>
        Volver a editar
      </Button>
      <Button
        className="w-full"
        isLoading={isSubmitting}
        loadingText="Enviando reporte…"
        onClick={onConfirm}
      >
        Confirmar y enviar
      </Button>
    </section>
  );
}
