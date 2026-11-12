import type { ManagedPlace } from '@shared/admin';
import { saveClassroomInPlace } from './saveClassroomInPlace';

const bloqueA: ManagedPlace = {
  id: 10,
  name: 'Bloque A',
  type: 'BLOCK',
  active: true,
  classrooms: [
    { id: 100, name: 'A-101', active: true },
    { id: 102, name: 'A-103', active: true },
  ],
};

describe('Guardar un aula en su bloque', () => {
  it('agrega el aula nueva en su lugar alfabético', () => {
    const newClassroom = { id: 101, name: 'A-102', active: true };

    expect(saveClassroomInPlace(bloqueA, newClassroom).classrooms).toEqual([
      bloqueA.classrooms[0],
      newClassroom,
      bloqueA.classrooms[1],
    ]);
  });

  it('reemplaza el aula editada', () => {
    const deactivated = { id: 100, name: 'A-101', active: false };

    expect(saveClassroomInPlace(bloqueA, deactivated).classrooms).toEqual([
      deactivated,
      bloqueA.classrooms[1],
    ]);
  });

  it('no cambia el resto del bloque ni el bloque original', () => {
    const saved = saveClassroomInPlace(bloqueA, { id: 101, name: 'A-102', active: true });

    expect(saved).toMatchObject({ id: 10, name: 'Bloque A', type: 'BLOCK', active: true });
    expect(bloqueA.classrooms).toHaveLength(2);
  });
});
