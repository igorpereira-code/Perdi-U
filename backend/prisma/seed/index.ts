import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CATEGORIES, PLACES } from './catalogs';
import { SAMPLE_USERS } from '../../src/core/sampleUsers';

const prisma = new PrismaClient();
const { ana, luis, welfare } = SAMPLE_USERS;

const daysAgo = (days: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const dateOnly = (days: number) => {
  const d = daysAgo(days);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const categoryId = async (name: string) =>
  (await prisma.category.findUniqueOrThrow({ where: { name } })).id;
const placeId = async (name: string) =>
  (await prisma.place.findUniqueOrThrow({ where: { name } })).id;
const classroomId = async (place: string, name: string) =>
  (
    await prisma.classroom.findFirstOrThrow({
      where: { name, place: { name: place } },
    })
  ).id;

const received = (days: number) => ({
  receivedById: welfare.id,
  receivedAt: daysAgo(days, 15),
});
const published = (days: number) => ({
  publishedById: welfare.id,
  publishedAt: daysAgo(days, 16),
});

async function reset() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE deliveries, matches, lost_report_places, lost_reports, found_items, classrooms, places, categories, welfare_emails, users RESTART IDENTITY CASCADE',
  );
  await prisma.$executeRawUnsafe('ALTER SEQUENCE found_item_code_seq RESTART');
  await prisma.$executeRawUnsafe('ALTER SEQUENCE lost_report_code_seq RESTART');
}

async function seedCatalogs() {
  for (const name of CATEGORIES) {
    await prisma.category.create({ data: { name } });
  }
  for (const p of PLACES) {
    await prisma.place.create({
      data: {
        name: p.name,
        type: p.type,
        classrooms: p.classrooms
          ? { create: p.classrooms.map((name) => ({ name })) }
          : undefined,
      },
    });
  }
}

