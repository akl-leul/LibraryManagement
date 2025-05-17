// pages/api/books/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma"; // Adjust path if needed
import { getSession } from "next-auth/react"; // For authentication & authorization

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // --- Authentication Check: Ensure user is logged in ---
  if (!session) {
    return res.status(401).json({ message: "Unauthorized: Not authenticated." });
  }

  const bookIdString = req.query.id as string;
  const bookId = Number(bookIdString);

  if (isNaN(bookId)) {
    return res.status(400).json({ message: "Invalid book ID format." });
  }

  // --- GET Request: Fetch a single book by ID ---
  if (req.method === "GET") {
    try {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
      });

      if (!book) {
        return res.status(404).json({ message: "Book not found." });
      }
      return res.status(200).json(book);
    } catch (error) {
      console.error("API - Failed to fetch book:", error);
      return res.status(500).json({ message: "Server error: Failed to retrieve book data." });
    }
  }
  // --- PUT Request: Update/Edit a book ---
  else if (req.method === "PUT") {
    // Authorization Check: Only ADMIN or LIBRARIAN can update books
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LIBRARIAN') {
      return res.status(403).json({ message: "Forbidden: You do not have permission to update books." });
    }

    // Destructure all expected fields from the body
    const { title, author, isbn, category, available, coverUrl } = req.body;

    // Basic validation
    if (!title || !author || !isbn || !category ) { // Made ISBN and Category required for update consistency
      return res.status(400).json({ message: "Title, Author, ISBN, and Category are required fields for update." });
    }
    if (typeof available !== 'boolean' && available !== undefined) {
        return res.status(400).json({ message: "The 'available' field must be a boolean if provided." });
    }
    // Optional: Validate coverUrl format if provided
    if (coverUrl !== undefined && coverUrl !== null && typeof coverUrl !== 'string') {
        return res.status(400).json({ message: "The 'coverUrl' field must be a string if provided." });
    }


    try {
      const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
      if (!existingBook) {
        return res.status(404).json({ message: "Book not found, cannot update." });
      }

      const dataToUpdate: any = { // Use 'any' or a specific Prisma update type
        title,
        author,
        isbn,
        category,
      };

      // Only include 'available' in the update if it was actually provided in the request body
      if (available !== undefined) {
        dataToUpdate.available = available;
      }
      // Only include 'coverUrl' if it was provided.
      // If coverUrl is an empty string, it will set it to empty. If null, it will set it to null.
      // If you want to allow removing coverUrl by sending null/empty string:
      if (coverUrl !== undefined) {
        dataToUpdate.coverUrl = coverUrl; // This will set to null if coverUrl is null, or empty string if coverUrl is ""
      }
      // If you only want to update coverUrl if it's a non-empty string:
      // if (coverUrl !== undefined && coverUrl !== null && coverUrl.trim() !== "") {
      //   dataToUpdate.coverUrl = coverUrl;
      // } else if (coverUrl === null || (coverUrl !== undefined && coverUrl.trim() === "")) {
      //   // If you want to explicitly set it to null when an empty string is passed to clear it
      //   dataToUpdate.coverUrl = null;
      // }


      const updatedBook = await prisma.book.update({
        where: { id: bookId },
        data: dataToUpdate,
      });
      return res.status(200).json(updatedBook);
    } catch (error: any) { // Type error explicitly
      console.error("API - Failed to update book:", error);
      if (error.code === 'P2025') { // Prisma's "Record to update not found"
          return res.status(404).json({ message: "Book not found or an issue occurred during update." });
      }
      return res.status(500).json({ message: "Server error: An error occurred while updating the book." });
    }
  }
  // --- DELETE Request: Delete a book ---
  else if (req.method === "DELETE") {
    // Authorization Check: Only ADMIN or LIBRARIAN can delete books
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LIBRARIAN') {
      return res.status(403).json({ message: "Forbidden: You do not have permission to delete books." });
    }

    try {
      // Optional: Check if the book exists before attempting to delete, for a more specific 404.
      // const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
      // if (!existingBook) {
      //   return res.status(404).json({ message: "Book not found, cannot delete." });
      // }

      await prisma.book.delete({ where: { id: bookId } });
      return res.status(204).end(); // Successfully deleted, no content to return.
    } catch (error: any) { // Type error explicitly
      console.error("API - Failed to delete book:", error);
      if (error.code === 'P2025') { // Prisma's "Record to delete not found"
          // This error means the record was already gone, which for a DELETE operation is often an acceptable outcome.
          // Some prefer to return 204 here as well, or a specific 404 like "Book already deleted or never existed."
          return res.status(404).json({ message: "Book not found or already deleted." });
      }
      // Handle other potential errors, e.g., foreign key constraints if books are linked to borrowings that aren't set to cascade delete or nullify
      if (error.code === 'P2003') { // Foreign key constraint failed
        return res.status(409).json({ message: "Cannot delete book: It is currently part of an active borrowing record. Please ensure the book is returned first." });
      }
      return res.status(500).json({ message: "Server error: Failed to delete the book." });
    }
  }
  else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}