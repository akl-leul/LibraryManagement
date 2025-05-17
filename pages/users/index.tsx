import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { exportToExcel, exportToPDF } from "../../lib/export";
import { toast } from "react-toastify";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    if (session.user.role !== "ADMIN") {
      router.replace("/403");
      return;
    }
    fetchUsers();
  }, [session]);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    } else {
      toast.error("Failed to fetch users");
    }
    setLoading(false);
  }

  function handleExportExcel() {
    exportToExcel(users, "users.xlsx");
  }

  function handleExportPDF() {
    const columns = ["ID", "Name", "Email", "Role", "Created At"];
    const data = users.map(u => [u.id, u.name, u.email, u.role, new Date(u.createdAt).toLocaleString()]);
    exportToPDF(columns, data, "users.pdf");
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="mb-4 flex justify-between">
        <Link href="/users/new" legacyBehavior>
          <a className="bg-green-600 text-white px-4 py-2 rounded">Add User</a>
        </Link>
        <div className="space-x-2">
          <button onClick={handleExportExcel} className="bg-blue-600 text-white px-4 py-2 rounded">Export Excel</button>
          <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded">Export PDF</button>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Role</th>
              <th className="border border-gray-300 p-2">Created At</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2">{user.id}</td>
                <td className="border border-gray-300 p-2">{user.name}</td>
                <td className="border border-gray-300 p-2">{user.email}</td>
                <td className="border border-gray-300 p-2">{user.role}</td>
                <td className="border border-gray-300 p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="border border-gray-300 p-2 space-x-2">
                  <Link href={`/users/${user.id}`} legacyBehavior>
                    <a className="text-blue-600 underline">Edit</a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
