// app/api/borrowings/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust path as needed

export async function GET() {
  try {
    const borrowings = await prisma.borrowing.findMany({
      include: {
        user: { select: { id: true, name: true } },
        book: { select: { id: true, title: true } },
      },
      orderBy: { borrowedAt: "desc" },
    });
    return NextResponse.json(borrowings, { status: 200 });
  } catch (error) {
    console.error("Error fetching borrowings:", error);
    return NextResponse.json({ message: "Failed to fetch borrowings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, bookId, borrowedAt, dueDate } = body;

    // Validate input
    if (!userId || !bookId || !borrowedAt || !dueDate) {
      return NextResponse.json(
        { message: "Missing required fields: userId, bookId, borrowedAt, dueDate" },
        { status: 400 }
      );
    }
    if (typeof userId !== "number" || typeof bookId !== "number") {
      return NextResponse.json(
        { message: "userId and bookId must be numbers" },
        { status: 400 }
      );
    }

    const borrowedDate = new Date(borrowedAt);
    const dueDateObj = new Date(dueDate);
    if (isNaN(borrowedDate.getTime()) || isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format for borrowedAt or dueDate" },
        { status: 400 }
      );
    }

    // Transaction: check book & user, create borrowing, update book availability
    const borrowing = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new Error("BOOK_NOT_FOUND");
      if (!book.available) throw new Error("BOOK_NOT_AVAILABLE");

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("USER_NOT_FOUND");

      const newBorrowing = await tx.borrowing.create({
        data: {
          userId,
          bookId,
          borrowedAt: borrowedDate,
          dueDate: dueDateObj,
        },
        include: {
          user: true,
          book: true,
        },
      });

      await tx.book.update({
        where: { id: bookId },
        data: { available: false },
      });

      return newBorrowing;
    });

    return NextResponse.json(borrowing, { status: 201 });
  } catch (error: any) {
    console.error("Error creating borrowing:", error);

    if (error.message === "BOOK_NOT_FOUND") {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }
    if (error.message === "BOOK_NOT_AVAILABLE") {
      return NextResponse.json({ message: "Book is currently not available" }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Failed to add borrowing" }, { status: 500 });
  }
}
