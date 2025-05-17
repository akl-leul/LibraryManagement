import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { hashPassword } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: "asc" },
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  } else if (req.method === "POST") {
    try {
      // Ensure content-type is application/json
      if (req.headers["content-type"] !== "application/json") {
        return res.status(400).json({ message: "Content-Type must be application/json" });
      }

      // Parse body safely
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || "STUDENT",
        },
      });

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("User creation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
