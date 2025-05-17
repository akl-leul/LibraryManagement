// components/BorrowingForm.tsx
import React, { useState, useEffect } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { FaUserGraduate, FaBook, FaCalendarAlt, FaPlusCircle } from "react-icons/fa";
import toast from "react-hot-toast"; // Switch from alert to toast

interface BorrowingFormProps {
  onBorrowingAdded: () => void; // callback to refresh data after adding
}

// Keep User and Book interfaces as they are likely defined elsewhere or based on your API
interface User {
  id: number; // Assuming ID is number, adjust if string
  name: string;
}

interface Book {
  id: number; // Assuming ID is number, adjust if string
  title: string;
  available?: boolean; // Keep if your API sends this for filtering
}

interface OptionType {
  value: number; // Assuming ID is number
  label: string;
}

export default function BorrowingForm({ onBorrowingAdded }: BorrowingFormProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<OptionType | null>(null);
  const [selectedBook, setSelectedBook] = useState<OptionType | null>(null);
  const [borrowedAt, setBorrowedAt] = useState<string>(""); // ISO date string YYYY-MM-DD
  const [dueDate, setDueDate] = useState<string>("");     // ISO date string YYYY-MM-DD
  const [loadingStudents, setLoadingStudents] = useState(true); // Start true
  const [loadingBooks, setLoadingBooks] = useState(true);     // Start true
  const [submitting, setSubmitting] = useState(false);

  // Fetch available students (role STUDENT)
  useEffect(() => {
    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const res = await fetch("/api/users/route"); // Ensure this API endpoint exists and works
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Failed to fetch students" }));
            throw new Error(errorData.message || "Failed to fetch students");
        }
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []); // Ensure data is an array
      } catch (error) {
        toast.error((error as Error).message || "Error fetching students.");
        setStudents([]); // Set to empty array on error
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchStudents();
  }, []);

  // Fetch available books (available = true)
  useEffect(() => {
    async function fetchBooks() {
      setLoadingBooks(true);
      try {
        const res = await fetch("/api/books?available=true"); // Ensure this API endpoint exists and works
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Failed to fetch books" }));
            throw new Error(errorData.message || "Failed to fetch books");
        }
        const data = await res.json();
        // Assuming API returns { books: [...] } or just [...]
        setBooks(Array.isArray(data.books) ? data.books : Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error((error as Error).message || "Error fetching books.");
        setBooks([]); // Set to empty array on error
      } finally {
        setLoadingBooks(false);
      }
    }
    fetchBooks();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedBook || !borrowedAt || !dueDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (new Date(dueDate) < new Date(borrowedAt)) {
      toast.error("Due date cannot be before borrowed date.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Processing borrowing request...");

    try {
      const res = await fetch("/api/borrowings/route", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedStudent.value,
          bookId: selectedBook.value,
          borrowedAt, // Send as YYYY-MM-DD
          dueDate,    // Send as YYYY-MM-DD
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Failed to add borrowing record." }));
        throw new Error(errData.message || "Failed to add borrowing record.");
      }
      toast.success("Borrowing added successfully!", { id: toastId });
      setSelectedStudent(null);
      setSelectedBook(null);
      setBorrowedAt("");
      setDueDate("");
      onBorrowingAdded(); // Callback to refresh parent component's data
    } catch (error) {
      toast.error((error as Error).message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  const studentOptions: OptionType[] = students.map((s) => ({
    value: s.id,
    label: s.name || `Student ID: ${s.id}`, // Fallback label
  }));

  const bookOptions: OptionType[] = books.map((b) => ({
    value: b.id,
    label: b.title || `Book ID: ${b.id}`, // Fallback label
  }));

  // Custom styles for react-select to match dark theme
  const selectStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--color-slate-700, #334155)', // slate-700
      borderColor: state.isFocused ? 'var(--color-sky-500, #0ea5e9)' : 'var(--color-slate-600, #475569)', // sky-500 for focus, slate-600
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-sky-500, #0ea5e9)' : 'none',
      borderRadius: '0.5rem', // rounded-lg
      minHeight: '46px', // Match input height
      '&:hover': {
        borderColor: 'var(--color-sky-500, #0ea5e9)',
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--color-slate-100, #f1f5f9)', // slate-100
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--color-slate-100, #f1f5f9)',
      margin: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--color-slate-400, #94a3b8)', // slate-400
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      '& svg': {
        fill: 'var(--color-slate-400, #94a3b8)', // slate-400
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--color-slate-700, #334155)', // slate-700
      borderRadius: '0.5rem', // rounded-lg
      marginTop: '4px',
      border: '1px solid var(--color-slate-600, #475569)', // slate-600
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--color-sky-600, #0284c7)' // sky-600
        : state.isFocused
        ? 'var(--color-slate-600, #475569)' // slate-600
        : 'transparent',
      color: state.isSelected ? 'white' : 'var(--color-slate-200, #e2e8f0)', // slate-200
      padding: '10px 12px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--color-sky-700, #0369a1)', // sky-700
      },
    }),
    noOptionsMessage: (provided) => ({
        ...provided,
        color: 'var(--color-slate-400, #94a3b8)', // slate-400
    }),
    loadingMessage: (provided) => ({
        ...provided,
        color: 'var(--color-slate-400, #94a3b8)', // slate-400
    }),
    // Clear indicator styles
    clearIndicator: (provided) => ({
      ...provided,
      color: 'var(--color-slate-400, #94a3b8)',
      '&:hover': {
        color: 'var(--color-slate-200, #e2e8f0)',
      },
    }),
  };

  // CSS Variables for Tailwind colors (add to your globals.css or similar)
  /*
  :root {
    --color-slate-100: #f1f5f9;
    --color-slate-200: #e2e8f0;
    --color-slate-300: #cbd5e1;
    --color-slate-400: #94a3b8;
    --color-slate-600: #475569;
    --color-slate-700: #334155;
    --color-slate-800: #1e293b;
    --color-slate-900: #0f172a;
    --color-sky-500: #0ea5e9;
    --color-sky-600: #0284c7;
    --color-sky-700: #0369a1;
  }
  */
  const labelClasses = "block mb-1.5 font-medium text-slate-200 flex items-center gap-2 text-sm";
  const inputBaseClasses = "w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out";


  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg w-full bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8 space-y-6"
    >
      <h2 className="text-2xl font-semibold text-sky-400 mb-6 text-center flex items-center justify-center gap-2">
        <FaPlusCircle /> Add New Borrowing Record
      </h2>

      <div>
        <label htmlFor="student" className={labelClasses}>
          <FaUserGraduate /> Select Student
        </label>
        <Select
          inputId="student"
          options={studentOptions}
          value={selectedStudent}
          onChange={(option) => setSelectedStudent(option as SingleValue<OptionType>)}
          isLoading={loadingStudents}
          placeholder="Search or select a student..."
          isClearable
          styles={selectStyles} // Apply custom styles
          noOptionsMessage={() => loadingStudents ? "Loading students..." : "No students found"}
          instanceId="select-student" // Unique ID for SSR or multiple instances
        />
      </div>

      <div>
        <label htmlFor="book" className={labelClasses}>
          <FaBook /> Select Book
        </label>
        <Select
          inputId="book"
          options={bookOptions}
          value={selectedBook}
          onChange={(option) => setSelectedBook(option as SingleValue<OptionType>)}
          isLoading={loadingBooks}
          placeholder="Search or select an available book..."
          isClearable
          styles={selectStyles} // Apply custom styles
          noOptionsMessage={() => loadingBooks ? "Loading books..." : "No books found"}
          instanceId="select-book"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="borrowedAt" className={`${labelClasses} justify-start`}>
            <FaCalendarAlt className="mr-1" /> Borrowed Date
          </label>
          <input
            type="date"
            id="borrowedAt"
            value={borrowedAt}
            onChange={(e) => setBorrowedAt(e.target.value)}
            className={inputBaseClasses}
            required
            max={new Date().toISOString().split("T")[0]} // Optional: prevent future borrowed dates
          />
        </div>

        <div>
          <label htmlFor="dueDate" className={`${labelClasses} justify-start`}>
            <FaCalendarAlt className="mr-1" /> Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputBaseClasses}
            required
            min={borrowedAt || new Date().toISOString().split("T")[0]} // Due date must be after or same as borrowedAt
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || loadingStudents || loadingBooks}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
      >
        {submitting ? "Adding Record..." : "Add Borrowing Record"}
      </button>
      </form>
  );
}