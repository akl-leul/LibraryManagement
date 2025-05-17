import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus } from "react-icons/fa"; // Added icons
import { useRouter } from "next/router";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150";
  const mobileNavLinkClasses = "block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors duration-150";
  const buttonBaseClasses = "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150 flex items-center gap-2";


  const navLinks = (isMobile = false) => (
    <>
      {session ? (
        <>
          {session.user.role === "ADMIN" && (
            <Link href="/dashboard/admin" legacyBehavior>
              <a className={isMobile ? mobileNavLinkClasses : navLinkClasses}>Admin Dashboard</a>
            </Link>
          )}
          {session.user.role === "LIBRARIAN" && (
            <Link href="/dashboard/librarian" legacyBehavior>
              <a className={isMobile ? mobileNavLinkClasses : navLinkClasses}>Librarian Hub</a>
            </Link>
          )}
          {session.user.role === "STUDENT" && (
            <Link href="/dashboard/student" legacyBehavior>
              <a className={isMobile ? mobileNavLinkClasses : navLinkClasses}>My Dashboard</a>
            </Link>
          )}
           <Link href="/profile" legacyBehavior>
              <a className={`${isMobile ? mobileNavLinkClasses : navLinkClasses} inline-flex items-center gap-1.5`}>
                <FaUserCircle /> {session.user.name?.split(' ')[0] || 'Profile'}
              </a>
            </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`${buttonBaseClasses} ${isMobile ? 'w-full justify-start text-red-400 hover:bg-red-500/20' : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'}`}
          >
            <FaSignOutAlt /> Logout
          </button>
        </>
      ) : (
        status !== "loading" && ( // Don't show login/register if session is still loading
          <>
            <Link href="/auth/signin" legacyBehavior>
              <a className={`${buttonBaseClasses} ${isMobile ? 'w-full justify-start text-sky-400 hover:bg-sky-500/20' : 'text-sky-400 hover:bg-sky-500/10 hover:text-sky-300'}`}>
                <FaSignInAlt /> Login
              </a>
            </Link>
            <Link href="/auth/register" legacyBehavior>
              <a className={`${buttonBaseClasses} ${isMobile ? 'w-full justify-start bg-sky-600 text-white hover:bg-sky-500' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-md'}`}>
                <FaUserPlus /> Register
              </a>
            </Link>
          </>
        )
      )}
    </>
  );

  return (
    <nav
      className="bg-slate-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50"
      style={{ height: 'var(--header-height, 80px)' }} // Use CSS variable, fallback to 80px
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" legacyBehavior>
              <a className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-purple-400 hover:opacity-80 transition-opacity">
                LibSys Modern
              </a>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:ml-6">
            <div className="flex items-center space-x-1 lg:space-x-2">
              {navLinks()}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FaTimes className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FaBars className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[var(--header-height,80px)] left-0 w-full bg-slate-800 shadow-xl" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks(true)}
          </div>
        </div>
      )}
    </nav>
  );
}