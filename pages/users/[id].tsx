import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout"; // Assuming Layout provides basic page structure
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import {
  PencilSquareIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  LockClosedIcon, // For password
  EyeIcon,        // To show password
  EyeSlashIcon,   // To hide password
  CheckIcon,
  TrashIcon,
  ArrowPathIcon, // For loading
  ExclamationTriangleIcon, // For errors or not found
} from "@heroicons/react/24/outline"; // Or /solid for filled icons
// REMOVE: import Id from "../api/users/[id]"; // This import is incorrect and not needed

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Form state now includes password
interface UserFormState {
  name: string;
  email: string;
  role: "STUDENT" | "LIBRARIAN" | "ADMIN"; // More specific type
  password?: string; // Password is optional for update
}

const inputBaseClasses = "block w-full pl-10 text-gray-700 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed";
const labelBaseClasses = "block text-sm font-medium text-gray-700 mb-1";


export default function EditUser() {
  const router = useRouter();
  const { id: queryId } = router.query; // Renamed to queryId to avoid conflict with 'id' variable
  const { data: session, status: sessionStatus } = useSession(); // Added sessionStatus
  const [user, setUser] = useState<User | null>(null);
  const [pageLoading, setPageLoading] = useState(true); // For initial page data load
  const [form, setForm] = useState<UserFormState>({ name: "", email: "", role: "STUDENT", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const id = typeof queryId === 'string' ? queryId : null; // Ensure id is string or null

  useEffect(() => {
    if (sessionStatus === "loading") {
        setPageLoading(true); // Keep loading if session is still loading
        return;
    }
    if (!session) {
        router.replace("/auth/signin"); // Or your login page
        return;
    }
    if (session.user.role !== "ADMIN") {
      router.replace("/403");
      return;
    }
    if (id) {
        fetchUser(id);
    } else if (id === undefined && sessionStatus === "authenticated") {
        // If ID is not present after session is loaded
        setPageLoading(false);
        setUser(null);
        toast.error("User ID is missing in the URL.");
    }
  }, [id, session, sessionStatus, router]);

  async function fetchUser(userId: string) {
    setPageLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`); // Use userId from params
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setForm({
            name: data.name,
            email: data.email,
            role: data.role,
            password: "" // Keep password field blank initially for security
        });
      } else {
        toast.error("Failed to load user data.");
        setUser(null);
      }
    } catch (error) {
      toast.error("An error occurred while fetching user data.");
      console.error("Fetch user error:", error);
      setUser(null);
    } finally {
      setPageLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !id) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating user...");

    // Prepare the data to send. Only include password if it's entered.
    const payload: Partial<UserFormState> = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    if (form.password && form.password.trim() !== "") {
      if (form.password.length < 6) {
        toast.update(toastId, { render: "Password must be at least 6 characters long.", type: "error", isLoading: false, autoClose: 5000 });
        setIsSubmitting(false);
        return;
      }
      payload.password = form.password;
    }

    try {
      // Use the 'id' from router.query (which we've ensured is a string or null)
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resDataText = await res.text();
      const resData = resDataText ? JSON.parse(resDataText) : null;

      if (res.ok) {
        toast.update(toastId, { render: "User updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
        // Consider redirecting to a general users list or the admin user management page
        router.push("/dashboard/admin?tab=users"); // Example redirect
      } else {
        throw new Error(resData?.message || "Update failed. Please try again.");
      }
    } catch (error) {
      toast.update(toastId, { render: (error as Error).message, type: "error", isLoading: false, autoClose: 5000 });
      console.error("Update user error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (isDeleting || !id) return;
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    const toastId = toast.loading("Deleting user...");
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (res.ok || res.status === 204) { // 204 No Content is also a success for DELETE
        toast.update(toastId, { render: "User deleted successfully!", type: "success", isLoading: false, autoClose: 3000 });
        router.push("/dashboard/admin?tab=users"); // Example redirect
      } else {
        const errorData = await res.json().catch(() => ({ message: "Delete failed. Please try again." }));
        throw new Error(errorData.message || "Delete failed. Please try again.");
      }
    } catch (error) {
      toast.update(toastId, { render: (error as Error).message, type: "error", isLoading: false, autoClose: 5000 });
      console.error("Delete user error:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (pageLoading || sessionStatus === 'loading') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
          <ArrowPathIcon className="w-12 h-12 animate-spin mb-4 text-blue-600" />
          <p className="text-xl">
             {sessionStatus === 'loading' ? "Authenticating..." : "Loading User Data..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
          <ExclamationTriangleIcon className="w-16 h-16 mb-4" />
          <p className="text-2xl font-semibold">User Not Found</p>
          <p className="text-gray-600 mt-2">The user you are looking for does not exist or could not be loaded.</p>
          <button
            onClick={() => router.push("/admin/users?tab=users")} // Example redirect
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Users List
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 shadow-xl rounded-lg">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
            <PencilSquareIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Edit User: {user.name}</h1>
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
                  placeholder="e.g. John Doe"
                  className={inputBaseClasses}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={isSubmitting || isDeleting}
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
                  placeholder="e.g. user@example.com"
                  className={inputBaseClasses}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={labelBaseClasses}>
                New Password <span className="text-xs text-gray-500">(Leave blank to keep current)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Min. 6 characters"
                  className={`${inputBaseClasses} pr-10`} // Add pr-10 for eye icon
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  minLength={form.password ? 6 : undefined} // Only enforce minLength if password is being set
                  disabled={isSubmitting || isDeleting}
                  autoComplete="new-password" // Important for password managers
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting || isDeleting}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
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
                  className="block w-full text-gray-700 pl-10 pr-10 py-2.5 border border-gray-300 bg-white rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none transition-colors disabled:bg-gray-100"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as UserFormState['role'] })}
                  required
                  disabled={isSubmitting || isDeleting}
                >
                  <option value="STUDENT">Student</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 pt-4 space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${(isDeleting || isSubmitting) ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'} transition-colors`}
              >
                {isDeleting ? (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <TrashIcon className="w-5 h-5 mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Delete User"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                            ${(isSubmitting || isDeleting) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors`}
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <CheckIcon className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}