import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

interface Borrowing {
  id: number;
  book: { title: string };
  user?: { name: string };
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  fine?: number;
}

export default function BorrowingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchBorrowings();
  }, [session]);

  async function fetchBorrowings() {
    setLoading(true);
    const res = await fetch("/api/borrowings");
    if (res.ok) {
      const data = await res.json();
      setBorrowings(data);
    } else {
      toast.error("Failed to fetch borrowings");
    }
    setLoading(false);
  }

  async function handleReturn(id: number) {
    if (!confirm("Mark this book as returned?")) return;
    const res = await fetch("/api/borrowings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowingId: id }),
    });
    if (res.ok) {
      toast.success("Book returned");
      fetchBorrowings();
    } else {
      toast.error("Return failed");
    }
  }

  if (!session) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Borrowings</h1>
      {loading ? (
        <p>Loading...</p>
      ) : borrowings.length === 0 ? (
        <p>No borrowings found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Book</th>
              {session.user.role !== "STUDENT" && <th className="border border-gray-300 p-2">User</th>}
              <th className="border border-gray-300 p-2">Borrowed At</th>
              <th className="border border-gray-300 p-2">Due Date</th>
              <th className="border border-gray-300 p-2">Returned At</th>
              <th className="border border-gray-300 p-2">Fine</th>
              {session.user.role !== "STUDENT" && <th className="border border-gray-300 p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {borrowings.map(b => (
              <tr key={b.id} className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2">{b.book.title}</td>
                {session.user.role !== "STUDENT" && <td className="border border-gray-300 p-2">{b.user?.name}</td>}
                <td className="border border-gray-300 p-2">{new Date(b.borrowedAt).toLocaleDateString()}</td>
                <td className="border border-gray-300 p-2">{new Date(b.dueDate).toLocaleDateString()}</td>
                <td className="border border-gray-300 p-2">{b.returnedAt ? new Date(b.returnedAt).toLocaleDateString() : "-"}</td>
                <td className="border border-gray-300 p-2">{b.fine ? `$${b.fine.toFixed(2)}` : "-"}</td>
                {session.user.role !== "STUDENT" && (
                  <td className="border border-gray-300 p-2">
                    {!b.returnedAt && (
                      <button
                        onClick={() => handleReturn(b.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Return
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
