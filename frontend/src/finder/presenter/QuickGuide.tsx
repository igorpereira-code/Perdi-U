type QuickGuideProps = {
  onSkip: () => void;
};

export function QuickGuide({ onSkip }: QuickGuideProps) {
  return (
    <section>
      <h1>Bienvenido a Perdi-U</h1>

      <h2>¿Encontraste un objeto?</h2>

      <p>
        Registra el objeto encontrado en la universidad
        para ayudar a localizar a su propietario.
      </p>

      <p>
        Debes entregar el objeto a Bienestar Universitario.
        No debes entregarlo directamente a su dueño.
      </p>

      <button type="button" onClick={onSkip}>
        Saltar guía
      </button>
    </section>
  );
}