async function seedWelfareEmails() {
  const extra = (process.env.WELFARE_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const emails = [...new Set([welfare.email, ...extra])];
  await prisma.welfareEmail.createMany({
    data: emails.map((email) => ({ email })),
  });
}

async function seedSampleData() {
  await prisma.user.createMany({ data: Object.values(SAMPLE_USERS) });

  // Found items (created one by one so codes go HZ-0001, HZ-0002...)
  const phone = await prisma.foundItem.create({
    data: {
      description: 'Celular Samsung Galaxy con funda azul',
      categoryId: await categoryId('Electrónicos'),
      placeId: await placeId('Biblioteca'),
      placeReference: 'Segundo piso, mesas de estudio',
      foundAt: daysAgo(3, 11),
      finderId: ana.id,
      status: 'PUBLISHED',
      ...received(3),
      ...published(3),
    },
  });
  const backpack = await prisma.foundItem.create({
    data: {
      description: 'Mochila negra marca Totto con cuadernos',
      categoryId: await categoryId('Mochilas y bolsos'),
      placeId: await placeId('Sophie\'s'),
      foundAt: daysAgo(4, 13),
      finderId: luis.id,
      status: 'PUBLISHED',
      ...received(4),
      ...published(4),
    },
  });
  await prisma.foundItem.create({
    data: {
      description: 'Botella metálica verde con stickers',
      categoryId: await categoryId('Botellas y termos'),
      placeId: await placeId('Terraza'),
      foundAt: daysAgo(2, 17),
      finderId: ana.id,
      status: 'PUBLISHED',
      ...received(2),
      ...published(2),
    },
  });
  await prisma.foundItem.create({
    data: {
      description: 'Llaves con llavero rojo de la universidad',
      categoryId: await categoryId('Llaves'),
      placeId: await placeId('Bloque A'),
      classroomId: await classroomId('Bloque A', 'Aula A-12'),
      foundAt: daysAgo(1, 8),
      finderId: ana.id,
      status: 'IN_CUSTODY',
      ...received(1),
    },
  });
  await prisma.foundItem.create({
    data: {
      description: 'Calculadora Casio fx-82 gris',
      categoryId: await categoryId('Útiles y libros'),
      placeId: await placeId('Bloque B'),
      classroomId: await classroomId('Bloque B', 'Aula B-12'),
      foundAt: daysAgo(0, 9),
      finderId: luis.id,
    },
  });
  await prisma.foundItem.create({
    data: {
      description: 'Chamarra gris con capucha talla M',
      categoryId: await categoryId('Ropa y accesorios'),
      placeId: await placeId('11:11'),
      foundAt: daysAgo(0, 12),
      finderId: ana.id,
    },
  });
  const notebook = await prisma.foundItem.create({
    data: {
      description: 'Cuaderno argollado azul con apuntes de Cálculo',
      categoryId: await categoryId('Útiles y libros'),
      placeId: await placeId('Bloque C'),
      classroomId: await classroomId('Bloque C', 'Aula C-12'),
      foundAt: daysAgo(7, 10),
      finderId: luis.id,
      status: 'DELIVERED',
      ...received(7),
      ...published(7),
    },
  });

  // Lost reports (PR-0001, PR-0002...)
  const phoneReport = await prisma.lostReport.create({
    data: {
      description: 'Perdí mi celular Samsung, tiene funda azul',
      categoryId: await categoryId('Electrónicos'),
      placeDescription:
        'Estuve estudiando en la biblioteca y luego fui al Bloque A',
      dateFrom: dateOnly(4),
      dateTo: dateOnly(3),
      status: 'HAS_MATCHES',
      ownerId: luis.id,
      places: {
        create: [
          { placeId: await placeId('Biblioteca') },
          { placeId: await placeId('Bloque A') },
        ],
      },
    },
  });
  const backpackReport = await prisma.lostReport.create({
    data: {
      description: 'Mochila negra Totto, tenía mis cuadernos',
      categoryId: await categoryId('Mochilas y bolsos'),
      dateFrom: dateOnly(5),
      dateTo: dateOnly(4),
      status: 'PENDING_PICKUP',
      ownerId: ana.id,
      places: { create: [{ placeId: await placeId('Sophie\'s') }] },
    },
  });
  await prisma.lostReport.create({
    data: {
      description: 'Llaves de mi casa con llavero rojo de la universidad',
      categoryId: await categoryId('Llaves'),
      dateFrom: dateOnly(2),
      dateTo: dateOnly(1),
      ownerId: luis.id,
      places: {
        create: [
          {
            placeId: await placeId('Bloque A'),
            classroomId: await classroomId('Bloque A', 'Aula A-12'),
          },
          { placeId: await placeId('Parqueo') },
        ],
      },
    },
  });
  const notebookReport = await prisma.lostReport.create({
    data: {
      description: 'Cuaderno azul con mis apuntes de Cálculo',
      categoryId: await categoryId('Útiles y libros'),
      dateFrom: dateOnly(8),
      dateTo: dateOnly(7),
      status: 'RECOVERED',
      ownerId: ana.id,
      places: { create: [{ placeId: await placeId('Bloque C') }] },
    },
  });

  // Matches and the delivery
  await prisma.match.createMany({
    data: [
      { lostReportId: phoneReport.id, foundItemId: phone.id, similarity: 90 },
      {
        lostReportId: backpackReport.id,
        foundItemId: backpack.id,
        similarity: 85,
        status: 'WILL_PICK_UP',
        respondedAt: daysAgo(1),
      },
      {
        lostReportId: notebookReport.id,
        foundItemId: notebook.id,
        similarity: 80,
        status: 'WILL_PICK_UP',
        respondedAt: daysAgo(6),
      },
    ],
  });
  await prisma.delivery.create({
    data: {
      foundItemId: notebook.id,
      lostReportId: notebookReport.id,
      recipientName: ana.name,
      recipientEmail: ana.email,
      recipientUniversityCode: '2021-0451',
      recipientUserId: ana.id,
      registeredById: welfare.id,
      deliveredAt: daysAgo(5),
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed deletes all data. Do not run it in production.');
  }
  await reset();
  await seedCatalogs();
  await seedWelfareEmails();
  await seedSampleData();
  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
