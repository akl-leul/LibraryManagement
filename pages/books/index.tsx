import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { exportToExcel, exportToPDF } from "../../lib/export";
import { toast } from "react-toastify"; 

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  createdAt: string;
}

export default function BooksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
      router.replace("/403");
      return;
    }
    fetchBooks();
  }, [session]);

  async function fetchBooks() {
    setLoading(true);
    const res = await fetch("/api/books");
    if (res.ok) {
      const data = await res.json();
      setBooks(data);
    } else {
      toast.error("Failed to fetch books");
    }
    setLoading(false);
  }

  function handleExportExcel() {
    exportToExcel(books, "books.xlsx");
  }

  function handleExportPDF() {
    const columns = ["ID", "Title", "Author", "ISBN", "Category", "Available", "Created At"];
    const data = books.map(b => [
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.category,
      b.available ? "Yes" : "No",
      new Date(b.createdAt).toLocaleString(),
    ]);
    exportToPDF(columns, data, "books.pdf");
  }

  return (
    <Layout>
      <div className="px-10">
      <h1 className="text-2xl font-bold mb-4">Book Management</h1>
      <div className="mb-4 flex justify-between">
        <Link href="/books/new" legacyBehavior>
          <a className="bg-green-600 text-white px-4 py-2 rounded">Add Book</a>
        </Link>
        <div className="space-x-2">
          <button onClick={handleExportExcel} className=" flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white focus:ring-sky-500 py-2 px-8 ">Export </button>
          {/* <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button> */}
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full cursor-pointer border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Title</th>
              <th className="border border-gray-300 p-2">Author</th>
              <th className="border border-gray-300 p-2">ISBN</th>
              <th className="border border-gray-300 p-2">Category</th>
              <th className="border border-gray-300 p-2">Available</th>
              
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id} className="hover:bg-gray-500">
                <td className="border border-gray-300 p-2">{book.id}</td>
                <td className="border border-gray-300 p-2">{book.title}</td>
                <td className="border border-gray-300 p-2">{book.author}</td>
                <td className="border border-gray-300 p-2">{book.isbn}</td>
                <td className="border border-gray-300 p-2">{book.category}</td>
                <td className="border border-gray-300 p-2">{book.available ? "Yes" : "No"}</td>
               
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </Layout>
  );
}
