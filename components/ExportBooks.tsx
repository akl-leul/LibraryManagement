import { useEffect, useState } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

import { toast } from "react-toastify";
import { FaFileExport, FaEdit } from "react-icons/fa";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  createdAt: string;
}

export default function ExportBooks() {
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Book Management</h1>
      <div className="mb-4 flex justify-end">
       
        {/* <div className="space-x-2">
          <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded">Export Excel</button>
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
        </div> */}
         <Link href="/books" legacyBehavior>
          <a className="flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white focus:ring-sky-500 py-2 px-8 ">Export <FaFileExport/></a>
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
      <table className="min-w-full divide-y divide-slate-700 rounded-lg"> 
      <thead className="bg-slate-700">  
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider" // Lighter header text
          >
            ID
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
          >
            Title
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
          >
            Author
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden sm:table-cell"
          >
            ISBN
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell"
          >
            Category
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
          >
            Available
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-slate-800 divide-y divide-slate-700">  
       
        {books && books.map((book) => (
          <tr key={book.id} className="hover:bg-slate-700/50 transition-colors duration-150">  
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">  
              {book.id}
            </td>
            <td className="px-6 py-4">
              <div className="text-sm font-medium text-slate-100">{book.title}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-slate-300">{book.author}</div>  
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden sm:table-cell">
              {book.isbn}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden md:table-cell">
              {book.category}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {book.available ? (
                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-700 text-green-100"> {/* Dark mode badge */}
                  Available
                </span>
              ) : (
                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-700 text-red-100"> {/* Dark mode badge */}
                  Unavailable
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <Link href={`/books/${book.id}`} legacyBehavior>
                <a className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150"> {/* Adjusted button color and focus offset */}
                 <FaEdit/> Edit
                </a>
              </Link>
              {/* Example Delete Button for Dark Mode */}
              {/*
              <button className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-rose-500">
                Delete
              </button>
              */}
            </td>
          </tr>
        ))}
        {/* Add a row for when there are no books */}
        {(!books || books.length === 0) && (
            <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400"> {/* Lighter text for no books message */}
                    No books found.
                </td>
            </tr>
        )}
      </tbody>
    </table>
  
      )}   </div>
  );
}
