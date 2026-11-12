import { db } from './prisma';
import { prismaSettingsRepository } from './prismaSettingsRepository';

jest.mock('./prisma', () => ({ db: jest.fn() }));

const appSettings = { findUnique: jest.fn(), upsert: jest.fn() };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(db).mockReturnValue({ appSettings } as unknown as ReturnType<typeof db>);
});

describe('Ubicación y horario de Bienestar guardados en la base de datos', () => {
  it('lee la ubicación y el horario guardados', async () => {
    appSettings.findUnique.mockResolvedValue({
      welfarePlace: 'Bloque C, planta baja',
      welfareHours: 'Lunes a viernes, de 08:00 a 16:00',
    });

    await expect(prismaSettingsRepository.getWelfareOffice()).resolves.toEqual({
      place: 'Bloque C, planta baja',
      hours: 'Lunes a viernes, de 08:00 a 16:00',
    });
    expect(appSettings.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { welfarePlace: true, welfareHours: true },
    });
  });

  it('si todavía no hay nada guardado, usa la ubicación y el horario de siempre', async () => {
    appSettings.findUnique.mockResolvedValue(null);

    await expect(prismaSettingsRepository.getWelfareOffice()).resolves.toEqual({
      place: 'Bienestar Estudiantil – Bloque C',
      hours: 'Lunes a viernes, de 08:30 a 16:00',
    });
  });

  it('guarda la nueva ubicación y el nuevo horario', async () => {
    appSettings.upsert.mockResolvedValue({
      welfarePlace: 'Bloque D',
      welfareHours: '09:00 a 17:00',
    });

    const saved = await prismaSettingsRepository.updateWelfareOffice({
      place: 'Bloque D',
      hours: '09:00 a 17:00',
    });

    expect(saved).toEqual({ place: 'Bloque D', hours: '09:00 a 17:00' });
    expect(appSettings.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: { welfarePlace: 'Bloque D', welfareHours: '09:00 a 17:00' },
      create: { id: 1, welfarePlace: 'Bloque D', welfareHours: '09:00 a 17:00' },
      select: { welfarePlace: true, welfareHours: true },
    });
  });
});

describe('Nivel mínimo de similitud guardado en la base de datos', () => {
  it('lee el nivel mínimo guardado', async () => {
    appSettings.findUnique.mockResolvedValue({ minSimilarity: 60 });

    await expect(prismaSettingsRepository.getMatchSettings()).resolves.toEqual({
      minSimilarity: 60,
    });
    expect(appSettings.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { minSimilarity: true },
    });
  });

  it('si todavía no hay nada guardado, usa el nivel de siempre', async () => {
    appSettings.findUnique.mockResolvedValue(null);

    await expect(prismaSettingsRepository.getMatchSettings()).resolves.toEqual({
      minSimilarity: 40,
    });
  });

  it('guarda el nuevo nivel mínimo', async () => {
    appSettings.upsert.mockResolvedValue({ minSimilarity: 60 });

    const saved = await prismaSettingsRepository.updateMatchSettings({ minSimilarity: 60 });

    expect(saved).toEqual({ minSimilarity: 60 });
    expect(appSettings.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: { minSimilarity: 60 },
      create: {
        id: 1,
        welfarePlace: 'Bienestar Estudiantil – Bloque C',
        welfareHours: 'Lunes a viernes, de 08:30 a 16:00',
        minSimilarity: 60,
      },
      select: { minSimilarity: true },
    });
  });
});
