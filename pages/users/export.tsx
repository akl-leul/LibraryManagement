import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import Layout from "../../components/Layout"; // Assuming you have a Layout component
import * as XLSX from 'xlsx'; // SheetJS
import { saveAs } from 'file-saver'; // To trigger file download
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon // Adding CheckCircleIcon for success state
} from '@heroicons/react/24/outline'; // Or /solid

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  // Add other fields you want to export from your Prisma User model
  createdAt?: string; // Assuming these fields exist and you might want to export them
  updatedAt?: string;
}

// Define possible states for the export process
type ExportStatus = 'idle' | 'checking_auth' | 'fetching_data' | 'generating_file' | 'downloading' | 'success' | 'error';

const ExportPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Function to generate and save the Excel file
  const exportToExcel = (data: User[], filename = 'users_export') => {
    setExportStatus('generating_file');
    try {
      // Map data to the desired structure for the Excel sheet
      const worksheetData = data.map(user => ({
        'User ID': user.id,
        'Full Name': user.name,
        'Email Address': user.email,
        'Role': user.role,
        // Add other fields here
        'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
        'Updated At': user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users'); // Sheet name

      // Write the workbook to a binary array
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Create a Blob
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' }); // Or 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      // Generate filename with date
      const today = new Date();
      const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const finalFilename = `${filename}_${dateString}.xlsx`;

      // Save the file using file-saver
      setExportStatus('downloading');
      saveAs(blob, finalFilename);

      setExportStatus('success');
      toast.success('User list exported successfully!');
      setError(null); // Clear any previous errors

      // Optional: Redirect back to the users list after download
      // setTimeout(() => router.push('/users'), 3000); // Redirect after 3 seconds

    } catch (err) {
      console.error("Excel generation or download error:", err);
      setExportStatus('error');
      setError("Failed to generate or download Excel file.");
      toast.error("Failed to generate export file.");
    }
  };

  // useEffect to handle auth check and data fetching
  useEffect(() => {
    // Wait until session status is resolved
    if (status === 'loading' || exportStatus !== 'idle') {
      setExportStatus('checking_auth'); // Indicate we are waiting/checking
      return;
    }

    // If not authenticated, redirect
    if (!session) {
      toast.warning("Please log in to access this page.");
      router.replace('/auth/signin'); // Redirect to your sign-in page
      return;
    }

    // Check if the user is an ADMIN - remove this check if ALL authenticated users can export
    if (session.user?.role !== 'ADMIN') {
      toast.error("You do not have permission to access this page.");
      router.replace('/403'); // Redirect to a forbidden page
      return;
    }

    // If authenticated and authorized, proceed to fetch data
    const fetchDataAndExport = async () => {
      setExportStatus('fetching_data');
      setError(null); // Clear previous errors

      try {
        // Fetch users from your API endpoint
        // IMPORTANT: Ensure this endpoint is protected and only returns users to authorized users
        const res = await fetch('/api/users');

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to fetch users.' }));
          throw new Error(errorData.message || 'Failed to fetch users.');
        }

        const users: User[] = await res.json();

        if (users.length === 0) {
             setExportStatus('idle'); // Or 'no_data'
             setError("No users found to export.");
             toast.info("No users found to export.");
             // Optional: Redirect back if no data
             // setTimeout(() => router.push('/users'), 2000);
             return;
        }

        exportToExcel(users); // Proceed with export

      } catch (err: any) {
        console.error("Fetch error:", err);
        setExportStatus('error');
        setError(err.message || "An error occurred while fetching user data.");
        toast.error(err.message || "An error occurred during export.");
      }
    };

    fetchDataAndExport();

  }, [session, status, router, exportStatus]); // Add exportStatus to dependencies to prevent re-running on every render if status is 'idle'

  // Render content based on the export status
  const renderStatusMessage = () => {
      switch (exportStatus) {
          case 'checking_auth':
              return (
                  <div className="flex flex-col items-center text-gray-500">
                      <ArrowPathIcon className="w-12 h-12 animate-spin mb-4" />
                      <p className="text-xl font-semibold">Checking Permissions...</p>
                      <p className="text-gray-600 mt-2">Verifying access to export data.</p>
                  </div>
              );
          case 'fetching_data':
              return (
                  <div className="flex flex-col items-center text-blue-600">
                      <ArrowPathIcon className="w-12 h-12 animate-spin mb-4" />
                      <p className="text-xl font-semibold">Preparing Data for Export...</p>
                      <p className="text-gray-600 mt-2">Please wait, fetching user information from the database.</p>
                  </div>
              );
          case 'generating_file':
              return (
                   <div className="flex flex-col items-center text-blue-600">
                      <ArrowPathIcon className="w-12 h-12 animate-spin mb-4" />
                      <p className="text-xl font-semibold">Generating Excel File...</p>
                      <p className="text-gray-600 mt-2">Almost there, preparing the spreadsheet.</p>
                  </div>
              );
           case 'downloading':
              return (
                   <div className="flex flex-col items-center text-blue-600">
                      <ArrowDownTrayIcon className="w-12 h-12 animate-bounce mb-4" />
                      <p className="text-xl font-semibold">Download Starting...</p>
                      <p className="text-gray-600 mt-2">Your browser should prompt you to save the file shortly.</p>
                  </div>
              );
          case 'success':
              return (
                  <div className="flex flex-col items-center text-green-600">
                       <CheckCircleIcon className="w-12 h-12 mb-4" />
                      <p className="text-xl font-semibold">Export Successful!</p>
                      <p className="text-gray-600 mt-2">The user list has been successfully exported to an Excel file.</p>
                      {/* Optional: Add a button to go back */}
                       <button
                            onClick={() => router.push("/users")}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go Back to Users List
                        </button>
                  </div>
              );
          case 'error':
              return (
                  <div className="flex flex-col items-center text-red-600">
                      <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
                      <p className="text-xl font-semibold">Export Failed</p>
                      <p className="text-gray-600 mt-2">{error || "An unknown error occurred during the export process."}</p>
                       {/* Optional: Add a button to retry or go back */}
                       <button
                            onClick={() => setExportStatus('idle')} // Allow retry
                            className="mt-6 px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors mr-4"
                        >
                            Retry Export
                        </button>
                        <button
                            onClick={() => router.push("/users")}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go Back to Users List
                        </button>
                  </div>
              );
           case 'idle':
           default:
              // Initial state, might just show a brief message or nothing
              return (
                <div className="flex flex-col items-center text-gray-500">
                    <ArrowPathIcon className="w-12 h-12 animate-spin mb-4" />
                    <p className="text-xl font-semibold">Initializing Export...</p>
                </div>
              );
      }
  };

  return (
    <Layout>
      <div className="container mx-auto px-10 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
         <div className="text-center">
             {renderStatusMessage()}
         </div>
      </div>
    </Layout>
  );
};

export default ExportPage;