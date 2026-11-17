import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MatchView } from '@shared/matching';
import { MatchesPage } from './MatchesPage';

function match(code: string, description: string, photoUrl: string | null = null): MatchView {
  return {
    id: code,
    status: 'SUGGESTED',
    similarity: 50,
    foundItem: { code, description, photoUrl, category: 'Electrónicos' },
  };
}

function renderPage(
  matches: MatchView[],
  reportCode = 'PR-0001',
  onPickUp = jest.fn(),
  onDismiss = jest.fn(),
) {
  render(
    <MatchesPage
      reportCode={reportCode}
      matches={matches}
      onPickUp={onPickUp}
      onDismiss={onDismiss}
    />,
  );
}

describe('Objetos parecidos a mi reporte', () => {
  it('muestra los objetos parecidos en el orden en que llegan, del más parecido al menos parecido', () => {
    renderPage([
      match('HZ-0001', 'Celular Samsung con funda azul'),
      match('HZ-0002', 'Celular negro'),
    ]);

    expect(
      screen.getByRole('heading', { name: 'Objetos parecidos a tu reporte PR-0001' }),
    ).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Celular Samsung con funda azul');
    expect(items[1]).toHaveTextContent('Celular negro');
  });

  it('avisa que su reporte seguirá activo cuando no hay objetos parecidos', () => {
    renderPage([], 'PR-0003');

    expect(
      screen.getByRole('heading', { name: 'Todavía no hay objetos parecidos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tu reporte PR-0003 seguirá activo. Vuelve a revisarlo más adelante.'),
    ).toBeInTheDocument();
  });

  it('muestra la foto, la descripción y el código de cada objeto parecido', () => {
    renderPage([
      match('HZ-0001', 'Celular Samsung con funda azul', 'https://foto.com/celular.jpg'),
      match('HZ-0002', 'Celular negro'),
    ]);

    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first).getByRole('img', { name: 'Foto del objeto' })).toHaveAttribute(
      'src',
      'https://foto.com/celular.jpg',
    );
    expect(first).toHaveTextContent('HZ-0001');
    expect(within(second).getByRole('img', { name: 'Electrónicos' })).toBeInTheDocument();
    expect(second).toHaveTextContent('HZ-0002');
  });

  it('permite elegir "Pasaré a recoger" en un objeto y luego lo muestra elegido', async () => {
    const onPickUp = jest.fn();
    const chosen = { ...match('HZ-0002', 'Celular negro'), status: 'WILL_PICK_UP' as const };
    renderPage([match('HZ-0001', 'Celular Samsung con funda azul'), chosen], 'PR-0001', onPickUp);

    const [first, second] = screen.getAllByRole('listitem');
    await userEvent.click(within(first).getByRole('button', { name: 'Pasaré a recoger' }));

    expect(onPickUp).toHaveBeenCalledWith('HZ-0001');
    expect(second).toHaveTextContent('Pasarás a recoger este objeto');
    expect(
      within(second).queryByRole('button', { name: 'Pasaré a recoger' }),
    ).not.toBeInTheDocument();
  });

  it('después de elegir "Pasaré a recoger", muestra dónde y cuándo ir, y que lleve el código de su reporte', () => {
    renderPage(
      [{ ...match('HZ-0001', 'Celular Samsung con funda azul'), status: 'WILL_PICK_UP' }],
      'PR-0001',
    );

    const [item] = screen.getAllByRole('listitem');
    expect(item).toHaveTextContent('Bienestar Estudiantil – Bloque C');
    expect(item).toHaveTextContent('Lunes a viernes, de 08:30 a 16:00');
    expect(item).toHaveTextContent('Lleva el código de tu reporte PR-0001 para recogerlo.');
  });

  it('permite elegir "No es mío" en un objeto', async () => {
    const onDismiss = jest.fn();
    renderPage(
      [match('HZ-0001', 'Celular Samsung con funda azul')],
      'PR-0001',
      jest.fn(),
      onDismiss,
    );

    await userEvent.click(screen.getByRole('button', { name: 'No es mío' }));

    expect(onDismiss).toHaveBeenCalledWith('HZ-0001');
  });
});

describe('Coincidencia con un objeto que no es visible', () => {
  const hiddenMatch: MatchView = {
    ...match('HZ-0004', 'Celular Samsung con funda azul y vidrio roto'),
    isHidden: true,
  };

  it('le avisa que hay una coincidencia y que se acerque a Bienestar', () => {
    renderPage([hiddenMatch]);

    expect(screen.getByText('Hay una coincidencia, acércate a Bienestar')).toBeInTheDocument();
  });

  it('no muestra ese aviso en una coincidencia visible', () => {
    renderPage([match('HZ-0001', 'Celular Samsung con funda azul')]);

    expect(
      screen.queryByText('Hay una coincidencia, acércate a Bienestar'),
    ).not.toBeInTheDocument();
  });
});

describe('Código del reporte en una coincidencia con un objeto que no es visible', () => {
  it('muestra el código de su reporte junto al mensaje', () => {
    const hiddenMatch: MatchView = {
      ...match('HZ-0004', 'Celular Samsung con funda azul y vidrio roto'),
      isHidden: true,
    };

    renderPage([hiddenMatch], 'PR-0003');

    expect(screen.getByText('Hay una coincidencia, acércate a Bienestar')).toBeInTheDocument();
    expect(screen.getByText('Código de tu reporte: PR-0003')).toBeInTheDocument();
  });
});
describe('Una coincidencia con un objeto que no es visible no muestra sus datos', () => {
  it('no muestra la foto, la descripción, el código del objeto ni las respuestas', () => {
    const hiddenMatch: MatchView = {
      ...match(
        'HZ-0004',
        'Celular Samsung con funda azul y vidrio roto',
        'https://foto.com/celular.jpg',
      ),
      isHidden: true,
    };

    renderPage([hiddenMatch], 'PR-0003');

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/vidrio roto/)).not.toBeInTheDocument();
    expect(screen.queryByText('HZ-0004')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});