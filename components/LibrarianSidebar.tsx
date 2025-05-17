// components/LibrarianSidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { FaTachometerAlt, FaBook, FaTasks } from "react-icons/fa"; // Import desired icons

// Define the type for menu items if using TypeScript
interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType; // Type for a React component (e.g., FaBook)
}

const menuItems: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard/librarian", icon: FaTachometerAlt },
  { key: "books", label: "Manage Books", href: "/dashboard/librarian?tab=books", icon: FaBook },
  { key: "borrowed", label: "Borrow Records", href: "/dashboard/librarian?tab=borrowed", icon: FaTasks },
  // Add more menu items here if needed
  // Example:
  // { key: "users", label: "Manage Users", href: "/dashboard/librarian?tab=users", icon: FaUsers },
];

export default function LibrarianSidebar() {
  const router = useRouter();

  // Determine the active key for highlighting
  // If router.query.tab exists, use that.
  // If not, and the current path is the base librarian dashboard, then 'dashboard' is active.
  let activeKey = router.query.tab as string; // Cast to string
  if (!router.query.tab && router.pathname === "/dashboard/librarian") {
    activeKey = "dashboard";
  }

  const linkBaseClasses = "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors duration-150 ease-in-out text-sm";
  const linkInactiveClasses = "text-slate-300 hover:bg-slate-700 hover:text-sky-300";
  const linkActiveClasses = "bg-sky-600 text-white font-semibold shadow-md";

  return (
    <aside className="w-60 bg-slate-800 text-slate-100 min-h-screen p-4 border-r border-slate-700/50 shadow-lg">
      {/* Optional: Sidebar Header */}
      <div className="mb-6 pb-4 border-b border-slate-700">
        <Link href="/dashboard/librarian" legacyBehavior>
          <a className="text-xl font-bold text-sky-400 hover:text-sky-300 transition-colors text-center block">
            Librarian Panel
          </a>
        </Link>
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.key}>
              <Link href={item.href} legacyBehavior>
                <a
                  className={`${linkBaseClasses} ${
                    activeKey === item.key ? linkActiveClasses : linkInactiveClasses
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Optional: Sidebar Footer or extra links */}
      {/* <div className="mt-auto pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">© {new Date().getFullYear()} Library System</p>
      </div> */}
    </aside>
  );
}