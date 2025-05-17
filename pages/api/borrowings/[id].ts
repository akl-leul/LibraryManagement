import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const borrowingId = Number(req.query.id);

  if (isNaN(borrowingId)) {
    return res.status(400).json({ message: "Invalid borrowing ID" });
  }

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    // Find the borrowing record
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: borrowingId },
    });

    if (!borrowing) {
      return res.status(404).json({ message: "Borrowing not found" });
    }

    if (borrowing.returnedAt) {
      return res.status(400).json({ message: "Book already returned" });
    }

    const returnedAt = new Date();

    // Calculate fine if returned late
    let fine = 0;
    if (returnedAt > borrowing.dueDate) {
      const diffMs = returnedAt.getTime() - borrowing.dueDate.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fine = diffDays * 1; // For example, $1 fine per day late
    }

    // Update borrowing record
    const updatedBorrowing = await prisma.borrowing.update({
      where: { id: borrowingId },
      data: {
        returnedAt,
        fine,
      },
    });

    // Mark the book as available again
    await prisma.book.update({
      where: { id: borrowing.bookId },
      data: { available: true },
    });

    return res.status(200).json({
      message: "Book marked as returned",
      borrowing: updatedBorrowing,
    });
  } catch (error) {
    console.error("Error marking borrowing as returned:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
