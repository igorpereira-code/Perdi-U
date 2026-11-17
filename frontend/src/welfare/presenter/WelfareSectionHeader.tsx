export function WelfareSectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-2xl font-bold text-blue-700">{title}</h2>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </header>
  );
}
