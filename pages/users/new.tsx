import { useEffect, useState } from "react";
import Layout from "../../components/Layout"; // Adjust path if needed
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  UserPlusIcon, // For page header and button
  UserCircleIcon, // For Name input
  EnvelopeIcon, // For Email input
  LockClosedIcon, // For Password input
  ShieldCheckIcon, // For Role select
  ArrowPathIcon, // For loading/submitting states
  ExclamationTriangleIcon, // For access denied/error
} from "@heroicons/react/24/outline"; // Or /solid for filled icons

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "LIBRARIAN" | "ADMIN"; // More specific role type
}

const inputBaseClasses = "block w-full pl-10 pr-3 py-2.5 text-gray-700 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed";
const selectBaseClasses = `${inputBaseClasses} appearance-none`; // For custom arrow on select
const labelBaseClasses = "block text-sm font-medium text-gray-700 mb-1";

export default function AddUser() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return; // Wait for session to load

    if (sessionStatus === "unauthenticated") {
      toast.error("Please sign in to add a user.");
      router.replace("/auth/signin"); // Or your login page
      return;
    }

    // Check role after session is confirmed to be authenticated
    if (session && session.user.role !== "ADMIN") {
      toast.warn("You don't have permission to access this page.");
      router.replace("/403"); // Or a generic access denied page
    }
  }, [session, sessionStatus, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Creating user...");

    try {
      const res = await fetch("/api/users/route", { // Make sure this is your correct API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const resDataText = await res.text(); // Get text first to handle empty responses
      const resData = resDataText ? JSON.parse(resDataText) : null;

      if (!res.ok) {
        throw new Error(resData?.message || "Failed to create user. Please check the details.");
      }

      toast.update(toastId, { render: "User created successfully!", type: "success", isLoading: false, autoClose: 3000 });
      // Assuming /users/route is actually your users list page, or maybe just /users
      // If /users/route is the API endpoint itself, you should redirect to a UI page like /admin/users or /users
      router.push("/dashboard/admin?tab=users"); // Example: redirect to an admin users tab
    } catch (error) {
      toast.update(toastId, { render: (error as Error).message, type: "error", isLoading: false, autoClose: 5000 });
      console.error("Failed to create user:", error);
    } finally {
      setIsSubmitting(false);
    }
  }


  // Show loading state while session is being determined
  if (sessionStatus === "loading") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
          <ArrowPathIcon className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
          <p className="text-xl">Loading session...</p>
        </div>
      </Layout>
    );
  }

  // If user is not ADMIN, they will be redirected by useEffect.
  // This provides a fallback UI while redirection is happening.
  if (sessionStatus === "authenticated" && session?.user.role !== "ADMIN") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-orange-500">
          <ExclamationTriangleIcon className="w-16 h-16 mb-4" />
          <p className="text-2xl font-semibold">Access Denied</p>
          <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  // Render the form if authenticated and authorized (ADMIN)
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 shadow-xl rounded-lg">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <UserPlusIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Add New User</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className={labelBaseClasses}>Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  className={inputBaseClasses}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className={labelBaseClasses}>Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="e.g. jane.doe@example.com"
                  className={inputBaseClasses}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={labelBaseClasses}>Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Min. 6 characters"
                  className={inputBaseClasses}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6} // Basic password length validation
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Role Select Field */}
            <div>
              <label htmlFor="role" className={labelBaseClasses}>User Role</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="role"
                  name="role"
                  className={selectBaseClasses}
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserFormData['role'] })}
                  required
                  disabled={isSubmitting}
                >
                  <option value="STUDENT">Student</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} 
                            transition-colors duration-150 ease-in-out`}
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <UserPlusIcon className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? "Creating User..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}