import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clear existing data
  await prisma.borrowing.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Helper to hash password
  async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Create users
  const adminPassword = await hashPassword("admin123");
  const librarianPassword = await hashPassword("librarian123");
  const studentPassword = await hashPassword("student123");

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const librarian = await prisma.user.create({
    data: {
      name: "Librarian User",
      email: "librarian@example.com",
      password: librarianPassword,
      role: Role.LIBRARIAN,
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Student User",
      email: "student@example.com",
      password: studentPassword,
      role: Role.STUDENT,
    },
  });

  // Create books
  const books = await prisma.book.createMany({
    data: [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        category: "Fiction",
        available: true,
      },
      {
        title: "2025",
        author: "George Orwell",
        isbn: "9780451524935",
        category: "Dystopian",
        available: true,
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780060935467",
        category: "Fiction",
        available: true,
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "9780132350884",
        category: "Programming",
        available: true,
      },
    ],
  });

  // Fetch books to get IDs
  const allBooks = await prisma.book.findMany();

  // Create borrowings: student borrows "1984"
  const book2025 = allBooks.find(b => b.title === "2025");
  if (book2025) {
    await prisma.borrowing.create({
      data: {
        userId: student.id,
        bookId: book2025.id,
        borrowedAt: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    // Mark book as unavailable
    await prisma.book.update({
      where: { id: book2025.id },
      data: { available: false },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
