import { useEffect, useRef, useState } from 'react';
import { Button } from '../../core/presenter/Button';
import { formatReportDate } from '../logic/formatReportDate';

type FoundItemReviewProps = {
  description: string;
  category: string;
  location: string;
  foundAt: string;
  foundTime: string;
  photo: File | null;
  isSubmitting: boolean;
  onConfirm: () => void;
};

export function FoundItemReview({
  description,
  category,
  location,
  foundAt,
  foundTime,
  photo,
  isSubmitting,
  onConfirm,
}: FoundItemReviewProps) {
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
    <section aria-labelledby="found-item-review-title" className="mx-auto max-w-lg space-y-4">
      <h1 ref={heading} tabIndex={-1} id="found-item-review-title" className="text-lg font-semibold text-blue-700">
        Resumen del reporte
      </h1>
      {photoUrl && (
        <img
          src={photoUrl}
          alt="Foto del objeto encontrado"
          className="max-h-72 w-full rounded-xl bg-neutral-100 object-contain"
        />
      )}
      {!photo && <p className="text-sm text-neutral-500">Sin fotografía</p>}
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
          <dt className="font-semibold">Lugar</dt>
          <dd className="break-words">{location}</dd>
        </div>
        <div>
          <dt className="font-semibold">Fecha del hallazgo</dt>
          <dd>{formatReportDate(foundAt)}{foundTime && (' · ' + foundTime)}</dd>
        </div>
      </dl>
      <Button className="w-full" disabled={isSubmitting} onClick={onConfirm}>
        {isSubmitting ? 'Enviando…' : 'Confirmar y enviar'}
      </Button>
    </section>
  );
}
