import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { available, search } = req.query;

    const where: any = {};

    if (available !== undefined) {
      where.available = available === "true";
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { isbn: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    try {
      const books = await prisma.book.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(books);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  } else if (req.method === "POST") {
    const { title, author, isbn, category, coverUrl } = req.body;
    if (!title || !author || !isbn || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const existing = await prisma.book.findUnique({ where: { isbn } });
      if (existing) {
        return res.status(409).json({ message: "Book with this ISBN already exists" });
      }

      const book = await prisma.book.create({
        data: { title, author, isbn, category, coverUrl, available: true },
      });

      res.status(201).json(book);
    } catch (error) {
      console.error("Failed to create book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
