// pages/api/users/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma'; // Adjust path if needed
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Ensure only authenticated ADMINs can access this endpoint
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Requires Admin role' });
  }

  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        // Select specific fields you want to expose, exclude sensitive ones like password
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true, // Example fields
          updatedAt: true, // Example fields
          // Add other non-sensitive fields
        },
        orderBy: { name: 'asc' }, // Optional: order by name
      });

      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}