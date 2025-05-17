// pages/auth/register.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaGraduationCap } from "react-icons/fa"; // Changed FaUserGraduate to FaGraduationCap for consistency
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

// pages/auth/register.tsx
// ... (imports)

export default function Register() {
 const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading("Creating your account...");

    try {
      const res = await fetch("/api/users/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "STUDENT" }),
      });

      const responseBodyText = await res.text();

      if (res.ok) {
        toast.success("Registration successful! Please login.", { id: toastId });
        router.push("/auth/signin");
      } else {
        let errorMessage = "Registration failed. Please try again.";
        try {
          const data = JSON.parse(responseBodyText);
          if (data && data.message) {
            errorMessage = data.message;
          }
        } catch {
          errorMessage = `Registration failed (Status: ${res.status} ${res.statusText})`;
        }
        toast.error(errorMessage, { id: toastId });
      }
    } catch (error) {
      toast.error("Registration failed. A network error occurred or the server is unreachable.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }
 

  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.5,
      },
    },
  };

  const inputGroupClasses = "relative group";
  const inputClasses = "block py-3 pl-12 pr-4 w-full text-sm text-slate-100 bg-slate-700/50 border border-slate-600 rounded-lg appearance-none focus:outline-none focus:ring-0 focus:border-sky-500 peer placeholder-transparent";
  const labelClasses = "absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-75 top-3.5 left-12 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-sky-400";
  const iconClasses = "absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 text-lg pointer-events-none";


  return (
    <div className="min-h-[calc(110vh-var(--header-height,80px))] flex items-stretch bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100">
      {/* Left side: form area */}
      <div className="w-full flex flex-col justify-center items-center md:w-1/2 lg:w-2/5 p-6 sm:p-8 md:p-12 relative z-10">
        <motion.div
          className="w-full max-w-md space-y-8"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-pink-400 to-purple-400 pb-2 flex items-center justify-center gap-3">
              <FaGraduationCap className="text-sky-400 text-4xl sm:text-5xl flex-shrink-0"/>
              Create Account
            </h1>
            <p className="text-center text-slate-300 text-md sm:text-lg">
              Join as a Student and start your learning journey.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-8 sm:p-10"
          >
            {/* Name Field */}
            <div className={inputGroupClasses}>
              <FaUser className={iconClasses} />
              <input
                type="text"
                name="name"
                id="name"
                className={inputClasses}
                placeholder="Full Name" // Placeholder is important for peer-placeholder-shown
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                autoComplete="name"
              />
              <label htmlFor="name" className={labelClasses}>
                Full Name
              </label>
            </div>

            {/* Email Field */}
            <div className={inputGroupClasses}>
              <FaEnvelope className={iconClasses} />
              <input
                type="email"
                name="email"
                id="email"
                className={inputClasses}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                autoComplete="email"
              />
              <label htmlFor="email" className={labelClasses}>
                Email address
              </label>
            </div>

            {/* Password Field */}
            <div className={inputGroupClasses}>
              <FaLock className={iconClasses} />
              <input
                type="password"
                name="password"
                id="password"
                className={inputClasses}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="new-password"
              />
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaUserPlus />
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
          <p className="text-center text-slate-300">
            Already have an account?{" "}
            <Link href="/auth/signin" legacyBehavior>
              <a className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                Login here
              </a>
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side: image */}
      <div
        className="hidden md:block md:w-1/2 lg:w-3/5 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGxpYnJhcnl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=1200&q=80')",
          // Consider a darker, more thematic image. Example:
          // backgroundImage: "url('/images/modern-library-study.jpg')", // Store in public/images
        }}
        aria-label="Students studying in a modern library"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900/30 md:from-transparent md:via-purple-950/30 md:to-black/60"></div>
        <div className="absolute bottom-10 left-10 p-6 bg-black/60 backdrop-blur-sm rounded-lg max-w-md">
            <h2 className="text-3xl font-bold text-white">Embark on Your Learning Adventure</h2>
            <p className="text-slate-200 mt-2 text-lg">
                Create your student account to access a world of knowledge, resources, and tools designed to help you succeed.
            </p>
        </div>
      </div>
    </div>
  );
}