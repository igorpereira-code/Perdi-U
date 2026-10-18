
import { Button } from '../../core/presenter/Button';

type FoundItemEntryProps = {
  onClick: () => void;
};

export function FoundItemEntry({ onClick }: FoundItemEntryProps) {
  return (
    <Button onClick={onClick}>
      Encontré un objeto
    </Button>
  );
}
