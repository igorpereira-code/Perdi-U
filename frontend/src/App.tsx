import { APP_NAME } from '@shared/constants';

export default function App() {
  return (
    <main className="min-h-screen bg-neutral-50 p-4">
      <h1 className="text-2xl font-bold text-blue-700">{APP_NAME}</h1>
      <p className="text-neutral-500">¿Lo perdi-U? ¡Lo encontr-U!</p>
    </main>
  );
}
