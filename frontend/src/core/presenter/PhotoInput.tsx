import { useState, type ChangeEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';

type PhotoInputProps = {
  onChange: (file: File | null) => void;
};

export function PhotoInput({ onChange }: PhotoInputProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function selectPhoto(file: File | null) {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(file ? URL.createObjectURL(file) : null);
    onChange(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    selectPhoto(event.target.files?.[0] ?? null);
  }

  if (preview) {
    return (
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-neutral-300">
        <img src={preview} alt="Vista previa de la foto" className="h-full w-full object-cover" />
        <button
          type="button"
          aria-label="Quitar foto"
          onClick={() => selectPhoto(null)}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/70 text-neutral-0"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-0 text-sm text-neutral-500 hover:border-blue-300">
      <ImagePlus className="h-7 w-7 text-blue-300" aria-hidden="true" />
      Foto del objeto
      <input type="file" accept="image/*" onChange={handleChange} className="sr-only" />
    </label>
  );
}
