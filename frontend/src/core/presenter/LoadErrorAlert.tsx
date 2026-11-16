import { Alert } from './Alert';
import { Button } from './Button';

type LoadErrorAlertProps = {
  message: string;
  onRetry: () => void;
};

/** What a screen shows when its data could not be loaded, with a "Reintentar" button. */
export function LoadErrorAlert({ message, onRetry }: LoadErrorAlertProps) {
  return (
    <div className="space-y-3">
      <div role="alert">
        <Alert>{message}</Alert>
      </div>
      <Button onClick={onRetry}>Reintentar</Button>
    </div>
  );
}
