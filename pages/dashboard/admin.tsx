// pages/dashboard/admin.tsx
import Layout from "../../components/Layout";
import AdminSidebar from "../../components/Dashboard/AdminSidebar"; // Ensure this is dark-themed
import BorrowingsTab from "@/components/BorrowingList"; // Renamed for clarity from previous
import BorrowingForm from "@/components/BookForm"; // Assuming this is the form to ADD a borrowing
import ExportBooks from "@/components/ExportBooks";
import AdminDashboardDisplay from "@/components/Dashboard/AdminDashboard";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { exportToExcel } from "@/lib/export";
import {exportToPDF} from "@/lib/export";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify"; // Using react-toastify as imported
import 'react-toastify/dist/ReactToastify.css'; // Import css for react-toastify

import {
  FaChartBar, FaBook, FaUsers, FaArchive, FaUserPlus, FaPlus, FaSearch, FaSpinner,
  FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaUniversity, FaIdCard, FaFileExport
} from "react-icons/fa";

// --- Interfaces (Keep as is or adjust based on your actual API responses) ---
interface Stats {
  totalUsers: number;
  totalBooks: number;
  booksBorrowed: number;
  booksAvailable: number;
  recentActivities: { id: number | string; description: string; createdAt: string }[];
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  createdAt: string; // Assuming API sends this
  coverUrl?: string;
}
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string; // Assuming API sends this
}
interface Borrowing {
  id: number;
  user: { id: number; name: string };
  book: { id: number; title: string; isbn?: string };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  fine?: number | null;
}

// --- Reusable UI Components (Internal or move to separate files) ---
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
  <div className="flex flex-wrap justify-between items-center mb-6 pb-3 border-b border-slate-700">
    <h1 className="text-2xl sm:text-3xl font-bold text-sky-400 flex items-center">
      {Icon && <Icon className="mr-3 text-sky-500 text-3xl" />}
      {title}
    </h1>
    <div>{children}</div>
  </div>
);

const inputBaseClasses = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out text-sm";
const selectBaseClasses = `${inputBaseClasses} appearance-none`; // For select dropdowns
const buttonBaseClasses = "flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm";
const primaryButtonClasses = `${buttonBaseClasses} bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white focus:ring-sky-500`;
const secondaryButtonClasses = `${buttonBaseClasses} bg-slate-600 hover:bg-slate-500 text-slate-100 focus:ring-slate-400`;
const dangerButtonClasses = `${buttonBaseClasses} bg-red-600 hover:bg-red-500 text-white focus:ring-red-500`;

const LoadingIndicator: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <FaSpinner className="animate-spin text-4xl mb-3 text-sky-500" />
    <p>{message}</p>
  </div>
);
// --- End Reusable UI Components ---


