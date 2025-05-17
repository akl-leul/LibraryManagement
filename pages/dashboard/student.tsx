import Layout from "../../components/Layout";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  coverUrl?: string;
}

interface Borrowing {
  id: number;
  book: Book;
  dueDate: string;
  returnedAt?: string | null;
  fine?: number | null;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [searchAvailable, setSearchAvailable] = useState("");

  useEffect(() => {
    if (!session) return;
    if (session.user.role !== "STUDENT") {
      router.replace("/403");
      return;
    }
    fetchBorrowings();
    fetchAvailableBooks();
  }, [session, router]);

  async function fetchBorrowings() {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/borrowings?userEmail=${encodeURIComponent(session.user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setBorrowings(data);
      } else {
        console.error("Failed to fetch borrowings:", await res.text());
        setBorrowings([]);
      }
    } catch (error) {
      console.error("Error fetching borrowings:", error);
      setBorrowings([]);
    }
  }

  async function fetchAvailableBooks() {
    try {
      const res = await fetch("/api/books?available=true");
      if (!res.ok) {
        console.error("Failed to load books:", await res.text());
        throw new Error("Failed to load books");
      }
      const data = await res.json();
      setAvailableBooks(data.books || data);
    } catch (error) {
      console.error("Error fetching available books:", error);
      setAvailableBooks([]);
    }
  }

  const filteredAvailableBooks = useMemo(() => {
    const q = searchAvailable.toLowerCase();
    if (!availableBooks) return [];
    return availableBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q)
    );
  }, [availableBooks, searchAvailable]);

  async function handleBorrow(bookId: number) {
    if (!confirm("Do you want to borrow this book?")) return;
    try {
      const res = await fetch("/api/borrowings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to borrow book. The book might not be available or another issue occurred.");
        return;
      }
      alert("Book borrowed successfully!");
      fetchBorrowings();
      fetchAvailableBooks();
    } catch (error) {
      console.error("Network error while borrowing book:", error);
      alert("Network error while borrowing book. Please try again.");
    }
  }

  if (!session) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-900 min-h-screen py-8"> {/* Apply dark background to the whole page area */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-100 mb-8">
            Student Dashboard
          </h1>

          <div className="flex flex-col lg:flex-row w-full gap-8">
            {/* Search and list available books */}
            <section className="lg:w-2/3 w-full bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Search Available Books
              </h2>
              <input
                type="text"
                placeholder="Search by title, author, ISBN, or category..."
                className="mb-6 p-3 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 w-full max-w-lg bg-gray-700 text-gray-100 placeholder-gray-400"
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
              />
              {filteredAvailableBooks.length === 0 ? (
                <p className="text-gray-500 text-center py-10 italic">
                  No available books match your search criteria.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cover</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {filteredAvailableBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-gray-700 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {book.coverUrl ? (
                              <img src={book.coverUrl} alt={`Cover of ${book.title}`} className="h-16 w-12 object-cover rounded shadow-sm" />
                            ) : (
                              <div className="h-16 w-12 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs italic shadow-sm">No Cover</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-100">{book.title}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{book.author}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${book.category ? 'bg-blue-600 text-blue-100' : 'bg-gray-600 text-gray-300'}`}>
                              {book.category || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleBorrow(book.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-150"
                            >
                              Borrow
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Borrowed books */}
            <section className="lg:w-1/3 w-full bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Your Borrowed Books
              </h2>
              {borrowings.length === 0 ? (
                <p className="text-gray-500 text-center py-10 italic">
                  You have no borrowed books.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Book</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Returned</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fine</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {borrowings.map((b) => {
                        const dueDateObj = new Date(b.dueDate);
                        const today = new Date();
                        dueDateObj.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        const isOverdue = !b.returnedAt && dueDateObj < today;
                        const isDueToday = !b.returnedAt && dueDateObj.getTime() === today.getTime();
                        
                        let rowClass = "transition-colors duration-150";
                        if (isOverdue) rowClass += " bg-red-900/50 hover:bg-red-800/60";
                        else if (isDueToday) rowClass += " bg-yellow-900/50 hover:bg-yellow-800/60";
                        else rowClass += " hover:bg-gray-700";


                        let dueDateClass = "text-sm text-gray-300";
                        if (isOverdue) dueDateClass = "text-sm text-red-400 font-semibold";
                        else if (isDueToday) dueDateClass = "text-sm text-yellow-400 font-semibold";
                        
                        return (
                          <tr key={b.id} className={rowClass}>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-100">{b.book.title}</div>
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap ${dueDateClass}`}>
                              {new Date(b.dueDate).toLocaleDateString()}
                              {isOverdue && <span className="block text-xs">(Overdue)</span>}
                              {isDueToday && <span className="block text-xs">(Due Today)</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                              {b.returnedAt ? new Date(b.returnedAt).toLocaleDateString() : <span className="italic text-gray-500">Not Returned</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {b.fine ? <span className="text-red-400 font-semibold">${b.fine.toFixed(2)}</span> : <span className="text-gray-500">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}