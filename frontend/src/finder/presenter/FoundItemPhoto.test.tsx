import { fireEvent, render, screen } from '@testing-library/react';
import { FoundItemPhoto } from './FoundItemPhoto';

const report = { code: 'HZ-7325', category: 'Llaves', hasPhoto: true };

describe('Fotografía autorizada de un reporte propio', () => {
  it('mantiene la categoría cuando no existe fotografía y no solicita una URL', () => {
    const service = { getPhotoUrl: jest.fn() };
    render(<FoundItemPhoto report={{ ...report, hasPhoto: false }} foundItemsService={service} />);

    expect(screen.getByRole('img', { name: 'Llaves' })).toBeInTheDocument();
    expect(service.getPhotoUrl).not.toHaveBeenCalled();
  });

  it('mantiene la categoría cuando falla el acceso autorizado a la foto', async () => {
    const service = { getPhotoUrl: jest.fn().mockRejectedValue(new Error('Sin permiso')) };
    render(<FoundItemPhoto report={report} foundItemsService={service} />);

    expect(await screen.findByRole('img', { name: 'Llaves' })).toBeInTheDocument();
    expect(service.getPhotoUrl).toHaveBeenCalledWith(report.code);
    expect(screen.queryByRole('img', { name: 'Foto del objeto' })).not.toBeInTheDocument();
  });

  it('vuelve a la categoría si la URL autorizada no puede cargar la imagen', async () => {
    const service = { getPhotoUrl: jest.fn().mockResolvedValue({ url: 'https://storage.example/foto-firmada', expiresIn: 60 }) };
    render(<FoundItemPhoto report={report} foundItemsService={service} />);

    fireEvent.error(await screen.findByRole('img', { name: 'Foto del objeto' }));

    expect(screen.getByRole('img', { name: 'Llaves' })).toBeInTheDocument();
  });
});
