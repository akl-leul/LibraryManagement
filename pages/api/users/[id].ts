// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { withRole } from "../../../lib/middleware"; // Assuming this handles auth and role check
import { hashPassword } from "../../../lib/auth"; // For password updates

// Helper function for basic email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validRoles = ["ADMIN", "LIBRARIAN", "STUDENT"];

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) { // `session` is injected by withRole
  const { id: queryId } = req.query;

  if (typeof queryId !== "string") {
    return res.status(400).json({ message: "Invalid User ID format in URL." });
  }

  const userId = parseInt(queryId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "User ID must be a valid number." });
  }

  // --- GET Request: Fetch a single user ---
  if (req.method === "GET") {
    try {
      // The `withRole` middleware should already ensure only ADMINs can reach this.
      // If not, add: if (session.user.role !== 'ADMIN' && session.user.id !== userId) return res.status(403)...
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // Select specific fields to avoid sending password hash
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          borrowings: { // Keep borrowings if needed, but be mindful of payload size
            select: {
              id: true,
              borrowedAt: true,
              dueDate: true,
              returnedAt: true,
              book: {
                select: { id: true, title: true, isbn: true }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(`API User GET Error (ID: ${userId}):`, error);
      return res.status(500).json({ message: "Server error: Could not retrieve user details." });
    }
  }
  // --- PUT Request: Update a user ---
  else if (req.method === "PUT") {
    try {
      // `withRole` ensures only ADMINs can access this.
      const { name, email, role, password } = req.body;
      const dataToUpdate: any = {}; // Build update object dynamically

      // Validate and add fields to update
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          return res.status(400).json({ message: "Name cannot be empty." });
        }
        dataToUpdate.name = name.trim();
      }

      if (email !== undefined) {
        if (typeof email !== 'string' || !isValidEmail(email)) {
          return res.status(400).json({ message: "Invalid email format." });
        }
        // Check if email is being changed to one that already exists
        const existingUserWithEmail = await prisma.user.findUnique({
          where: { email: email.toLowerCase() }
        });
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
          return res.status(409).json({ message: "Conflict: Email address is already in use by another account." });
        }
        dataToUpdate.email = email.toLowerCase();
      }

      if (role !== undefined) {
        if (typeof role !== 'string' || !validRoles.includes(role)) {
          return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(", ")}.` });
        }
        // Prevent admin from demoting the last admin or themselves if specific logic needed.
        // For now, admin can change any role.
        dataToUpdate.role = role;
      }

      if (password !== undefined) {
        if (typeof password !== 'string' || password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }
        dataToUpdate.password = await hashPassword(password);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update." });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: { // Select fields to return, excluding password
          id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true
        }
      });

      return res.status(200).json(updatedUser);

    } catch (error: any) { // Catch specific Prisma errors
      console.error(`API User PUT Error (ID: ${userId}):`, error);
      if (error.code === 'P2025') { // Record to update not found
        return res.status(404).json({ message: "User not found, cannot update." });
      }
      // P2002 for unique constraint like email is handled by pre-check above.
      return res.status(500).json({ message: "Server error: Update failed. Please try again." });
    }
  }
  // --- DELETE Request: Delete a user ---
  else if (req.method === "DELETE") {
    try {
      // `withRole` ensures only ADMINs can access this.

      // Optional: Prevent an admin from deleting their own account
      if (session.user.id === userId) {
        return res.status(403).json({ message: "Forbidden: Administrators cannot delete their own account through this endpoint." });
      }

      // Check if user exists before attempting delete for a more accurate 404
      const userExists = await prisma.user.findUnique({ where: { id: userId }});
      if (!userExists) {
        return res.status(404).json({ message: "User not found, cannot delete." });
      }

      await prisma.user.delete({ where: { id: userId } });
      return res.status(204).end(); // Successfully deleted, no content to return.

    } catch (error: any) { // Catch specific Prisma errors
      console.error(`API User DELETE Error (ID: ${userId}):`, error);
      if (error.code === 'P2025') { // Record to delete not found (already handled by pre-check)
        return res.status(404).json({ message: "User not found or already deleted." });
      }
      if (error.code === 'P2003') { // Foreign key constraint failed
        // This means the user is linked to other records (e.g., borrowings)
        // that prevent deletion due to database constraints.
        return res.status(409).json({
          message: "Conflict: Cannot delete user. This user is associated with other records (e.g., borrowing history). Please resolve these associations first or contact support."
        });
      }
      return res.status(500).json({ message: "Server error: Delete failed. Please try again." });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Ensure your `withRole` middleware correctly handles session and authorization
// It should pass the session object to the handler as the third argument.
export default withRole(handler, ["ADMIN"]);