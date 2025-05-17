import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout"; // Adjusted path assuming Layout is at ../../components
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/Dashboard/ConfirmationModal"; // Adjust path as needed

import {
  BookOpenIcon, // For Title input
  UserIcon, // For Author input
  QrCodeIcon, // For ISBN input
  TagIcon, // For Category input
  PhotoIcon, // For Cover URL input
  CheckCircleIcon, // For Available checkbox (or CheckIcon)
  PencilSquareIcon, // For page header
  ArrowPathIcon, // For loading states
  ExclamationTriangleIcon, // For not found/error
  TrashIcon, // For Delete button
  CheckIcon, // For Save button
} from "@heroicons/react/24/outline";

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: boolean;
  coverUrl?: string;
}

const inputBaseClasses = "block w-full text-white-700 pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed";
const labelBaseClasses = "block text-sm font-medium text-white-700 mb-1";

export default function EditBook() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: sessionStatus } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [pageLoading, setPageLoading] = useState(true); // For initial page data load
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    available: true,
    coverUrl: "",
  });
  const [isProcessing, setIsProcessing] = useState(false); // For save/delete operations

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") {
      setPageLoading(true);
      return;
    }
    if (!session) {
      router.replace("/auth/signin"); // Or your sign-in page
      return;
    }
    if (!["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
      router.replace("/403");
      return;
    }
    if (id && typeof id === 'string') { // Ensure id is a string before using
      fetchBook(id);
    } else if (id === undefined && sessionStatus === "authenticated") {
      // If ID is not present after session is loaded, it's an issue
      setPageLoading(false);
      setBook(null); // Indicate book not found due to missing ID
      toast.error("Book ID is missing in the URL.");
    }
  }, [id, session, sessionStatus, router]);

  async function fetchBook(bookId: string) {
    setPageLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Book not found.");
        throw new Error("Failed to load book data.");
      }
      const data = await res.json();
      setBook(data);
      setForm({
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        category: data.category,
        available: data.available,
        coverUrl: data.coverUrl || "",
      });
    } catch (error) {
      toast.error((error as Error).message);
      setBook(null); // Ensure book is null on error
    } finally {
      setPageLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== 'string') return;
    setIsProcessing(true);
    const toastId = toast.loading("Updating book...");
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const resDataText = await res.text();
      const resData = resDataText ? JSON.parse(resDataText) : null;

      if (!res.ok) {
        throw new Error(resData?.message || "Book update failed.");
      }
      toast.update(toastId, { render: "Book updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
      router.push("/books"); // Or wherever your books list is
    } catch (error) {
      toast.update(toastId, { render: (error as Error).message, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDeleteClick() {
    setIsModalOpen(true);
  }

  async function confirmDelete() {
    if (!id || typeof id !== 'string') return;
    setIsModalOpen(false); // Close modal immediately
    setIsProcessing(true); // General processing state
    const toastId = toast.loading("Deleting book...");

    try {
      const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
      // DELETE might return 204 No Content, which is fine and won't have JSON
      if (!res.ok && res.status !== 204) {
         const errorDataText = await res.text();
         const errorData = errorDataText ? JSON.parse(errorDataText) : null;
        throw new Error(errorData?.message || "Book deletion failed.");
      }
      toast.update(toastId, { render: "Book deleted successfully!", type: "success", isLoading: false, autoClose: 3000 });
      router.push("/books/new");
    } catch (error) {
      toast.update(toastId, { render: (error as Error).message, type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsProcessing(false);
    }
  }


  if (pageLoading || sessionStatus === 'loading') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
          <ArrowPathIcon className="w-12 h-12 animate-spin mb-4 text-blue-600" />
          <p className="text-xl">
            {sessionStatus === 'loading' ? "Authenticating..." : "Loading Book Data..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <ExclamationTriangleIcon className="w-16 h-16 mb-4" />
          <p className="text-2xl font-semibold">Book Not Found</p>
          <p className="text-gray-600 mt-2">The book you are looking for does not exist or could not be loaded.</p>
          <button
            onClick={() => router.push("/books")} // Adjust to your books list path
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Books List
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
       <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Book"
        message={`Are you sure you want to delete the book "${book?.title || 'this book'}"?\nThis action cannot be undone.`}
        confirmText="Delete Book"
        isDangerous={true}
        isProcessing={isProcessing} // Let the modal know if an operation is in progress
      />
      <div className="container mx-auto px-4 py-8  ">
        <div className="max-w-2xl mx-auto bg-slate-700 p-6 sm:p-8 shadow-xl rounded-lg">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <PencilSquareIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-white-800">Edit Book: {book.title}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className={labelBaseClasses}>Book Title</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <BookOpenIcon className="h-5 w-5 text-white-400" />
                </div>
                <input type="text" id="title" placeholder="e.g. The Great Gatsby" className={inputBaseClasses} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required disabled={isProcessing} />
              </div>
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className={labelBaseClasses}>Author</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-white-400" />
                </div>
                <input type="text" id="author" placeholder="e.g. F. Scott Fitzgerald" className={inputBaseClasses} value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required disabled={isProcessing} />
              </div>
            </div>

            {/* ISBN */}
            <div>
              <label htmlFor="isbn" className={labelBaseClasses}>ISBN</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <QrCodeIcon className="h-5 w-5 text-white-400" />
                </div>
                <input type="text" id="isbn" placeholder="e.g. 978-0743273565" className={inputBaseClasses} value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} required disabled={isProcessing} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={labelBaseClasses}>Category</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <TagIcon className="h-5 w-5 text-white-400" />
                </div>
                <input type="text" id="category" placeholder="e.g. Fiction, Novel" className={inputBaseClasses} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required disabled={isProcessing} />
              </div>
            </div>

            {/* Cover URL */}
            <div>
              <label htmlFor="coverUrl" className={labelBaseClasses}>Cover Image URL <span className="text-xs text-gray-500">(Optional)</span></label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <PhotoIcon className="h-5 w-5 text-white-400" />
                </div>
                <input type="url" id="coverUrl" placeholder="https://example.com/cover.jpg" className={inputBaseClasses} value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} disabled={isProcessing} />
              </div>
            </div>

            {/* Available Checkbox */}
            <div className="flex items-center">
                <input
                    id="available"
                    name="available"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    checked={form.available}
                    onChange={e => setForm({ ...form, available: e.target.checked })}
                    disabled={isProcessing}
                />
                <label htmlFor="available" className="ml-2 block text-sm text-white-800">
                    Mark as Available
                </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 pt-4 space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isProcessing}
                className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'} 
                            transition-colors`}
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete Book
              </button>
              <button
                type="submit" 
                disabled={isProcessing}
                className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} 
                            transition-colors`}
              >
                {isProcessing ? (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckIcon className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}