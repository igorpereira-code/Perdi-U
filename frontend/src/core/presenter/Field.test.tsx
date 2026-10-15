import { render, screen } from '@testing-library/react';
import { Field } from './Field';

describe('Campo de formulario', () => {
  it('muestra la etiqueta conectada a su campo', () => {
    render(
      <Field id="description" label="Descripción">
        <input id="description" />
      </Field>,
    );

    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('indica cuando el campo es opcional', () => {
    render(
      <Field id="photo" label="Foto del objeto" optional>
        <input id="photo" />
      </Field>,
    );

    expect(screen.getByText('(opcional)')).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando hay uno', () => {
    render(
      <Field id="description" label="Descripción" error="Describe el objeto.">
        <input id="description" />
      </Field>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Describe el objeto.');
  });

  it('no muestra ningún error cuando no lo hay', () => {
    render(
      <Field id="description" label="Descripción">
        <input id="description" />
      </Field>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
