import { readWelfareOffice } from './readWelfareOffice';

describe('Leer la ubicación y el horario de Bienestar', () => {
  it('lee la ubicación y el horario sin espacios de más', () => {
    expect(
      readWelfareOffice({ place: '  Bloque   C, planta baja ', hours: ' 08:00 a 16:00 ' }),
    ).toEqual({ welfareOffice: { place: 'Bloque C, planta baja', hours: '08:00 a 16:00' } });
  });

  it('pide escribir la ubicación si está vacía', () => {
    expect(readWelfareOffice({ place: '  ', hours: '08:00 a 16:00' })).toEqual({
      error: 'Escribe la ubicación.',
    });
  });

  it('pide escribir el horario si está vacío', () => {
    expect(readWelfareOffice({ place: 'Bloque C' })).toEqual({ error: 'Escribe el horario.' });
  });

  it('avisa si la ubicación es demasiado larga', () => {
    expect(readWelfareOffice({ place: 'a'.repeat(121), hours: '08:00 a 16:00' })).toEqual({
      error: 'La ubicación puede tener hasta 120 caracteres.',
    });
  });

  it('avisa si el horario es demasiado largo', () => {
    expect(readWelfareOffice({ place: 'Bloque C', hours: 'a'.repeat(121) })).toEqual({
      error: 'El horario puede tener hasta 120 caracteres.',
    });
  });
});
