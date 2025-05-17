import { useSession } from "next-auth/react";
import Layout from "../components/Layout";
import { FaBookOpen, FaSignInAlt, FaUserPlus, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger animation of children
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <Layout>
      <motion.div
        className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,80px))] py-12 px-4 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <FaBookOpen className="text-sky-400 w-24 h-24 sm:w-28 sm:h-28 mb-8 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] hover:scale-110 transition-transform duration-300" />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-pink-400 to-purple-400 pb-2"
        >
          Welcome to the Digital Athenaeum
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg text-slate-300 mb-12 text-center max-w-2xl"
        >
          Your modern gateway to a universe of knowledge and stories. Explore, manage, and immerse yourself.
        </motion.p>

        {session ? (
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-8 max-w-md w-full text-center"
          >
            <p className="text-2xl text-slate-100 mb-3">
              Hello 👋, <span className="font-semibold text-sky-400">{session.user.name}</span>!
            </p>
            <p className="text-purple-400 font-medium mb-6 capitalize text-md">
              Logged in as <span className="font-semibold">{session.user.role}</span>
            </p>
            <p className="text-slate-300 mb-6">
              Dive into our collection, manage your borrowings, and enjoy your literary journey.
            </p>
            <Link href="/dashboard" legacyBehavior>
              <a className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-lg">
                Go to Dashboard <FaArrowRight />
              </a>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/60 backdrop-blur-md shadow-2xl rounded-xl p-8 max-w-md w-full text-center space-y-8"
          >
            <p className="text-xl text-slate-200">
              Unlock the world of books. Please sign in or create an account.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/auth/signin" legacyBehavior>
                <a className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-md w-full sm:w-auto">
                  <FaSignInAlt /> Login
                </a>
              </Link>
              <Link href="/auth/register" legacyBehavior>
                <a className="flex items-center justify-center gap-2 border-2 border-sky-400 text-sky-300 hover:bg-sky-400/20 hover:text-sky-200 px-6 py-3 rounded-lg font-semibold transition duration-300 ease-in-out transform hover:scale-105 w-full sm:w-auto">
                  <FaUserPlus /> Register
                </a>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}