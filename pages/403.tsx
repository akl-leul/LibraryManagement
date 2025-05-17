import Layout from "../components/Layout";

export default function Forbidden() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-red-600">403 - Forbidden</h1>
      <p>You do not have permission to access this page.</p>
    </Layout>
  );
}
