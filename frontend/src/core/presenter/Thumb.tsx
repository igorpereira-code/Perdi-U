import { getCategoryIcon } from './CategoryIcon';

type ThumbProps = {
  category: string;
  photoUrl?: string | null;
};

const BOX = 'h-16 w-16 shrink-0 rounded-xl';

export function Thumb({ category, photoUrl }: ThumbProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt="Foto del objeto" className={`${BOX} object-cover`} />;
  }

  const Icon = getCategoryIcon(category);
  return (
    <div
      role="img"
      aria-label={category}
      className={`${BOX} flex items-center justify-center bg-blue-50 text-blue-300`}
    >
      <Icon className="h-7 w-7" aria-hidden="true" />
    </div>
  );
}
