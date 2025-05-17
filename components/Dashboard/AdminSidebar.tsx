// components/Dashboard/AdminSidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaTachometerAlt,
  FaUsers,      // Standard users icon
  FaBook,
  FaListAlt,    // Icon for borrowings/records
  FaShieldAlt ,
  FaFileExport  // Admin panel icon
} from "react-icons/fa";

interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType; // For React components like icons
}

const menuItems: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard/admin", icon: FaTachometerAlt },
  { key: "users", label: "Users", href: "/dashboard/admin?tab=users", icon: FaUsers },
  { key: "books", label: "Books", href: "/dashboard/admin?tab=books", icon: FaBook },
  { key: "borrowings", label: "Borrowings", href: "/dashboard/admin?tab=borrowings", icon: FaListAlt },
    { key: "export", label: "Export Books List", href: "/dashboard/admin?tab=export", icon: FaFileExport },
];

export default function AdminSidebar() {
  const router = useRouter();
  const currentPath = router.pathname; // Use pathname for more precise dashboard check
  const currentQueryTab = router.query.tab as string;
  let activeKey = currentQueryTab;

  // Determine active key for the base dashboard link
  if (!currentQueryTab && currentPath === "/dashboard/admin") {
    activeKey = "dashboard";
  }

  const linkBaseClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ease-in-out text-sm font-medium group"; // Added group for potential group-hover on icon
  const linkInactiveClasses = "text-slate-300 hover:bg-slate-700 hover:text-sky-300";
  const linkActiveClasses = "bg-sky-600 text-white shadow-md";

  return (
    // Using <aside> for semantic sidebar, fixed width
    // On smaller screens, the parent layout would need to handle how this sidebar and main content are displayed (e.g., main content scrolls, or sidebar becomes top bar)
    // For this component, we assume it has a dedicated space.
    <aside
      className="w-60 md:w-64  bg-slate-800 text-slate-100 min-h-screen p-4 flex flex-col border-r border-slate-700/50 shadow-lg"
      aria-label="Admin sidebar"
    >
      {/* Sidebar Header */}
      <div className="mb-6 pb-4 border-b border-slate-700 shrink-0">
        <Link href="/dashboard/admin" legacyBehavior>
          <a className="flex items-center gap-2.5 text-xl font-bold text-sky-400 hover:text-sky-300 transition-colors justify-center md:justify-start">
            <FaShieldAlt className="text-sky-500 text-2xl" />
            <span className="hidden md:inline">Admin Panel</span> {/* Show text on md+ */}
          </a>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.key}>
              <Link href={item.href} legacyBehavior>
                <a
                  className={`${linkBaseClasses} ${
                    activeKey === item.key ? linkActiveClasses : linkInactiveClasses
                  }`}
                  title={item.label} // Tooltip for icon-only view on small screens
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      activeKey === item.key ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="hidden md:inline">{item.label}</span> {/* Show text on md+ */}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Optional Sidebar Footer */}
      <div className="mt-auto pt-4 border-t border-slate-700 shrink-0">
        <p className="text-xs text-slate-500 text-center">© {new Date().getFullYear()} Library System</p>
      </div>
    </aside>
  );
}