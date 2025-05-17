import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const borrowings = await prisma.borrowing.findMany({
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true } },
      },
      orderBy: { borrowedAt: "desc" },
    });
    return NextResponse.json(borrowings);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch borrowings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bookId, borrowedAt, dueDate } = body;

    if (!userId || !bookId || !borrowedAt || !dueDate) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || !book.available) {
      return NextResponse.json({ message: "Book not available" }, { status: 400 });
    }

    const borrowing = await prisma.borrowing.create({
      data: {
        userId,
        bookId,
        borrowedAt: new Date(borrowedAt),
        dueDate: new Date(dueDate),
      },
    });

    await prisma.book.update({ where: { id: bookId }, data: { available: false } });

    return NextResponse.json(borrowing, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to add borrowing" }, { status: 500 });
  }
}
