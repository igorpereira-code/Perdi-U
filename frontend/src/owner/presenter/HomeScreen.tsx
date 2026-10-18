import { Button } from '../../core/presenter/Button';

type HomeScreenProps = {
  onNavigateToLost?: () => void;
  onNavigateToFound?: () => void;
};

export function HomeScreen({ onNavigateToLost, onNavigateToFound }: HomeScreenProps) {
  return (
    <main className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onNavigateToFound}>
          Encontré un objeto
        </Button>
        <Button variant="primary" onClick={onNavigateToLost}>
          Perdí un objeto
        </Button>
      </div>
    </main>
  );
}