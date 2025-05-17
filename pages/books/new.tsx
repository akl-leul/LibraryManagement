import { useEffect, useState } from "react";
import Layout from "../../components/Layout"; // Assuming Layout provides basic page structure
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  BookOpenIcon, // For header
  PencilIcon, // For Title (or SparklesIcon)
  UserIcon, // For Author
  QrCodeIcon, // For ISBN
  TagIcon, // For Category
  PhotoIcon, // For Cover URL
  PlusIcon, // For Create button
  ArrowPathIcon, // For loading/submitting
  ExclamationTriangleIcon // For access denied/error
} from "@heroicons/react/24/outline"; // Or /solid

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  category: string;
  coverUrl: string;
}

export default function AddBook() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<BookFormData>({
    title: "",
    author: "",
    isbn: "",
    category: "",
    coverUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Wait until session status is determined

    if (status === "unauthenticated") {
      toast.error("Please sign in to add a book.");
      router.replace("/auth/signin"); // Or your designated sign-in page
      return;
    }

    if (session && !["ADMIN", "LIBRARIAN"].includes(session.user.role)) {
      toast.warn("You don't have permission to access this page.");
      router.replace("/403"); // Or a generic "access denied" page
    }
  }, [session, status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Book created successfully!");
        router.push("/books"); // Navigate to the books list or the new book's page
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to create book. Please check the details and try again." }));
        toast.error(errorData.message || "Failed to create book. An unknown error occurred.");
        console.error("Failed to create book:", errorData);
      }
    } catch (error) {
      toast.error("An error occurred while creating the book.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while session is being determined
  if (status === "loading") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
          <ArrowPathIcon className="w-12 h-12 animate-spin mb-4" />
          <p className="text-xl">Loading session...</p>
        </div>
      </Layout>
    );
  }

  // If user is not authenticated or not authorized, they will be redirected by useEffect.
  // This provides a fallback UI while redirection is happening or if it fails.
  if (!session || (session && !["ADMIN", "LIBRARIAN"].includes(session.user.role))) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-orange-500">
          <ExclamationTriangleIcon className="w-16 h-16 mb-4" />
          <p className="text-2xl font-semibold">Access Denied</p>
          <p className="text-gray-600 mt-2">Verifying permissions or redirecting...</p>
        </div>
      </Layout>
    );
  }

  // Render the form if authenticated and authorized
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-slate-700 p-8 shadow-xl rounded-lg">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <BookOpenIcon className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-white-800">Add New Book</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white-700 mb-1">
                Book Title
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <PencilIcon className="h-5 w-5 text-white-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g. The Great Gatsby"
                  className="block w-full pl-10 pr-3 py-2.5 text-white-700 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Author Field */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-white-700 mb-1">
                Author
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserIcon className="h-5 w-5 text-white-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="author"
                  name="author"
                  placeholder="e.g. F. Scott Fitzgerald"
                  className="block w-full pl-10 pr-3 py-2.5 text-white-700 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* ISBN Field */}
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-white-700 mb-1">
                ISBN
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <QrCodeIcon className="h-5 w-5 text-white-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  placeholder="e.g. 978-0743273565"
                  className="block w-full pl-10 pr-3 py-2.5 text-white-700 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  value={form.isbn}
                  onChange={e => setForm({ ...form, isbn: e.target.value })}
                  // ISBN is often required, but make it optional if your system allows
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-white-700 mb-1">
                Category
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <TagIcon className="h-5 w-5 text-white-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="category"
                  name="category"
                  placeholder="e.g. Fiction, Science, History"
                  className="block w-full pl-10 pr-3 py-2.5 text-white-700 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  // Category might be optional or required depending on your schema
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Cover URL Field */}
            <div>
              <label htmlFor="coverUrl" className="block text-sm font-medium text-white-700 mb-1">
                Cover Image URL <span className="text-xs text-white-500">(Optional)</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <PhotoIcon className="h-5 w-5 text-white-400" aria-hidden="true" />
                </div>
                <input
                  type="url" // Using type="url" provides some basic browser validation
                  id="coverUrl"
                  name="coverUrl"
                  placeholder="e.g. https://example.com/cover.jpg"
                  className="block w-full pl-10 pr-3 py-2.5 text-white-700 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                  value={form.coverUrl}
                  onChange={e => setForm({ ...form, coverUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'} 
                            transition-colors duration-150 ease-in-out`}
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <PlusIcon className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? "Creating Book..." : "Create Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}