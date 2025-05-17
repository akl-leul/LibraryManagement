import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userEmail = session.user?.email;
  if (!userEmail) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (req.method === "GET") {
    // Return borrowings for logged-in user (or all if admin/librarian)
    try {
      let borrowings;
      if (["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
        borrowings = await prisma.borrowing.findMany({
          include: { user: true, book: true },
          orderBy: { borrowedAt: "desc" },
        });
      } else {
        borrowings = await prisma.borrowing.findMany({
          where: { userId: user.id },
          include: { book: true },
          orderBy: { borrowedAt: "desc" },
        });
      }
      return res.status(200).json(borrowings);
    } catch (error) {
      console.error("Failed to fetch borrowings:", error);
      return res.status(500).json({ message: "Failed to fetch borrowings" });
    }
  } else if (req.method === "POST") {
    // Allow only ADMIN or LIBRARIAN to add borrowings for any user
    if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ message: "Missing userId or bookId" });
    }

    try {
      // Check if book is available
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book || !book.available) {
        return res.status(400).json({ message: "Book not available" });
      }

      const borrowedAt = new Date();
      const dueDate = new Date(borrowedAt.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks

      const borrowing = await prisma.borrowing.create({
        data: { userId, bookId, borrowedAt, dueDate },
      });

      // Mark book as unavailable
      await prisma.book.update({
        where: { id: bookId },
        data: { available: false },
      });

      return res.status(201).json(borrowing);
    } catch (error) {
      console.error("Failed to add borrowing:", error);
      return res.status(500).json({ message: "Failed to add borrowing" });
    }
  } else if (req.method === "PUT") {
    const { borrowingId } = req.body;
    if (!borrowingId) return res.status(400).json({ message: "Missing borrowingId" });

    try {
      const borrowing = await prisma.borrowing.findUnique({ where: { id: borrowingId } });
      if (!borrowing) return res.status(404).json({ message: "Borrowing not found" });
      if (borrowing.returnedAt) return res.status(400).json({ message: "Book already returned" });

      // Only allow the user who borrowed or admins/librarians to mark returned
      if (borrowing.userId !== user.id && !["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const returnedAt = new Date();
      let fine = 0;
      if (returnedAt > borrowing.dueDate) {
        const diffTime = returnedAt.getTime() - borrowing.dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fine = diffDays * 1; // $1 per day late
      }

      await prisma.borrowing.update({
        where: { id: borrowingId },
        data: { returnedAt, fine },
      });

      await prisma.book.update({
        where: { id: borrowing.bookId },
        data: { available: true },
      });

      return res.status(200).json({ message: "Book returned", fine });
    } catch (error) {
      console.error("Return failed:", error);
      return res.status(500).json({ message: "Return failed" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

