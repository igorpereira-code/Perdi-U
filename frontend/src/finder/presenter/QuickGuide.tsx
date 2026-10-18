
import { Button } from '../../core/presenter/Button';
import { Alert } from '../../core/presenter/Alert';
import { WelfareCard } from '../../core/presenter/WelfareCard';

type QuickGuideProps = {
  onSkip: () => void;
};

const steps = [
  {
    title: 'Encuentra el objeto',
    description: 'Si encuentras un objeto perdido dentro de la universidad, puedes ayudar a recuperarlo.',
  },
  {
    title: 'Reporta el hallazgo',
    description: 'Registra la información del objeto encontrado en Perdi-U.',
  },
  {
    title: 'Lleva el objeto a Bienestar Estudiantil',
    description: 'Entrega el objeto en la oficina de Bienestar para que quede bajo su cuidado.',
  },
  {
    title: 'El dueño lo recoge en Bienestar',
    description: 'Su propietario podrá recuperar el objeto en Bienestar Estudiantil.',
  },
];

export function QuickGuide({ onSkip }: QuickGuideProps) {
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-blue-700">
          Bienvenido a Perdi-U
        </h1>
        <p className="text-sm text-neutral-700">
          Conoce cómo funciona nuestra comunidad de objetos perdidos.
        </p>
      </header>

      <section aria-labelledby="guide-title" className="space-y-4">
        <h2 id="guide-title" className="text-lg font-semibold text-blue-700">
          ¿Cómo funciona?
        </h2>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700"
              >
                {index + 1}
              </span>

              <div className="space-y-1">
                <h3 className="font-semibold text-blue-700">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-700">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Alert>
        Debes entregar el objeto a Bienestar Universitario.
        No debes entregarlo directamente a su dueño.
      </Alert>

      <section aria-label="Ubicación y horario de Bienestar">
        <WelfareCard />
      </section>

      <Button
        variant="outline"
        onClick={onSkip}
        className="w-full"
      >
        Saltar guía
      </Button>
    </main>
  );
}
