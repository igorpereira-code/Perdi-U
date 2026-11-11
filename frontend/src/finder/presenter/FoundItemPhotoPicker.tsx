import { useEffect, useState, type ChangeEvent } from 'react';
import { Button } from '../../core/presenter/Button';
import { PhotoInput } from '../../core/presenter/PhotoInput';

type FoundItemPhotoPickerProps = {
  photo: File | null;
  onChange: (photo: File | null) => void;
};

export function FoundItemPhotoPicker({ photo, onChange }: FoundItemPhotoPickerProps) {
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (cameraPreviewUrl) {
      return () => URL.revokeObjectURL(cameraPreviewUrl);
    }
  }, [cameraPreviewUrl]);

  function handleCameraCapture(event: ChangeEvent<HTMLInputElement>) {
    const capturedPhoto = event.currentTarget.files?.[0];
    if (!capturedPhoto) {
      return;
    }

    setCameraPreviewUrl(URL.createObjectURL(capturedPhoto));
    onChange(capturedPhoto);
  }

  function removeCameraPhoto() {
    setCameraPreviewUrl(null);
    onChange(null);
  }

  if (cameraPreviewUrl) {
    return (
      <div className="space-y-2">
        <img
          src={cameraPreviewUrl}
          alt="Vista previa de la foto"
          className="h-40 w-full rounded-xl border border-neutral-300 object-cover"
        />
        <Button variant="outline" onClick={removeCameraPhoto}>
          Quitar foto
        </Button>
      </div>
    );
  }

  return (
    <>
      <PhotoInput onChange={onChange} />
      {!photo && (
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-blue-700 focus-within:ring-2 focus-within:ring-blue-500">
          Tomar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="sr-only"
          />
        </label>
      )}
    </>
  );
}