export default function AdminDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const tab = (router.query.tab as string) || "dashboard";

  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);

  const [loadingData, setLoadingData] = useState(true); // Single loading state for primary tab data

  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [submittingUser, setSubmittingUser] = useState(false);

  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", category: "", coverUrl: "" });
  const [submittingBook, setSubmittingBook] = useState(false);
  const [updatingBookId, setUpdatingBookId] = useState<number | null>(null); // For book availability toggle

  const [searchBook, setSearchBook] = useState("");
  const [searchUser, setSearchUser] = useState("");


  // Fetch data based on tab
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    if (session.user.role !== "ADMIN") {
      router.replace("/403");
      return;
    }

    setLoadingData(true); // Set loading before fetch
    if (tab === "dashboard") fetchStats();
    else if (tab === "books") fetchBooks();
    else if (tab === "users") fetchUsers();
    else if (tab === "borrowings") fetchAllBorrowings(); // Renamed to distinguish from a local fetchBorrowings
    else setLoadingData(false); // If tab is invalid, stop loading
  }, [session, sessionStatus, tab, router]);

  async function fetchData(url: string, setData: Function, errorMessage: string) {
    // setLoadingData(true); // Already set in useEffect
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: errorMessage }));
        throw new Error(errData.message || errorMessage);
      }
      const data = await res.json();
      // Handle APIs that return { data: [...] } or just [...]
      if (url.includes("/api/books") && data.books) setData(data.books);
      else setData(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      toast.error((error as Error).message);
      setData([]); // Set to empty array on error
    } finally {
      setLoadingData(false);
    }
  }

  const fetchStats = () => fetchData("/api/dashboard/admin", setStats, "Failed to load dashboard stats");
  const fetchBooks = () => fetchData("/api/books", setBooks, "Failed to load books");
  const fetchUsers = () => fetchData("/api/users/route", setUsers, "Failed to load users");
  const fetchAllBorrowings = () => fetchData("/api/borrowings", setBorrowings, "Failed to load borrowings");


  async function handleApiSubmit(
    e: React.FormEvent | null,
    url: string,
    method: string,
    body: any,
    setSubmitting: Function,
    successMessage: string,
    resetForm?: Function,
    onSuccess?: Function
  ) {
    if (e) e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Processing...");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resData = await res.json().catch(() => null); // Try to parse JSON, but don't fail if no body
      if (!res.ok) {
        throw new Error(resData?.message || `Operation failed (Status: ${res.status})`);
      }
      toast.success(successMessage, { autoClose: 3000, toastId, updateId: toastId });
      if (resetForm) resetForm();
      if (onSuccess) await onSuccess();
    } catch (error) {
      toast.error((error as Error).message, { autoClose: 5000, toastId, updateId: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  const handleAddUser = (e: React.FormEvent) => handleApiSubmit(e, "/api/users/route", "POST", userForm, setSubmittingUser, "User added successfully!", () => setUserForm({ name: "", email: "", password: "", role: "STUDENT" }), fetchUsers);
  const handleAddBook = (e: React.FormEvent) => handleApiSubmit(e, "/api/books", "POST", bookForm, setSubmittingBook, "Book added successfully!", () => setBookForm({ title: "", author: "", isbn: "", category: "", coverUrl: "" }), fetchBooks);

  // For markReturned, the success/error toasts are handled by BorrowingList's confirm modal.
  // This function just needs to make the API call and refresh data.
  async function markReturned(borrowingId: number) {
    try {
      const res = await fetch(`/api/borrowings/${borrowingId}`, { // Assuming specific endpoint
        method: "PUT",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({message: "Failed to mark as returned"}));
        throw new Error(err.message);
      }
      fetchAllBorrowings(); // Refresh borrowings
      // Optionally refresh books if availability changes:
      if (tab === 'books' || tab === 'dashboard') fetchBooks();
      if (tab === 'dashboard') fetchStats();
    } catch (error) {
      console.error("Error marking returned (AdminDashboard):", error);
      throw error; // Re-throw to be caught by BorrowingList's modal
    }
  }

   // Update book availability handler (for the checkbox on Books tab)
   async function handleToggleBookAvailability(book: Book) {
    setUpdatingBookId(book.id);
    const newAvailability = !book.available;
    const toastId = toast.loading(`Updating ${book.title}...`);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: newAvailability }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update book availability." }));
        throw new Error(err.message);
      }
      toast.success(`"${book.title}" marked as ${newAvailability ? 'Available' : 'Unavailable'}`, { id: toastId, updateId: toastId });
      // Update local state immediately for better UX, then refetch
      setBooks(prevBooks => prevBooks.map(b => b.id === book.id ? { ...b, available: newAvailability } : b));
      // fetchBooks(); // Or rely on the optimistic update
    } catch (error) {
      toast.error((error as Error).message, { id: toastId, updateId: toastId });
    } finally {
      setUpdatingBookId(null);
    }
  }


  const filteredBooks = useMemo(() => {
    if (!searchBook) return books;
    const q = searchBook.toLowerCase();
    return books.filter(book => book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q) || book.isbn.toLowerCase().includes(q) || book.category.toLowerCase().includes(q));
  }, [books, searchBook]);

  const filteredUsers = useMemo(() => {
    if (!searchUser) return users;
    const q = searchUser.toLowerCase();
    return users.filter(user => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.role.toLowerCase().includes(q));
  }, [users, searchUser]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
      router.replace("/403");
      return;
    }
    fetchBooks();
  }, [session]);

  
 

  function renderContent() {
    if (sessionStatus === "loading" || (session && loadingData && !stats && !books.length && !users.length && !borrowings.length)) {
      return <LoadingIndicator message={sessionStatus === "loading" ? "Authenticating..." : "Loading data..."} />;
    }
    if (!session || session.user.role !== "ADMIN") {
      // This should ideally be caught by useEffect redirect, but as a fallback:
      return <LoadingIndicator message="Access Denied. Please login as Admin." />;
    }

    switch (tab) {
      case "dashboard":
        if (loadingData && !stats) return <LoadingIndicator message="Loading dashboard..." />;
        if (!stats) return <p className="text-center text-red-400 py-10">No dashboard statistics available or failed to load.</p>;
        return (
           <AdminDashboardDisplay/>
        );

      case "books":
        return (
          <div className="space-y-8">
            <SectionTitle title="Manage Books Collection" icon={FaBook} />
            {/* Add Book Form */}
            <form onSubmit={handleAddBook} className="bg-slate-700/50 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Add New Book</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Title" className={inputBaseClasses} value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required disabled={submittingBook} />
                <input type="text" placeholder="Author" className={inputBaseClasses} value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required disabled={submittingBook} />
                <input type="text" placeholder="ISBN" className={inputBaseClasses} value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} required disabled={submittingBook} />
                <input type="text" placeholder="Category" className={inputBaseClasses} value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} required disabled={submittingBook} />
              </div>
              <input type="text" placeholder="Cover URL (optional)" className={inputBaseClasses} value={bookForm.coverUrl} onChange={e => setBookForm({ ...bookForm, coverUrl: e.target.value })} disabled={submittingBook} />
              <button type="submit" className={`${primaryButtonClasses} w-full sm:w-auto`} disabled={submittingBook}>
                <FaPlus /> {submittingBook ? "Adding Book..." : "Add Book"}
              </button>
            </form>

            {/* Books List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-slate-100">Current Books</h3>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search books..." className={`${inputBaseClasses} pl-10`} value={searchBook} onChange={e => setSearchBook(e.target.value)} />
                </div>
              </div>
              {loadingData && !books.length ? ( <LoadingIndicator message="Loading books..." />
              ) : filteredBooks.length === 0 ? ( <p className="text-slate-400 text-center py-10">{searchBook ? "No books match your search." : "No books in the collection yet."}</p>
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
                              onClick={() => handleToggleBookAvailability(book)}
                              disabled={updatingBookId === book.id}
                              className={`p-1.5 rounded-full transition-colors ${book.available ? 'bg-green-500/30 hover:bg-green-500/50' : 'bg-red-500/30 hover:bg-red-500/50'}`}
                              title={book.available ? "Mark as Unavailable" : "Mark as Available"}
                            >
                              {updatingBookId === book.id ? <FaSpinner className="animate-spin text-white w-4 h-4"/> : book.available ? <FaCheckCircle className="text-green-400 w-4 h-4" /> : <FaTimesCircle className="text-red-400 w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300 text-center space-x-2">
                            <Link href={`/books/${book.id}`} legacyBehavior>
                                <a className="text-sky-400 hover:text-sky-300" title="Edit Book"><FaEdit /></a>
                            </Link>
                            {/* Add delete button/logic here if needed */}
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

      case "users":
        return (
          <div className="space-y-8">
            <SectionTitle title="Manage Users" icon={FaUsers} />
            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="bg-slate-700/50 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Add New User</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" className={inputBaseClasses} value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required disabled={submittingUser} />
                <input type="email" placeholder="Email Address" className={inputBaseClasses} value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required disabled={submittingUser} />
                <input type="password" placeholder="Password" className={inputBaseClasses} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required disabled={submittingUser} />
                <select className={selectBaseClasses} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} disabled={submittingUser}>
                  <option value="STUDENT">Student</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button type="submit" className={`${primaryButtonClasses} w-full sm:w-auto`} disabled={submittingUser}>
                <FaUserPlus /> {submittingUser ? "Adding User..." : "Add User"}
              </button>
            </form>

            {/* Users List */}
            <div>
               <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-semibold text-slate-100">Registered Users</h3>
                 <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search users..." className={`${inputBaseClasses} pl-10`} value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                </div>
              </div>
              {loadingData && !users.length ? ( <LoadingIndicator message="Loading users..." />
              ) : filteredUsers.length === 0 ? ( <p className="text-slate-400 text-center py-10">{searchUser ? "No users match your search." : "No users registered yet."}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700">
                  <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700">
                      <tr>
                        {["Name", "Email", "Role", "Joined", "Actions"].map(header => (
                          <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-100 whitespace-nowrap">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-200">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                user.role === 'ADMIN' ? 'bg-red-500/30 text-red-300' :
                                user.role === 'LIBRARIAN' ? 'bg-sky-500/30 text-sky-300' :
                                'bg-green-500/30 text-green-300'
                            }`}>
                                {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-slate-300 text-center space-x-2">
                            <Link href={`/users/${user.id}`} legacyBehavior>
                                <a className="text-sky-400 hover:text-sky-300" title="Edit User"><FaEdit /></a>
                            </Link>
                             {/* Add delete button/logic here if needed */}
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

      case "borrowings":
        return (
          <div className="space-y-10">
            <SectionTitle title="System Borrowing Records" icon={FaArchive} />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    {/* Form to add a new borrowing record by Admin/Librarian */}
                    <BorrowingForm onBorrowingAdded={fetchAllBorrowings} />
                </div>
                <div className="lg:col-span-2">
                    {loadingData && !borrowings.length ? (
                        <LoadingIndicator message="Loading borrowing records..." />
                    ) : (
                        <BorrowingsTab borrowings={borrowings} onReturn={markReturned} />
                    )}
                </div>
            </div>
          </div>
        );


        case "export":
          return(

            <ExportBooks/>
          );
      default:
        return <p className="text-center text-red-400 py-10">Invalid tab selected or content not available.</p>;
    }
  }

  return (
    <Layout>
      {/* ToastContainer for react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // Or "light" or "colored"
      />
      <div className="flex min-h-screen bg-slate-900"> 
        <AdminSidebar />
        <main className="flex-grow p-6 sm:p-8 text-slate-100 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
}