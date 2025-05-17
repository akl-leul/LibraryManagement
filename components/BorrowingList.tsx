// components/BorrowingsTab.tsx
import React, { useState, useMemo, useEffect } from "react"; // Added useEffect
import {
  FaSearch,
  FaBookOpen,
  FaUser,
  FaCalendarAlt,
  FaCheckCircle,
  FaDollarSign,
  FaUndoAlt,
  FaExclamationCircle,
  FaChevronLeft, // For Previous button
  FaChevronRight, // For Next button
} from "react-icons/fa";
import toast from 'react-hot-toast';

interface Borrowing {
  id: number;
  user: { id: number; name: string };
  book: { id: number; title: string };
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fine?: number | null;
}

interface BorrowingsTabProps {
  borrowings: Borrowing[];
  onReturn: (borrowingId: number) => Promise<void>;
}

const ITEMS_PER_PAGE = 5; // Define how many items per page

export default function BorrowingsTab({ borrowings, onReturn }: BorrowingsTabProps) {
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to determine if a borrowing is overdue
  const isOverdue = (borrowing: Borrowing): boolean => {
    if (borrowing.returnedAt) return false;
    const dueDate = new Date(borrowing.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const filteredBorrowings = useMemo(() => {
    if (!borrowings) return [];
    const lowerSearch = search.toLowerCase();
    return borrowings.filter(b =>
      b.book.title.toLowerCase().includes(lowerSearch) ||
      b.user.name.toLowerCase().includes(lowerSearch) ||
      b.id.toString().includes(lowerSearch)
    );
  }, [borrowings, search]);

  // Reset to page 1 when search term or main borrowings data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, borrowings]);

  // Calculate items for the current page and total pages
  const paginatedBorrowings = useMemo(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    return filteredBorrowings.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredBorrowings, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredBorrowings.length / ITEMS_PER_PAGE);
  }, [filteredBorrowings.length]);


  const showConfirmModal = (borrowingId: number, bookTitle: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-700 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}
      >
        <div className="w-full">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5 text-sky-400">
              <FaCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-100">Confirm Return</p>
              <p className="mt-1 text-sm text-slate-300">
                Are you sure you want to mark "{bookTitle}" as returned?
              </p>
            </div>
          </div>
          <div className="flex mt-4 space-x-3 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setLoadingIds(prev => [...prev, borrowingId]);
                try {
                  await onReturn(borrowingId);
                  toast.success(`"${bookTitle}" marked as returned.`);
                } catch (error) {
                  console.error("Failed to return book:", error);
                  toast.error(`Failed to return "${bookTitle}". ${(error as Error).message || 'Please try again.'}`);
                } finally {
                  setLoadingIds(prev => prev.filter(i => i !== borrowingId));
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-sky-500"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    ), { duration: Infinity, id: `confirm-return-${borrowingId}` });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const tableHeaderClasses = "px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider border-b-2 border-slate-600 bg-slate-700/50 sticky top-0 z-10";
  const tableCellClasses = "px-4 py-3 whitespace-nowrap text-sm text-slate-200 border-b border-slate-700";

  const paginationButtonClasses = "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center";
  const activePaginationButtonClasses = "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500";
  const disabledPaginationButtonClasses = "bg-slate-600 text-slate-400 cursor-not-allowed";


  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl text-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-100">
          Borrowing List
        </h1>
        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Borrowings..."
            className="w-full sm:w-80 md:w-96 pl-12 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredBorrowings.length === 0 ? (
        <div className="text-center py-10">
          <FaBookOpen className="mx-auto text-4xl text-slate-500 mb-3" />
          <p className="text-slate-400 text-lg">
            {search ? "No borrowings match your search." : "No borrowing records found."}
          </p>
          {search && (
            <button
                onClick={() => setSearch("")}
                className="mt-4 text-sky-400 hover:text-sky-300 text-sm"
            >
                Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700 max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-280px)]"> {/* Adjusted max-h */}
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className={tableHeaderClasses}>ID</th>
                  <th scope="col" className={tableHeaderClasses}><FaBookOpen className="inline mr-1 mb-0.5"/> Book Title</th>
                  <th scope="col" className={tableHeaderClasses}><FaUser className="inline mr-1 mb-0.5"/> User</th>
                  <th scope="col" className={tableHeaderClasses}><FaCalendarAlt className="inline mr-1 mb-0.5"/> Borrowed</th>
                  <th scope="col" className={tableHeaderClasses}><FaCalendarAlt className="inline mr-1 mb-0.5"/> Due</th>
                  <th scope="col" className={tableHeaderClasses}><FaCheckCircle className="inline mr-1 mb-0.5"/> Returned</th>
                  <th scope="col" className={tableHeaderClasses}><FaDollarSign className="inline mr-1 mb-0.5"/> Fine</th>
                  <th scope="col" className={tableHeaderClasses}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {paginatedBorrowings.map(b => { // Use paginatedBorrowings here
                  const overdue = isOverdue(b);
                  return (
                    <tr
                      key={b.id}
                      className={`transition-colors
                                  ${overdue ? 'bg-rose-900/30 hover:bg-rose-800/50'
                                             : 'hover:bg-slate-700/50'}`}
                    >
                      <td className={tableCellClasses}>{b.id}</td>
                      <td className={tableCellClasses}>
                        {b.book.title}
                        {overdue && <FaExclamationCircle title="Overdue" className="inline ml-2 text-rose-400" />}
                      </td>
                      <td className={tableCellClasses}>{b.user.name}</td>
                      <td className={tableCellClasses}>{formatDate(b.borrowedAt)}</td>
                      <td className={`${tableCellClasses} ${overdue ? 'text-rose-300 font-semibold' : ''}`}>
                        {formatDate(b.dueDate)}
                      </td>
                      <td className={tableCellClasses}>{formatDate(b.returnedAt)}</td>
                      <td className={`${tableCellClasses} ${b.fine && b.fine > 0 ? 'text-red-400 font-semibold' : ''}`}>
                        {b.fine ? `$${b.fine.toFixed(2)}` : "-"}
                      </td>
                      <td className={`${tableCellClasses} text-center`}>
                        {!b.returnedAt ? (
                          <button
                            onClick={() => showConfirmModal(b.id, b.book.title)}
                            disabled={loadingIds.includes(b.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800
                                       bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500
                                       disabled:bg-slate-500 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Mark as Returned"
                          >
                            <FaUndoAlt className={`mr-1.5 ${loadingIds.includes(b.id) ? 'animate-spin' : ''}`} />
                            {loadingIds.includes(b.id) ? "Processing... " : "Return"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-700 text-green-100">
                            <FaCheckCircle className="mr-1.5" /> Returned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-400">
                Page <span className="font-semibold text-slate-200">{currentPage}</span> of <span className="font-semibold text-slate-200">{totalPages}</span>
                <span className="hidden sm:inline"> ({filteredBorrowings.length} items)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`${paginationButtonClasses} ${currentPage === 1 ? disabledPaginationButtonClasses : activePaginationButtonClasses}`}
                  aria-label="Previous Page"
                >
                  <FaChevronLeft className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`${paginationButtonClasses} ${(currentPage === totalPages || totalPages === 0) ? disabledPaginationButtonClasses : activePaginationButtonClasses}`}
                  aria-label="Next Page"
                >
                   <span className="hidden sm:inline">Next</span>
                  <FaChevronRight className="h-3.5 w-3.5 ml-1 sm:ml-2" />
                </button>
              </div>
            </div>
          )}
        </>
      )} 
    </div>
  );
}