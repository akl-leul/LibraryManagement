import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface UserProfile {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetch("/api/users/profile")
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to fetch user profile");
          }
          return res.json();
        })
        .then((data: UserProfile) => {
          setUser(data);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <p>You must be signed in to view your profile.</p>
        <button
          onClick={() => signIn()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 text-white rounded">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      {user ? (
        <ul>
          <li>
            <strong>ID:</strong> {user.id}
          </li>
          <li>
            <strong>Name:</strong> {user.name ?? "Not set"}
          </li>
          <li>
            <strong>Email:</strong> {user.email ?? "Not set"}
          </li>
          <li>
            <strong>Role:</strong> {user.role ?? "Not set"}
          </li>
        </ul>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
}
