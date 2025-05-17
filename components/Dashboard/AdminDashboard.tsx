import Layout from "../../components/Layout";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { FaUsers, FaBook, FaExchangeAlt, FaArchive, FaClock, FaEdit, FaEye, FaListUl } from "react-icons/fa";

interface Stats {
  totalUsers: number;
  totalBooks: number;
  booksBorrowed: number;  
  booksAvailable: number;
  recentActivities: { id: number; description: string; createdAt: string }[];
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  createdAt: string; // Assuming API provides this for sorting
}

export default function AdminDashboardDisplay() {
  const { data: session } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      // If session is null (still loading or not authenticated), don't do anything yet.
      // useSession hook will update, and then this effect will run again.
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.replace("/403");
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, booksRes] = await Promise.all([
          fetch("/api/dashboard/admin"),
          fetch("/api/books?limit=5&orderBy=createdAt&orderDirection=desc") // Fetch 5 most recently added books
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          const statsError = await statsRes.json();
          console.error("Failed to fetch stats:", statsError.message || statsRes.statusText);
          setError(prev => prev ? `${prev}\nFailed to load dashboard statistics.` : 'Failed to load dashboard statistics.');
        }

        if (booksRes.ok) {
          const booksData = await booksRes.json();
          // API might return { books: [] } or just []
          setRecentBooks(Array.isArray(booksData) ? booksData : booksData.books || []);
        } else {
          const booksError = await booksRes.json();
          console.error("Failed to fetch recent books:", booksError.message || booksRes.statusText);
           setError(prev => prev ? `${prev}\nFailed to load recent books.` : 'Failed to load recent books.');
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("An unexpected error occurred while loading dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session, router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      < >
        <div className="flex justify-center items-center min-h-[calc(100vh-150px)] bg-slate-900">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-sky-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl text-slate-400">Loading Admin Dashboard...</p>
          </div>
        </div>
      </ >
    );
  }
  
  if (!session) { // This case handles if session is still null after loading attempt (e.g. not logged in)
    return (
        < >
            <div className="flex justify-center items-center min-h-[calc(100vh-150px)] bg-slate-900">
                 <p className="text-xl text-slate-400">Authenticating...</p>
            </div>
        </>
    )
  }


  return (
   <>
      <div className="bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 min-h-screen mt-0">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Admin Dashboard</h1>
       </div>

        {error && (
            <div className="bg-red-800/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline whitespace-pre-line"> {error}</span>
            </div>
        )}

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { title: "Total Users", value: stats.totalUsers, icon: <FaUsers /> , color: "sky"},
              { title: "Total Books", value: stats.totalBooks, icon: <FaBook /> , color: "emerald"},
              { title: "Books Borrowed", value: stats.booksBorrowed, icon: <FaExchangeAlt /> , color: "amber"},
              { title: "Books Available", value: stats.booksAvailable, icon: <FaArchive /> , color: "violet"},
            ].map(item => (
              <div key={item.title} className={`bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 border-${item.color}-500`}>
                <div className={`flex-shrink-0 w-12 h-12 bg-${item.color}-500/20 rounded-full flex items-center justify-center text-${item.color}-400 text-2xl`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{item.title}</p>
                  <p className="text-3xl font-semibold text-slate-100">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-slate-100 mb-5 flex items-center">
                <FaClock className="mr-3 text-slate-400" /> Recent Activities
            </h2>
            {stats && stats.recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentActivities.map(act => (
                  <li key={act.id} className="pb-4 border-b border-slate-700 last:border-b-0">
                    <p className="text-sm text-slate-300 mb-1">{act.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(act.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">No recent activities to display.</p>
            )}
          </div>

          {/* Recent Books List */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                    <FaBook className="mr-3 text-slate-400" /> Recently Added Books
                </h2>
                <Link href="/dashboard/admin?tab=books" legacyBehavior>
                    <a className="text-sm text-sky-400 hover:text-sky-300 hover:underline flex items-center">
                        Manage All Books <FaListUl className="ml-2"/>
                    </a>
                </Link>
            </div>
            {recentBooks.length === 0 && !loading && !error ? (
                 <p className="text-sm text-slate-500 italic py-5 text-center">No books found or added recently.</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">Author</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Available</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {recentBooks.map(book => (
                    <tr key={book.id} className="hover:bg-slate-700/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-100">{book.title}</div>
                        <div className="text-xs text-slate-400 md:hidden">{book.author}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 hidden md:table-cell">{book.author}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {book.available ? (
                          <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-700 text-green-100">Available</span>
                        ) : (
                          <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-700 text-red-100">Borrowed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                        <Link href={`/admin/books/${book.id}`} legacyBehavior>
                          <a className="p-1.5 text-sky-400 hover:text-sky-300" title="Edit Book">
                            <FaEdit className="inline h-4 w-4" />
                          </a>
                        </Link>
                         <Link href={`/books/${book.id}`} legacyBehavior>
                          <a className="p-1.5 text-slate-400 hover:text-slate-300 ml-2" title="View Book Details">
                            <FaEye className="inline h-4 w-4" />
                          </a>
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
      </div>
    </>
  );
}