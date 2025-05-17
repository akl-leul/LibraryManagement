import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session || session.user.role !== "LIBRARIAN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const totalBooks = await prisma.book.count();
    const booksBorrowed = await prisma.borrowing.count({ where: { returnedAt: null } });
    const booksAvailable = await prisma.book.count({ where: { available: true } });

    const recentActivitiesRaw = await prisma.borrowing.findMany({
      orderBy: { borrowedAt: "desc" },
      take: 10,
      include: { user: true, book: true },
    });

    const recentActivities = recentActivitiesRaw.map((b) => ({
      id: b.id,
      description: `${b.user.name} borrowed "${b.book.title}"`,
      createdAt: b.borrowedAt,
    }));

    return res.status(200).json({
      totalBooks,
      booksBorrowed,
      booksAvailable,
      recentActivities,
    });
  } catch (error) {
    console.error("Failed to fetch librarian dashboard stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
}
