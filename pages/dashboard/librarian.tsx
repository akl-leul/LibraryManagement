// pages/dashboard/librarian.tsx
import Layout from "../../components/Layout"; // Ensure this is your dark-themed Layout
import LibrarianSidebar from "../../components/LibrarianSidebar"; // Ensure this is dark-themed
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import toast from 'react-hot-toast'; // For notifications
import Link from "next/link";
// Assuming these are already modernized for dark theme from previous steps:
import BorrowingTab from "@/components/BorrowingList"; // Renamed for clarity
import BorrowingForm from "@/components/BookForm";     // For adding new borrowings

import {
  FaPlus, FaSearch, FaBook, FaUsers, FaChartBar, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit, FaArchive
} from "react-icons/fa";
import BorrowingsTab from "@/components/BorrowingList";

// Interfaces (keep as is or adjust as needed)
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
  user: { id: number; name: string };
  book: { id: number; title: string; isbn?: string }; // isbn might be optional
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fine?: number | null;
}

interface LibrarianStats {
  totalBooks: number;
  booksBorrowed: number;
  booksAvailable: number;
  totalUsers?: number; // Added for example
  recentActivities: { id: string; description: string; createdAt: string }[];
}

// --- Reusable UI Components (Internal to this file or move to separate components) ---

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType, colorClass?: string }> = ({ title, value, icon: Icon, colorClass = "text-sky-400" }) => (
  <div className="bg-slate-700/50 p-6 rounded-xl shadow-lg flex items-center space-x-4">
    <div className={`p-3 rounded-full bg-slate-600 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-slate-300">{title}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  </div>
);

const SectionTitle: React.FC<{ title: string; icon?: React.ElementType, children?: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold text-sky-400 flex items-center">
      {Icon && <Icon className="mr-3 text-sky-500" />}
      {title}
    </h1>
    {children}
  </div>
);

const inputBaseClasses = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out";
const buttonBaseClasses = "flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800";
const primaryButtonClasses = `${buttonBaseClasses} bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white focus:ring-sky-500`;
const secondaryButtonClasses = `${buttonBaseClasses} bg-slate-600 hover:bg-slate-500 text-slate-100 focus:ring-slate-400`;
// --- End Reusable UI Components ---


export default function LibrarianDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const tab = (router.query.tab as string) || "dashboard";

  const [stats, setStats] = useState<LibrarianStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]); // Explicitly type if possible

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingBorrowings, setLoadingBorrowings] = useState(true);

  const [submittingBook, setSubmittingBook] = useState(false); // Renamed from addingBook
  const [updatingBookId, setUpdatingBookId] = useState<number | null>(null);

  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", category: "", coverUrl: "" });
  const [searchBook, setSearchBook] = useState("");
  // searchBorrowed is handled by BorrowingsTabDisplay internally

  // Primary data fetching logic
  useEffect(() => {
    if (sessionStatus === "loading") return; // Wait for session
    if (!session) {
      router.replace("/auth/signin"); // Or your desired unauthenticated redirect
      return;
    }
    if (session.user.role !== "LIBRARIAN") {
      router.replace("/403"); // Forbidden page
      return;
    }

    // Reset loaders for tab changes
    setLoadingStats(true);
    setLoadingBooks(true);
    setLoadingBorrowings(true);

    if (tab === "dashboard") fetchStats();
    if (tab === "books") fetchBooks();
    if (tab === "borrowed") fetchAllBorrowings(); // Renamed to avoid conflict
  }, [session, sessionStatus, tab, router]);


  async function fetchStats() {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/dashboard/librarian"); // Ensure this API exists
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      toast.error((error as Error).message || "Error fetching stats.");
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  async function fetchBooks() {
    setLoadingBooks(true);
    try {
      const res = await fetch("/api/books");
      if (!res.ok) throw new Error("Failed to load books");
      const data = await res.json();
      setBooks(Array.isArray(data.books) ? data.books : Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error((error as Error).message || "Error fetching books.");
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }

  // This function is for the BorrowingsTabDisplay and BorrowingForm on the "borrowed" tab
  async function fetchAllBorrowings() {
    setLoadingBorrowings(true);
    try {
      // Ensure your API route is correct, e.g., /api/borrowings or /api/borrowings/all
      const res = await fetch("/api/borrowings/");
      if (!res.ok) throw new Error("Failed to load borrowing records");
      const data = await res.json();
      setBorrowings(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error((error as Error).message || "Error fetching borrowings.");
      setBorrowings([]);
    } finally {
      setLoadingBorrowings(false);
    }
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingBook(true);
    const toastId = toast.loading("Adding new book...");
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBook),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to add book." }));
        throw new Error(err.message);
      }
      toast.success("Book added successfully!", { id: toastId });
      setNewBook({ title: "", author: "", isbn: "", category: "", coverUrl: "" });
      fetchBooks(); // Refresh book list
      if (tab === "dashboard") fetchStats(); // Refresh stats if on dashboard
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setSubmittingBook(false);
    }
  }

  async function handleUpdateBook(bookId: number, updatedFields: Partial<Book>) {
    setUpdatingBookId(bookId);
    const toastId = toast.loading(`Updating book ID: ${bookId}...`);
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update book." }));
        throw new Error(err.message);
      }
      toast.success("Book updated successfully!", { id: toastId });
      fetchBooks(); // Refresh book list
      if (tab === "dashboard") fetchStats(); // Refresh stats if on dashboard
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setUpdatingBookId(null);
    }
  }

  async function markReturned(borrowingId: number) {
    // This function is passed to BorrowingsTabDisplay
    // The actual loading state for this action will be handled within BorrowingsTabDisplay's custom confirm
    // This function's role is primarily to make the API call and trigger data refresh.
    try {
      const res = await fetch(`/api/borrowings/index`, { // Example: specific return endpoint
        method: "PUT",
        // body might not be needed if endpoint only needs ID from URL
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to mark as returned." }));
        throw new Error(err.message);
      }
      // Success toast is handled by showConfirmModal in BorrowingsTabDisplay
      fetchAllBorrowings(); // Refresh borrowings list
      fetchBooks();       // Refresh book availability
      if (tab === "dashboard") fetchStats(); // Refresh stats
    } catch (error) {
      // Error toast is handled by showConfirmModal in BorrowingsTabDisplay
      console.error("Error in markReturned (parent):", error);
      throw error; // Re-throw to be caught by the confirm modal's logic
    }
  }


  const filteredBooks = useMemo(() => {
    if (!searchBook) return books;
    const q = searchBook.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q)
    );
  }, [books, searchBook]);

  // Loading indicator component
  const LoadingIndicator: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <FaSpinner className="animate-spin text-4xl mb-3" />
      <p>{message}</p>
    </div>
  );


  function renderContent() {
    if (sessionStatus === "loading") return <LoadingIndicator message="Authenticating..." />;
    if (!session || session.user.role !== "LIBRARIAN") return <LoadingIndicator message="Access Denied. Redirecting..." />; // Or a proper 403 component

    // Dashboard Tab
    if (tab === "dashboard") {
      if (loadingStats) return <LoadingIndicator message="Loading dashboard statistics..." />;
      if (!stats) return <p className="text-red-400 text-center py-10">Failed to load dashboard statistics.</p>;
      return (
        <div className="space-y-8">
          <SectionTitle title="Librarian Dashboard" icon={FaChartBar} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatCard title="Total Books" value={stats.totalBooks} icon={FaBook} />
            <StatCard title="Books Borrowed" value={stats.booksBorrowed} icon={FaArchive} colorClass="text-amber-400" />
            <StatCard title="Books Available" value={stats.booksAvailable} icon={FaCheckCircle} colorClass="text-green-400" />
            {stats.totalUsers !== undefined && <StatCard title="Total Users" value={stats.totalUsers} icon={FaUsers} colorClass="text-purple-400" />}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-200 mb-4">Recent Activities</h2>
            {stats.recentActivities.length === 0 ? (
              <p className="text-slate-400">No recent activities.</p>
            ) : (
              <ul className="space-y-3 bg-slate-700/30 p-4 rounded-lg">
                {stats.recentActivities.slice(0, 5).map((act) => ( // Show top 5
                  <li key={act.id} className="text-sm text-slate-300 border-b border-slate-700 pb-2 last:border-b-0">
                    <span className="text-slate-100">{act.description}</span> -
                    <span className="text-xs text-slate-400 ml-1">{new Date(act.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    // Books Management Tab
    if (tab === "books") {
      return (
        <div className="space-y-8">
          <SectionTitle title="Manage Books" icon={FaBook}>
            {/* Optional: Button to toggle Add Book form/modal */}
          </SectionTitle>

          {/* Add New Book Form */}
          <form onSubmit={handleAddBook} className="bg-slate-700/50 p-6 rounded-xl shadow-lg space-y-4 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Add New Book</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title" className={inputBaseClasses} value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} required disabled={submittingBook} />
              <input type="text" placeholder="Author" className={inputBaseClasses} value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} required disabled={submittingBook} />
              <input type="text" placeholder="ISBN" className={inputBaseClasses} value={newBook.isbn} onChange={e => setNewBook({ ...newBook, isbn: e.target.value })} required disabled={submittingBook} />
              <input type="text" placeholder="Category" className={inputBaseClasses} value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })} required disabled={submittingBook} />
            </div>
            <input type="text" placeholder="Cover URL (optional)" className={inputBaseClasses} value={newBook.coverUrl} onChange={e => setNewBook({ ...newBook, coverUrl: e.target.value })} disabled={submittingBook} />
            <button type="submit" className={`${primaryButtonClasses} w-full md:w-auto`} disabled={submittingBook}>
              <FaPlus /> {submittingBook ? "Adding Book..." : "Add Book"}
            </button>
          </form>

          {/* Books List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Books Collection</h3>
              <div className="relative max-w-sm w-full">
                 <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search books..." className={`${inputBaseClasses} pl-10`} value={searchBook} onChange={e => setSearchBook(e.target.value)} />
              </div>
            </div>
            {loadingBooks ? (
              <LoadingIndicator message="Loading books collection..." />
            ) : filteredBooks.length === 0 ? (
              <p className="text-slate-400 text-center py-10">{searchBook ? "No books match your search." : "No books in collection."}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700">
                    <tr>
                      {["Title", "Author", "ISBN", "Category", "Available", "Actions"].map(header => (
                        <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {filteredBooks.map(book => (
                      <tr key={book.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">{book.title}</td>
                        <td className="px-4 py-3 text-sm text-slate-200">{book.author}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{book.isbn}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{book.category}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            onClick={() => handleUpdateBook(book.id, { available: !book.available })}
                            disabled={updatingBookId === book.id}
                            className={`p-1.5 rounded-full transition-colors ${book.available ? 'bg-green-500/30 hover:bg-green-500/50' : 'bg-red-500/30 hover:bg-red-500/50'}`}
                            title={book.available ? "Mark as Unavailable" : "Mark as Available"}
                          >
                            {updatingBookId === book.id ? <FaSpinner className="animate-spin text-white w-4 h-4"/> : book.available ? <FaCheckCircle className="text-green-400 w-4 h-4" /> : <FaTimesCircle className="text-red-400 w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300 text-center">
                            <Link href={`/books/${book.id}`} legacyBehavior>
                                <a className="text-sky-400 hover:text-sky-300" title="Edit Book"><FaEdit /></a>
                            </Link>
                            </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Borrowings Management Tab
    if (tab === "borrowed") {
      return (
        <div className="space-y-10">
          <SectionTitle title="Manage Borrowings" icon={FaArchive} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <BorrowingForm onBorrowingAdded={fetchAllBorrowings} />
            </div>
            <div className="lg:col-span-2">
              {loadingBorrowings ? (
                <LoadingIndicator message="Loading borrowing records..." />
              ) : (
                <BorrowingTab borrowings={borrowings} onReturn={markReturned} />
              )}
            </div>
          </div>
        </div>
      );
    }

    return <p className="text-red-400 text-center py-10">Invalid tab selected or content not available.</p>;
  }


  if (sessionStatus === "unauthenticated") {
    router.push('/auth/signin'); // Or some public page
    return <LoadingIndicator message="Redirecting..." />;
  }
  if (session && session.user.role !== "LIBRARIAN") {
     router.push('/403'); // Forbidden page
     return <LoadingIndicator message="Access Denied. Redirecting..." />;
  }


  return (
    <Layout>
      <div className="flex min-h-screen bg-slate-900"> {/* Overall background for the page */}
        <LibrarianSidebar />
        <main className="flex-grow p-6 sm:p-8 text-slate-100 overflow-y-auto">
          {/* This main area gets the dark theme implicitly from the Layout or its own styling */}
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
}