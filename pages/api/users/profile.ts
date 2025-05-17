import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get session from request
  const session = await getSession({ req });

  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Find user by email from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Add other fields you want to expose
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user info (excluding sensitive data)
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
