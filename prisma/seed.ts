import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const books = [
    {
      id: 'book-1',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1-4493-7332-0',
      category: 'Distributed Systems',
      callNumber: 'QA76.9.D3 K54',
      publishedYear: 2017,
      available: true,
    },
    {
      id: 'book-2',
      title: 'Clean Architecture: A Craftsman Guide',
      author: 'Robert C. Martin',
      isbn: '978-0-1344-9416-6',
      category: 'Software Engineering',
      callNumber: 'QA76.758 M37',
      publishedYear: 2017,
      available: false,
    },
    {
      id: 'book-3',
      title: 'Database Internals',
      author: 'Alex Petrov',
      isbn: '978-1-4920-4034-7',
      category: 'Databases',
      callNumber: 'QA76.9.D3 P48',
      publishedYear: 2019,
      available: true,
    },
    {
      id: 'book-4',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '978-0-2620-4630-5',
      category: 'Algorithms',
      callNumber: 'QA76.6 I58',
      publishedYear: 2022,
      available: false,
    },
    {
      id: 'book-5',
      title: 'Structure and Interpretation of Computer Programs',
      author: 'Harold Abelson',
      isbn: '978-0-2625-1087-5',
      category: 'Programming Languages',
      callNumber: 'QA76.6 A25',
      publishedYear: 1996,
      available: true,
    },
    {
      id: 'book-6',
      title: 'Operating Systems: Three Easy Pieces',
      author: 'Remzi H. Arpaci-Dusseau',
      isbn: '978-1-9850-8659-3',
      category: 'Systems',
      callNumber: 'QA76.76.O63 A77',
      publishedYear: 2018,
      available: true,
    },
    {
      id: 'book-7',
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James F. Kurose',
      isbn: '978-0-1366-8155-7',
      category: 'Networks',
      callNumber: 'TK5105.5 K87',
      publishedYear: 2020,
      available: true,
    },
    {
      id: 'book-8',
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      isbn: '978-0-1359-5705-9',
      category: 'Software Engineering',
      callNumber: 'QA76.6 H85',
      publishedYear: 2019,
      available: true,
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {},
      create: book,
    });
  }

  const members = [
    {
      id: 'member-1',
      memberCode: 'LIB-101',
      name: 'Aarav Nair',
      email: 'aarav.nair@campus.edu',
      department: 'Computer Applications',
    },
    {
      id: 'member-2',
      memberCode: 'LIB-102',
      name: 'Meera Kulkarni',
      email: 'meera.kulkarni@campus.edu',
      department: 'Data Science',
    },
    {
      id: 'member-3',
      memberCode: 'LIB-103',
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@campus.edu',
      department: 'Software Systems',
    },
    {
      id: 'member-4',
      memberCode: 'LIB-104',
      name: 'Ananya Rao',
      email: 'ananya.rao@campus.edu',
      department: 'Artificial Intelligence',
    },
  ];

  for (const member of members) {
    await prisma.member.upsert({
      where: { id: member.id },
      update: {},
      create: member,
    });
  }

  const loans = [
    {
      id: 'loan-1',
      bookId: 'book-2',
      memberId: 'member-1',
      issuedAt: new Date('2026-11-18T10:15:00.000Z'),
      dueAt: new Date('2026-12-02T10:15:00.000Z'),
      returnedAt: null,
    },
    {
      id: 'loan-2',
      bookId: 'book-4',
      memberId: 'member-2',
      issuedAt: new Date('2026-11-08T14:00:00.000Z'),
      dueAt: new Date('2026-11-22T14:00:00.000Z'),
      returnedAt: null,
    },
    {
      id: 'loan-3',
      bookId: 'book-1',
      memberId: 'member-3',
      issuedAt: new Date('2026-10-10T09:30:00.000Z'),
      dueAt: new Date('2026-10-24T09:30:00.000Z'),
      returnedAt: new Date('2026-10-21T16:20:00.000Z'),
    },
  ];

  for (const loan of loans) {
    await prisma.loan.upsert({
      where: { id: loan.id },
      update: {},
      create: loan,
    });
  }

  console.log('Seeded library database with synthetic sample data.');
}

main()
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
