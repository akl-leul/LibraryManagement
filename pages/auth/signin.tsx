// pages/auth/signin.tsx
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Attempting to log in...");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.error) {
        toast.error(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error, { id: toastId });
      } else if (res?.ok) {
        toast.success("Logged in successfully!", { id: toastId });
        // Redirect to intended page or home
        const callbackUrl = router.query.callbackUrl as string || "/";
        router.push(callbackUrl);
      } else {
        // Should not happen if res.error or res.ok is always set by next-auth
        toast.error("An unknown error occurred.", { id: toastId });
      }
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error("Login failed. Please try again later.", { id: toastId });
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

  return (
    <div className="min-h-[calc(100vh-var(--header-height,80px))] flex items-stretch bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100">
      {/* Left side: form area */}
      <div className="w-full flex flex-col justify-center items-center md:w-1/2 lg:w-2/5 p-6 sm:p-8 md:p-12 relative z-10">
        <motion.div
          className="w-full max-w-md space-y-8"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-pink-400 to-purple-400 pb-2">
              Welcome Back!
            </h1>
            <p className="text-center text-slate-300 text-md sm:text-lg">
              Sign in to access your library account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-8 sm:p-10"
          >
            <div className="relative">
              <FaEnvelope className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 text-lg" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 text-lg" />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                autoComplete="current-password"
              />
            </div>
            {/* Optional: Remember me & Forgot password */}
            {/* <div className="flex items-center justify-between text-sm">
              <label htmlFor="remember-me" className="flex items-center text-slate-400">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-sky-500 border-slate-500 rounded focus:ring-sky-500" />
                <span className="ml-2">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" legacyBehavior>
                <a className="font-medium text-sky-400 hover:text-sky-300">
                  Forgot password?
                </a>
              </Link>
            </div> */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaSignInAlt />
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="text-center text-slate-300">
            Don't have an account?{" "}
            <Link href="/auth/register" legacyBehavior>
              <a className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                Register here
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
            "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGlicmFyeXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=1200&q=80')",
            // Consider a darker, more thematic image. Example:
            // backgroundImage: "url('/images/modern-library-dark.jpg')", // Store in public/images
        }}
        aria-label="Modern library interior"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900/30 md:from-transparent md:via-purple-950/30 md:to-black/60"></div>
         {/* Optional: Add some text or logo over the image
         <div className="absolute bottom-10 left-10 p-6 bg-black/50 rounded-lg">
            <h2 className="text-3xl font-bold text-white">Unlock Knowledge</h2>
            <p className="text-slate-300 mt-2">Your portal to endless reading.</p>
        </div> */}
      </div>
    </div>
  );
}