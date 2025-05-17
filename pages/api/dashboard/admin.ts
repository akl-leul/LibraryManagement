import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { withRole } from "../../../lib/middleware";

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) {
  const totalUsers = await prisma.user.count();
  const totalBooks = await prisma.book.count();
  const booksBorrowed = await prisma.book.count({ where: { available: false } });
  const booksAvailable = await prisma.book.count({ where: { available: true } });

  // For demo, recent activities could be recent borrowings and returns
  const recentBorrowings = await prisma.borrowing.findMany({
    orderBy: { borrowedAt: "desc" },
    take: 5,
    include: { user: true, book: true },
  });

  const recentActivities = recentBorrowings.map(b => ({
    id: b.id,
    description: `${b.user.name} borrowed "${b.book.title}"`,
    createdAt: b.borrowedAt,
  }));

  res.status(200).json({
    totalUsers,
    totalBooks,
    booksBorrowed,
    booksAvailable,
    recentActivities,
  });
}

export default withRole(handler, ["ADMIN"]);
