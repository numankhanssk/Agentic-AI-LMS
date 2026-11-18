import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faBookOpen,
  faClipboardCheck,
  faIndianRupeeSign,
  faGraduationCap,
  faChalkboardTeacher,
  faBell,
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faFilter,
  faUserPlus,
  faCalendarAlt,
  faClock,
  faBook,
  faUsers,
  faLayerGroup,
  faSave,
  faRotate,
  faArrowLeft,
  faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

import HomeIcon from "../assets/HomeIcon.png";

const initialBooks = [
  {
    id: 1,
    name: "Data Structures and Algorithms Made Easy",
    author: "Narasimha Karumanchi",
    isbn: "9788193245279",
    department: "CSE",
    semester: "3",
    subject: "Data Structures",
    image: "/books/CSE/3rd-sem/dsa.jpg",
    description: "A guide to data structures and algorithms.",
    copies: 5
  },
  {
    id: 2,
    name: "Introduction to Automata Theory",
    author: "John E. Hopcroft",
    isbn: "9780321455369",
    department: "CSE",
    semester: "4",
    subject: "Theory of Computation",
    image: "",
    description: "Introduction to automata, languages and computation.",
    copies: 4
  },
  {
    id: 3,
    name: "Database System Concepts",
    author: "Abraham Silberschatz",
    isbn: "9780078022159",
    department: "CSE",
    semester: "4",
    subject: "Database Management Systems",
    image: "",
    description: "Fundamentals of database systems.",
    copies: 3
  }
];

const initialRequests = [
  {
    id: 1,
    person: "Rahul Kumar",
    usn: "1BI24CS401",
    role: "Student",
    book: "Data Structures and Algorithms Made Easy",
    type: "collection",
    date: "14 Nov 2026",
    status: "Pending"
  },
  {
    id: 2,
    person: "Ayesha Khan",
    usn: "1BI24CS402",
    role: "Student",
    book: "Database System Concepts",
    type: "return",
    date: "14 Nov 2026",
    status: "Pending"
  },
  {
    id: 3,
    person: "Dr. Kumar",
    usn: "1BI24CSE101",
    role: "Teacher",
    book: "Introduction to Automata Theory",
    type: "extension",
    date: "14 Nov 2026",
    status: "Pending"
  }
];

const initialFines = [
  {
    id: 1,
    person: "Rahul Kumar",
    usn: "1BI24CS401",
    role: "Student",
    book: "Data Structures and Algorithms Made Easy",
    amount: 50,
    status: "Unpaid"
  },
  {
    id: 2,
    person: "Dr. Kumar",
    usn: "1BI24CSE101",
    role: "Teacher",
    book: "Database System Concepts",
    amount: 100,
    status: "Paid"
  }
];

const initialStudents = [
  {
    id: 1,
    name: "Rahul Kumar",
    usn: "1BI24CS401",
    email: "rahul@example.com",
    department: "CSE",
    semester: "5"
  },
  {
    id: 2,
    name: "Ayesha Khan",
    usn: "1BI24CS402",
    email: "ayesha@example.com",
    department: "CSE",
    semester: "5"
  }
];

const initialTeachers = [
  {
    id: 1,
    name: "Dr. Kumar",
    usn: "1BI24CSE101",
    email: "kumar@example.com",
    department: "CSE"
  }
];

const emptyBook = {
  name: "",
  author: "",
  isbn: "",
  subject_id: "",
  department: "CSE",
  semester: "3",
  subject: "",
  image: "",
  description: "",
  copies: 1
};

function AdminDashboard() {
  const API = "http://localhost:5000";

  
const fetchBooks = async () => {
  try {
    setBooksLoading(true);
    setBooksError("");

    const token = localStorage.getItem("adminToken");

    const response = await fetch(`${API}/api/books`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to fetch books.");
    }

    const formattedBooks = data.books.map((book) => ({
      id: book.book_id,
      name: book.book_name,
      author: book.author || "",
      isbn: book.isbn || "",
      subject_id: book.subject_id || "",
      department: book.department_names || "",
      department_id: String(book.department_id || ""),
      semester: book.semester_names || "",
      semester_number: String(book.semester_number || ""),
      subject: book.subject_names || "",
      image: book.image_url || "",
      description: book.description || "",
      copies: book.available_copies
    }));

    setBooks(formattedBooks);
  } catch (error) {
    console.error("Books fetch error:", error);
    setBooksError(error.message);
  } finally {
    setBooksLoading(false);
  }
};


  useEffect(() => {
      fetchBooks();
  }, []);

  const [activeTab, setActiveTab] = useState("books");
  const [bookTab, setBookTab] = useState("add");
  const [requestTab, setRequestTab] = useState("collection");
  const [peopleTab, setPeopleTab] = useState("students");

  // Library Updates
const [updateTab, setUpdateTab] = useState("add");
const [updateRows, setUpdateRows] = useState([""]);
const [libraryUpdates, setLibraryUpdates] = useState([]);
const [updatesLoading, setUpdatesLoading] = useState(false);
const [updatesSaving, setUpdatesSaving] = useState(false);
const [deletingUpdateId, setDeletingUpdateId] = useState(null);

// ==================================================
// LIBRARY UPDATES FUNCTIONS
// ==================================================

const fetchLibraryUpdates = async () => {
    setUpdatesLoading(true);

    try {
        const response = await fetch(`${API}/api/admin/updates`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to fetch updates.");
        }

        setLibraryUpdates(data.updates || []);

    } catch (error) {
        console.error("Fetch updates error:", error);
        showNotice(error.message, "error");
    } finally {
        setUpdatesLoading(false);
    }
};


const handlePublishUpdates = async (e) => {
    e.preventDefault();

    const messages = updateRows
        .map(message => message.trim())
        .filter(message => message.length > 0);

    if (messages.length === 0) {
        showNotice("Please enter at least one update.", "error");
        return;
    }

    setUpdatesSaving(true);

    try {
        const response = await fetch(`${API}/api/admin/updates`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({ updates: messages })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to publish updates.");
        }

        setUpdateRows([""]);
        await fetchLibraryUpdates();
        setUpdateTab("added");

        showNotice(data.message || "Updates published successfully!");

    } catch (error) {
        console.error("Publish updates error:", error);
        showNotice(error.message, "error");
    } finally {
        setUpdatesSaving(false);
    }
};


const handleDeleteUpdate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this update?")) {
        return;
    }

    setDeletingUpdateId(id);

    try {
        const response = await fetch(`${API}/api/admin/updates/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to delete update.");
        }

        setLibraryUpdates(prev =>
            prev.filter(update => update.update_id !== id)
        );

        showNotice(data.message || "Update deleted successfully!");

    } catch (error) {
        console.error("Delete update error:", error);
        showNotice(error.message, "error");
    } finally {
        setDeletingUpdateId(null);
    }
};

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectSaving, setSubjectSaving] = useState(false);

  const [subjectForm, setSubjectForm] = useState({
    subject_name: "",
    subject_code: "",
    department_id: "",
    semester_id: ""
  });

    // FETCH SUBJECTS
  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API}/api/admin/subjects`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch subjects.");
      }

      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Subjects fetch error:", error);
      showNotice(error.message);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // ADD NEW SUBJECT
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();

    if (
      !subjectForm.subject_name.trim() ||
      !subjectForm.subject_code.trim() ||
      !subjectForm.department_id ||
      !subjectForm.semester_id
    ) {
      showNotice("Please fill in all subject details.");
      return;
    }

    try {
      setSubjectSaving(true);

      const token = localStorage.getItem("adminToken")

      const response = await fetch(`${API}/api/admin/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_name: subjectForm.subject_name.trim(),
          subject_code: subjectForm.subject_code.trim(),
          department_id: Number(subjectForm.department_id),
          semester_id: Number(subjectForm.semester_id)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add subject.");
      }

      await fetchSubjects();

      setBookForm((prev) => ({
        ...prev,
        subject_id: String(data.subject.subject_id)
      }));

      setSubjectForm({
        subject_name: "",
        subject_code: "",
        department_id: "",
        semester_id: ""
      });

      setShowSubjectModal(false);
      showNotice("Subject added successfully!");
    } catch (error) {
      console.error("Subject save error:", error);
      showNotice(error.message);
    } finally {
      setSubjectSaving(false);
    }
  };

  // FETCH DEPARTMENTS AND SEMESTERS
  const fetchSubjectFilters = async () => {
    try {
      const response = await fetch(`${API}/api/books/filters`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch filters.");
      }

      setDepartments(data.departments || []);
      setSemesters(data.semesters || []);
    } catch (error) {
      console.error("Filter fetch error:", error);
      showNotice(error.message);
    }
  };

  useEffect(() => {
    if (activeTab === "updates") {
        fetchLibraryUpdates();
    }
}, [activeTab]);

  useEffect(() => {
    fetchSubjects();
    fetchSubjectFilters();
  }, []);

  
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [confirmingCollection, setConfirmingCollection] = useState(null);
  const [confirmingReturn, setConfirmingReturn] = useState(null);
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnRequestsLoading, setReturnRequestsLoading] = useState(false);
  const [returnRequestsError, setReturnRequestsError] = useState(""); 
  // FINE MANAGEMENT
  const [fines, setFines] = useState([]);

  const [fineSummary, setFineSummary] = useState({
      unpaid_amount: 0,
      collected_amount: 0,
      withdrawn_amount: 0,
      available_balance: 0
  });

const [finesLoading, setFinesLoading] = useState(false);
const [fineActionId, setFineActionId] = useState(null);

const [withdrawAmount, setWithdrawAmount] = useState("");
const [withdrawRemarks, setWithdrawRemarks] = useState("");
const [withdrawLoading, setWithdrawLoading] = useState(false);

const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
const [completedWithdrawalAmount, setCompletedWithdrawalAmount] = useState(0);

const [adminUsername] = useState(() => {
    const admin = JSON.parse(localStorage.getItem("admin") || "{}");
    return admin.username || "";
});
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [bookForm, setBookForm] = useState(emptyBook);
  const [editingBook, setEditingBook] = useState(null);

  const [bookSearch, setBookSearch] = useState("");
  const [bookDepartment, setBookDepartment] = useState("All");
  const [bookSemester, setBookSemester] = useState("All");

  const [requestSearch, setRequestSearch] = useState("");
  const [fineSearch, setFineSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");

  const [personForm, setPersonForm] = useState({
    name: "",
    usn: "",
    email: "",
    department: "CSE",
    semester: "3"
  });

  const [editingPerson, setEditingPerson] = useState(null);
  const [showPersonForm, setShowPersonForm] = useState(false);

  const [notice, setNotice] = useState("");
  useEffect(() => {
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setStudentsError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API}/api/admin/students`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch students.");
      }

      const formattedStudents = data.students.map((student) => ({
        id: student.student_id,
        name: student.name,
        usn: student.usn,
        email: student.email,
        department: "—",
        semester: String(student.semester)
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Students fetch error:", error);
      setStudentsError(error.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  fetchStudents();
}, []);

  const showNotice = (text) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3000);
  };

  // BOOK FILTERING
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const query = bookSearch.toLowerCase();

      const matchesSearch =
        book.name.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query) ||
        book.subject.toLowerCase().includes(query);

      const matchesDepartment =
        bookDepartment === "All" ||
        book.department_id === String(bookDepartment);

      const matchesSemester =
        bookSemester === "All" ||
        book.semester_number === String(bookSemester);

      return matchesSearch && matchesDepartment && matchesSemester;
    });
  }, [books, bookSearch, bookDepartment, bookSemester]);


  // ADD OR UPDATE BOOK
  const handleBookSubmit = async (e) => {
  e.preventDefault();

  if (!bookForm.name.trim() || !bookForm.author.trim() || !bookForm.subject_id) {
    showNotice("Please enter the book name, author and subject.");
    return;
  }

  try {
    const token = localStorage.getItem("adminToken");

    const payload = {
      name: bookForm.name.trim(),
      author: bookForm.author.trim(),
      isbn: bookForm.isbn.trim(),
      subject_id: Number(bookForm.subject_id),
      image: bookForm.image.trim(),
      description: bookForm.description.trim(),
      copies: Number(bookForm.copies)
    };

    const url = editingBook
      ? `${API}/api/admin/books/${editingBook}`
      : `${API}/api/admin/books`;

    const response = await fetch(url, {
      method: editingBook ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to save book.");
    }

    await fetchBooks();

    showNotice(editingBook ? "Book updated successfully!" : "Book added successfully!");

    setBookForm(emptyBook);
    setEditingBook(null);
    setBookTab("add");
  } catch (error) {
    console.error("Book save error:", error);
    showNotice(error.message);
  }
};

  const startBookEdit = (book) => {
  setBookForm({
    name: book.name,
    author: book.author,
    isbn: book.isbn,
    subject_id: String(book.subject_id || ""),
    department: book.department,
    semester: book.semester,
    subject: book.subject,
    image: book.image,
    description: book.description,
    copies: book.copies
  });

  setEditingBook(book.id);
  setBookTab("add");
};

  const deleteBook = async (id) => {
  if (!window.confirm("Are you sure you want to permanently remove this book?")) {
    return;
  }

  try {
    const token = localStorage.getItem("adminToken");

    const response = await fetch(`${API}/api/admin/books/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to remove book.");
    }

    await fetchBooks();
    showNotice("Book removed successfully!");
  } catch (error) {
    console.error("Book delete error:", error);
    showNotice(error.message);
  }
};

// FETCH ADMIN COLLECTION REQUESTS
const fetchCollectionRequests = async () => {
  try {
    setRequestsLoading(true);
    setRequestsError("");

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API}/api/admin/collection-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to fetch collection requests.");
    }

    const formattedRequests = (data.requests || []).map((request) => ({
      id: request.order_item_id,
      person: request.student_name,
      usn: request.usn,
      role: "Student",
      book: request.book_name,
      type: "collection",
      date: request.order_date,
      collectionStart: request.collection_start_date,
      collectionEnd: request.collection_end_date,
      status: request.collection_status
    }));

    setRequests(formattedRequests);

  } catch (error) {
    console.error("Collection requests error:", error);
    setRequestsError(error.message);
  } finally {
    setRequestsLoading(false);
  }
};

// FETCH ADMIN RETURN REQUESTS
const fetchReturnRequests = async () => {
  try {
    setReturnRequestsLoading(true);
    setReturnRequestsError("");

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API}/api/admin/return-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to fetch return requests.");
    }

    const formattedRequests = (data.requests || []).map((request) => ({
      id: request.order_item_id,
      orderId: request.order_id,
      person: request.student_name,
      usn: request.usn,
      role: "Student",
      book: request.book_name,
      author: request.author,
      image: request.image_url,
      collectedOn: request.collected_at,
      returnStart: request.return_start_date,
      returnDue: request.return_due_date,
      status: request.return_status
    }));

    setReturnRequests(formattedRequests);

  } catch (error) {
    console.error("Return requests error:", error);
    setReturnRequestsError(error.message);
  } finally {
    setReturnRequestsLoading(false);
  }
};

useEffect(() => {
  if (activeTab === "requests") {
    if (requestTab === "collection") {
      fetchCollectionRequests();
    } else if (requestTab === "return") {
      fetchReturnRequests();
    }
  }
}, [activeTab, requestTab]);

// CONFIRM BOOK COLLECTION
const handleConfirmCollection = async (orderItemId) => {
  if (!window.confirm("Confirm that the student has collected this book?")) {
    return;
  }

  try {
    setConfirmingCollection(orderItemId);

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API}/api/admin/orders/${orderItemId}/collect`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to confirm collection.");
    }

    showNotice("Book collection confirmed successfully!");

    await fetchCollectionRequests();

  } catch (error) {
    console.error("Collection confirmation error:", error);
    showNotice(error.message);
  } finally {
    setConfirmingCollection(null);
  }
};

const handleConfirmReturn = async (orderItemId) => {
  try {
    setConfirmingReturn(orderItemId);

    const token = localStorage.getItem("adminToken");

    const response = await fetch(
      `${API}/api/admin/orders/${orderItemId}/return`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to confirm return.");
    }

    alert(
      `Return confirmed successfully!\nFine: ₹${data.fine_amount}`
    );

    await fetchReturnRequests();
    await fetchBooks();

  } catch (error) {
    alert(error.message);
  } finally {
    setConfirmingReturn(null);
  }
};

const filteredRequests = requests.filter((request) => {
  const query = requestSearch.toLowerCase();

  return (
    request.person.toLowerCase().includes(query) ||
    request.usn.toLowerCase().includes(query) ||
    request.book.toLowerCase().includes(query)
  );
});

const filteredReturnRequests = returnRequests.filter((request) => {
  const query = requestSearch.toLowerCase();

  return (
    request.person.toLowerCase().includes(query) ||
    request.usn.toLowerCase().includes(query) ||
    request.book.toLowerCase().includes(query)
  );
});


  // FETCH FINE RECORDS
const fetchFines = async () => {
    setFinesLoading(true);

    try {
        const response = await fetch(`${API}/api/admin/fines`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch fines.");
        }

        setFines(data
            .filter((fine) => Number(fine.fine_hidden_from_student) !== 1)
            .map((fine) => ({
                id: fine.order_item_id,
                person: fine.student_name,
                usn: fine.usn,
                role: "Student",
                book: fine.book_name,
                amount: Number(fine.fine_amount),
                status: fine.payment_status === "Paid" ? "Paid" : "Unpaid",
                generatedAt: fine.fine_generated_at,
                hidden: false
            }))
        );

    } catch (error) {
        showNotice(error.message);
    } finally {
        setFinesLoading(false);
    }
};


// FETCH FINE SUMMARY
const fetchFineSummary = async () => {
    try {
        const response = await fetch(`${API}/api/admin/fines/summary`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch fine summary.");
        }

        setFineSummary(data);

    } catch (error) {
        showNotice(error.message);
    }
};


// FILTER FINE RECORDS
const filteredFines = fines.filter((fine) => {
    const query = fineSearch.toLowerCase();

    return (
        (fine.person || "").toLowerCase().includes(query) ||
        (fine.usn || "").toLowerCase().includes(query) ||
        (fine.book || "").toLowerCase().includes(query)
    );
});


// ADMIN MARK FINE AS PAID
const markFinePaid = async (id) => {
    setFineActionId(id);

    try {
        const response = await fetch(
            `${API}/api/admin/fines/${id}/pay`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to mark fine as paid.");
        }

        await fetchFines();
        await fetchFineSummary();

        showNotice(data.message);

    } catch (error) {
        showNotice(error.message);
    } finally {
        setFineActionId(null);
    }
};


// CLEAR PAID FINE
const clearFine = async (id) => {
    setFineActionId(id);

    try {
        const response = await fetch(
            `${API}/api/admin/fines/${id}/clear`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to clear fine.");
        }

        await fetchFines();
        showNotice(data.message);

    } catch (error) {
        showNotice(error.message);
    } finally {
        setFineActionId(null);
    }
};


// HANDLE FINE WITHDRAWAL
const handleFineWithdrawal = async (e) => {
    e.preventDefault();

    const amount = Number(withdrawAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        showNotice("Enter a valid withdrawal amount.");
        return;
    }

    setWithdrawLoading(true);

    try {
        const response = await fetch(`${API}/api/admin/fines/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            },
            body: JSON.stringify({
                amount,
                remarks: withdrawRemarks
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Withdrawal failed.");
        }

        setCompletedWithdrawalAmount(amount);
        setWithdrawalSuccess(true);

        await fetchFineSummary();

    } catch (error) {
        showNotice(error.message);
    } finally {
        setWithdrawLoading(false);
    }
};

  // STUDENT / TEACHER MANAGEMENT
  const people = peopleTab === "students" ? students : teachers;

  const filteredPeople = people.filter((person) => {
    const query = peopleSearch.toLowerCase();

    return (
      person.name.toLowerCase().includes(query) ||
      person.usn.toLowerCase().includes(query) ||
      person.email.toLowerCase().includes(query)
    );
  });

  const openAddPerson = () => {
    setEditingPerson(null);
    setPersonForm({
      name: "",
      usn: "",
      email: "",
      department: "CSE",
      semester: "3"
    });
    setShowPersonForm(true);
  };

  const openEditPerson = (person) => {
    setEditingPerson(person.id);
    setPersonForm({
      name: person.name,
      usn: person.usn,
      email: person.email,
      department: person.department,
      semester: person.semester || "3"
    });
    setShowPersonForm(true);
  };

  const savePerson = async (e) => {
    e.preventDefault();

    if (!personForm.name.trim() || !personForm.usn.trim()) {
        showNotice("Name and USN are required.");
        return;
    }

    // STUDENT MANAGEMENT
    if (peopleTab === "students") {

        if (
            !personForm.email.trim() ||
            !personForm.semester.trim()
        ) {
            showNotice("Email and semester are required.");
            return;
        }

        // Student editing is not connected to a backend update API yet.
        if (editingPerson) {
            showNotice("Student editing API is not connected yet.");
            return;
        }

        try {
            const response = await fetch(`${API}/api/admin/students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                },
                body: JSON.stringify({
                    name: personForm.name.trim(),
                    email: personForm.email.trim(),
                    usn: personForm.usn.trim().toUpperCase(),
                    semester: personForm.semester
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to add student.");
            }

            const savedStudent = data.student;

            setStudents((prev) => [
                ...prev,
                {
                    id: savedStudent.student_id,
                    name: savedStudent.name,
                    usn: savedStudent.usn,
                    email: savedStudent.email,
                    department: "—",
                    semester: String(savedStudent.semester)
                }
            ]);

            showNotice("Student added successfully to the database.");

            setShowPersonForm(false);

        } catch (error) {
            console.error("Add student error:", error);
            showNotice(error.message);
        }

        return;
    }

    // TEACHER MANAGEMENT (EXISTING DEMO BEHAVIOUR)
    if (editingPerson) {
        setTeachers((prev) =>
            prev.map((person) =>
                person.id === editingPerson
                    ? { ...person, ...personForm }
                    : person
            )
        );

        showNotice("Teacher details updated.");
    } else {
        setTeachers((prev) => [
            ...prev,
            { ...personForm, id: Date.now() }
        ]);

        showNotice("Teacher added successfully.");
    }

    setShowPersonForm(false);
};

  const deletePerson = async (id) => {
    const isStudent = peopleTab === "students";

    if (!window.confirm(
        isStudent
            ? "Permanently delete this student from the library database?"
            : "Remove this teacher from the list?"
    )) {
        return;
    }

    if (isStudent) {
        try {
            const response = await fetch(`${API}/api/admin/students/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("adminToken")}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete student.");
            }

            setStudents(prev =>
                prev.filter(person => person.id !== id)
            );

            showNotice("Student permanently deleted from the database.");

        } catch (error) {
            console.error("Student deletion error:", error);
            showNotice(error.message, "error");
        }

    } else {
        setTeachers(prev =>
            prev.filter(person => person.id !== id)
        );

        showNotice("Teacher removed from the list.");
    }
};

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const unpaidAmount = fines
    .filter((fine) => fine.status === "Unpaid")
    .reduce((total, fine) => total + Number(fine.amount), 0);

  const navItems = [
    { id: "books", label: "Books Management", icon: faBookOpen },
    { id: "requests", label: "Collection & Returns", icon: faClipboardCheck },
    { id: "fines", label: "Fine Management", icon: faIndianRupeeSign },
    { id: "students", label: "Student Management", icon: faGraduationCap },
    // { id: "teachers", label: "Teacher Management", icon: faChalkboardTeacher },
    { id: "updates", label: "Updates", icon: faBell }
  ];

  const pageTitle = navItems.find((item) => item.id === activeTab)?.label;


  const formatRequestDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const formatDateOnly = (value) => {
  if (!value) return "—";

  const raw = String(value);

  // Handle MySQL DATE values
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-");
    return `${day}/${month}/${year}`;
  }

  // Handle ISO timestamps using Indian Standard Time
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

// LOAD FINE DATA WHEN FINE TAB OPENS
useEffect(() => {
    if (activeTab === "fines") {
        fetchFines();
        fetchFineSummary();
    }
}, [activeTab]);

  return (
    <div className="admin-dashboard">

      {/* FIXED HEADER */}
      <header className="admin-header">
        <img src={HomeIcon} alt="Agentic AI Logo" />

        <span className="admin-header-label">ADMIN PANEL</span>

        <button
          className="admin-logout-button"
          onClick={() => {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("admin");
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        <div className="admin-welcome">
          <div>
            <span className="admin-eyebrow">LIBRARY ADMINISTRATION</span>
            <h1>Admin Dashboard</h1>
            <p>Manage books, members and library activities.</p>
          </div>
          <div className="admin-date">
            <FontAwesomeIcon icon={faCalendarAlt} />
            Library Management
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <section className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
            <div>
              <span>Total Books</span>
              <h2>{books.length}</h2>
              <small>Book records</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div>
              <span>Pending Requests</span>
              <h2>{pendingCount}</h2>
              <small>Require attention</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div>
              <span>Total Students</span>
              <h2>{students.length}</h2>
              <small>Registered students</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">
              <FontAwesomeIcon icon={faIndianRupeeSign} />
            </div>
            <div>
              <span>Unpaid Fines</span>
              <h2>₹{unpaidAmount}</h2>
              <small>Outstanding amount</small>
            </div>
          </div>
        </section>

        {/* MAIN NAVIGATION */}
        <nav className="admin-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? "active" : ""}
              onClick={() => {
                setActiveTab(item.id);
                setShowPersonForm(false);
              }}
            >
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>
              {item.id === "requests" && pendingCount > 0 && (
                <span className="tab-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* PAGE HEADING */}
        <div className="section-heading">
          <div>
            <h2>{pageTitle}</h2>
            <p>Manage and monitor your library operations.</p>
          </div>
        </div>

        {/* BOOK MANAGEMENT */}
        {activeTab === "books" && (
          <section className="admin-panel">

            <div className="sub-tabs">
              {["add", "remove", "edit"].map((tab) => (
                <button
                  key={tab}
                  className={bookTab === tab ? "selected" : ""}
                  onClick={() => {
                    setBookTab(tab);
                    setEditingBook(null);
                    setBookForm(emptyBook);
                  }}
                >
                  {tab === "add" && <FontAwesomeIcon icon={faPlus} />}
                  {tab === "remove" && <FontAwesomeIcon icon={faTrash} />}
                  {tab === "edit" && <FontAwesomeIcon icon={faEdit} />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Book
                </button>
              ))}
            </div>

            {bookTab === "add" && (
              <div className="form-section">
                <div className="form-heading">
                  <div>
                    <h3>{editingBook ? "Edit Book Details" : "Add New Book"}</h3>
                    <p>Enter the book information below.</p>
                  </div>
                  <FontAwesomeIcon icon={faBook} />
                </div>

                <form onSubmit={handleBookSubmit}>
                  <div className="form-grid">
                    <label>
                      Book Name *
                      <input
                        required
                        value={bookForm.name}
                        placeholder="Enter book name"
                        onChange={(e) =>
                          setBookForm({ ...bookForm, name: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      Author *
                      <input
                        required
                        value={bookForm.author}
                        placeholder="Enter author name"
                        onChange={(e) =>
                          setBookForm({ ...bookForm, author: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      ISBN
                      <input
                        value={bookForm.isbn}
                        placeholder="Enter ISBN"
                        onChange={(e) =>
                          setBookForm({ ...bookForm, isbn: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      Subject *
                      <div className="subject-select-row">
                        <select
                          required
                          value={bookForm.subject_id}
                          onChange={(e) =>
                            setBookForm({
                              ...bookForm,
                              subject_id: e.target.value
                            })
                          }
                        >
                          <option value="">Select Subject</option>

                          {subjects.map((subject) => (
                            <option
                              key={subject.subject_id}
                              value={subject.subject_id}
                            >
                              {subject.subject_name} ({subject.department_code} - Semester {subject.semester_number})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="add-subject-button"
                          title="Add New Subject"
                          onClick={() => setShowSubjectModal(true)}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          Add
                        </button>
                      </div>
                    </label>

                    <label>
                      Available Copies
                      <input
                        type="number"
                        min="0"
                        required
                        value={bookForm.copies}
                        onChange={(e) =>
                          setBookForm({ ...bookForm, copies: e.target.value })
                        }
                      />
                    </label>

                    <label>
                      Book Image Path
                      <input
                        value={bookForm.image}
                        placeholder="/books/CSE/3rd-sem/dsa.jpg"
                        onChange={(e) =>
                          setBookForm({ ...bookForm, image: e.target.value })
                        }
                      />
                    </label>

                    <label className="full-width">
                      Description
                      <textarea
                        rows="4"
                        value={bookForm.description}
                        placeholder="Enter book description"
                        onChange={(e) =>
                          setBookForm({
                            ...bookForm,
                            description: e.target.value
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="form-actions">
                    {editingBook && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setEditingBook(null);
                          setBookForm(emptyBook);
                        }}
                      >
                        Cancel
                      </button>
                    )}

                    <button type="submit" className="primary-button">
                      <FontAwesomeIcon icon={faSave} />
                      {editingBook ? "Save Changes" : "Add Book"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {(bookTab === "remove" || bookTab === "edit") && (
              <div className="management-section">
                <div className="management-toolbar">
                  <div className="table-search">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                      placeholder="Search book, author, ISBN or subject..."
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                    />
                  </div>

                  <div className="filter-control">
                    <FontAwesomeIcon icon={faFilter} />
                    <select
                      value={bookDepartment}
                      onChange={(e) => setBookDepartment(e.target.value)}
                    >
                      <option value="All">All Departments</option>

                      {departments.map((dept) => (
                        <option
                          key={dept.department_id}
                          value={dept.department_id}
                        >
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-control">
                    <select
                      value={bookSemester}
                      onChange={(e) => setBookSemester(e.target.value)}
                    >
                      <option value="All">All Semesters</option>

                      {semesters.map((sem) => (
                        <option
                          key={sem.semester_id}
                          value={String(sem.semester_number)}
                        >
                          {sem.semester_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Book Details</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Copies</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                        {booksLoading ? (
                          <tr>
                            <td colSpan="5" className="empty-state">
                              Loading books...
                            </td>
                          </tr>
                        ) : booksError ? (
                          <tr>
                            <td colSpan="5" className="empty-state">
                              {booksError}
                            </td>
                          </tr>
                        ) : filteredBooks.length > 0 ? (
                          filteredBooks.map((book) => (
                            <tr key={book.id}>
                              <td>
                                <div className="book-cell">
                                  <div className="book-cover">
                                    <FontAwesomeIcon icon={faBookOpen} />
                                  </div>
                                  <div>
                                    <strong>{book.name}</strong>
                                    <span>{book.author}</span>
                                    <small>{book.isbn}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{book.department}</td>
                              <td>{book.semester}</td>
                              <td>{book.copies}</td>
                              <td>
                                {bookTab === "edit" ? (
                                  <button
                                    className="icon-action edit"
                                    title="Edit book"
                                    onClick={() => startBookEdit(book)}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                ) : (
                                  <button
                                    className="icon-action delete"
                                    title="Remove book"
                                    onClick={() => deleteBook(book.id)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="empty-state">
                              No books found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* COLLECTION, RETURN AND EXTENSION */}
        {activeTab === "requests" && (
          <section className="admin-panel">
            <div className="sub-tabs">
              {[
                { id: "collection", label: "Collection Requests" },
                { id: "return", label: "Return Requests" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={requestTab === tab.id ? "selected" : ""}
                  onClick={() => setRequestTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="management-section">
              <div className="management-toolbar">
                <div className="table-search">
                  <FontAwesomeIcon icon={faSearch} />
                  <input
                    placeholder="Search by name, USN or book..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                  />
                </div>
              </div>

              
              <div className="table-container">
                <table>
                  <thead>
                    {requestTab === "collection" ? (
                      <tr>
                        <th>Member</th>
                        <th>Book</th>
                        <th>Request Date</th>
                        <th>Collection Window</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Member</th>
                        <th>Book</th>
                        <th>Collected On</th>
                        <th>Return Period</th>
                        <th>Return Due Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    )}
                  </thead>

                  <tbody>
                    {requestTab === "collection" ? (
                      requestsLoading ? (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            Loading collection requests...
                          </td>
                        </tr>
                      ) : requestsError ? (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            {requestsError}
                          </td>
                        </tr>
                      ) : filteredRequests.length > 0 ? (
                        filteredRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="member-cell">
                                <strong>{request.person}</strong>
                                <span>{request.usn}</span>
                                <small>{request.role}</small>
                              </div>
                            </td>

                            <td>{request.book}</td>

                            <td>{formatRequestDate(request.date)}</td>

                            <td>
                              {formatDateOnly(request.collectionStart)}
                              {" to "}
                              {formatDateOnly(request.collectionEnd)}
                            </td>

                            <td>
                              <span className={`status ${request.status.toLowerCase()}`}>
                                {request.status}
                              </span>
                            </td>

                            <td>
                              {request.status === "Pending" ? (
                                <button
                                  className="small-primary"
                                  disabled={confirmingCollection === request.id}
                                  onClick={() => handleConfirmCollection(request.id)}
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                  {confirmingCollection === request.id
                                    ? "Confirming..."
                                    : "Confirm Collection"}
                                </button>
                              ) : (
                                <span className="completed-label">Collected</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            No pending collection requests found.
                          </td>
                        </tr>
                      )
                    ) : (
                      returnRequestsLoading ? (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            Loading return requests...
                          </td>
                        </tr>
                      ) : returnRequestsError ? (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            {returnRequestsError}
                          </td>
                        </tr>
                      ) : filteredReturnRequests.length > 0 ? (
                        filteredReturnRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="member-cell">
                                <strong>{request.person}</strong>
                                <span>{request.usn}</span>
                                <small>{request.role}</small>
                              </div>
                            </td>

                            <td>
                              <div className="book-cell">
                                <div className="book-cover">
                                  <FontAwesomeIcon icon={faBookOpen} />
                                </div>
                                <div>
                                  <strong>{request.book}</strong>
                                  <span>{request.author}</span>
                                </div>
                              </div>
                            </td>

                            <td>{formatRequestDate(request.collectedOn)}</td>

                            <td>
                              {formatDateOnly(request.returnStart)}
                              {" to "}
                              {formatDateOnly(request.returnDue)}
                            </td>

                            <td>{formatDateOnly(request.returnDue)}</td>

                            <td>
                              <span className={`status ${request.status.toLowerCase()}`}>
                                {request.status}
                              </span>
                            </td>

                            <td>
                              <button
                                className="small-primary"
                                disabled={confirmingReturn === request.id}
                                onClick={() => handleConfirmReturn(request.id)}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                                {confirmingReturn === request.id
                                  ? "Confirming..."
                                  : "Confirm Return"}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="empty-state">
                            No pending return requests found.
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </section>
        )}

        {/* FINE MANAGEMENT */}
        {activeTab === "fines" && (
        <section className="admin-panel">

            {/* FINE SUMMARY */}
            <div className="admin-stats fine-summary-stats" style={{ padding: "22px 22px 0" }}>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <FontAwesomeIcon icon={faIndianRupeeSign} />
                    </div>
                    <div>
                        <span>Unpaid Fines</span>
                        <h2>₹{Number(fineSummary.unpaid_amount).toLocaleString("en-IN")}</h2>
                        <small>Pending payments</small>
                    </div>
                </div>

                
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <FontAwesomeIcon icon={faIndianRupeeSign} />
                    </div>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                      <span>Available Balance</span>
                      <h2>₹{Number(fineSummary.available_balance).toLocaleString("en-IN")}</h2>
                      <small>After withdrawals</small>

                      <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                              setWithdrawAmount(String(fineSummary.available_balance));
                              setWithdrawRemarks("");
                              setWithdrawalSuccess(false);
                              setShowWithdrawalModal(true);
                          }}
                          disabled={Number(fineSummary.available_balance) <= 0}
                      >
                          <FontAwesomeIcon icon={faIndianRupeeSign} />
                          Withdraw
                      </button>
                  </div>
                    
                </div>

            </div>


           


            {/* FINE RECORDS */}
            <div className="management-section">

                <div className="section-heading">
                    <h2>Fine Records</h2>
                    <p>Manage student fines and payment history.</p>
                </div>

                <div className="management-toolbar">

                    <div className="table-search">
                        <FontAwesomeIcon icon={faSearch} />

                        <input
                            type="text"
                            placeholder="Search member, USN or book..."
                            value={fineSearch}
                            onChange={(e) => setFineSearch(e.target.value)}
                        />
                    </div>

                </div>


                <div className="table-container">
                    <table>

                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>USN</th>
                                <th>Role</th>
                                <th>Book</th>
                                <th>Fine Amount</th>
                                <th>Fine Generated On</th>
                                <th>Payment Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {finesLoading ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        Loading fine records...
                                    </td>
                                </tr>
                            ) : filteredFines.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        No fine records found.
                                    </td>
                                </tr>
                            ) : (

                                filteredFines.map((fine) => (

                                    <tr key={fine.id}>

                                        <td>
                                            <div className="member-cell">
                                                <strong>{fine.person}</strong>
                                            </div>
                                        </td>

                                        <td>{fine.usn}</td>

                                        <td>Student</td>

                                        <td>{fine.book}</td>

                                        <td className="amount">
                                            ₹{Number(fine.amount).toLocaleString("en-IN")}
                                        </td>

                                        <td>
                                            {fine.generatedAt
                                                ? new Date(fine.generatedAt).toLocaleString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true
                                                })
                                                : "—"}
                                        </td>

                                        <td>
                                            <span className={`status ${fine.status.toLowerCase()}`}>
                                                {fine.status}
                                            </span>
                                        </td>

                                        <td>

                                            {fine.status === "Unpaid" ? (

                                                <button
                                                    className="small-primary"
                                                    disabled={fineActionId === fine.id}
                                                    onClick={() => markFinePaid(fine.id)}
                                                >
                                                    {fineActionId === fine.id
                                                        ? "Processing..."
                                                        : "Mark Paid"}
                                                </button>

                                            ) : fine.hidden ? (

                                                <span className="completed-label">
                                                    Cleared
                                                </span>

                                            ) : (

                                                <button
                                                    className="secondary-button"
                                                    disabled={fineActionId === fine.id}
                                                    onClick={() => clearFine(fine.id)}
                                                >
                                                    {fineActionId === fine.id
                                                        ? "Processing..."
                                                        : "Clear"}
                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>
                </div>

                <p className="helper-note">
                    Paid fines remain in admin history even after being cleared from the student's dashboard.
                    Withdrawals are recorded in the database and do not initiate bank transfers.
                </p>

            </div>

        </section>
    )}

        {/* STUDENT AND TEACHER MANAGEMENT */}
        {/* {(activeTab === "students" || activeTab === "teachers") && ( */}
        {(activeTab === "students") && (
          <section className="admin-panel">
            <div className="sub-tabs">
              <button
                className={peopleTab === "students" ? "selected" : ""}
                onClick={() => {
                  setPeopleTab("students");
                  setPeopleSearch("");
                  setShowPersonForm(false);
                }}
              >
                <FontAwesomeIcon icon={faGraduationCap} />
                Students
              </button>
              {/* <button
                className={peopleTab === "teachers" ? "selected" : ""}
                onClick={() => {
                  setPeopleTab("teachers");
                  setPeopleSearch("");
                  setShowPersonForm(false);
                }}
              >
                <FontAwesomeIcon icon={faChalkboardTeacher} />
                Teachers
              </button> */}
            </div>

            {showPersonForm ? (
              <div className="form-section">
                <div className="form-heading">
                  <div>
                    <h3>{editingPerson ? "Edit Member" : "Add New Member"}</h3>
                    <p>Enter member details.</p>
                  </div>
                  <button
                    className="back-button"
                    onClick={() => setShowPersonForm(false)}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} /> Back
                  </button>
                </div>

                <form onSubmit={savePerson}>
                  <div className="form-grid">
                    <label>
                      Full Name *
                      <input
                        required
                        value={personForm.name}
                        onChange={(e) =>
                          setPersonForm({ ...personForm, name: e.target.value })
                        }
                        placeholder="Enter full name"
                      />
                    </label>

                    <label>
                      USN *
                      <input
                        required
                        value={personForm.usn}
                        onChange={(e) =>
                          setPersonForm({ ...personForm, usn: e.target.value })
                        }
                        placeholder="Enter USN"
                      />
                    </label>

                    <label>
                      Email
                      <input
                        type="email"
                        value={personForm.email}
                        onChange={(e) =>
                          setPersonForm({ ...personForm, email: e.target.value })
                        }
                        placeholder="Enter email"
                      />
                    </label>

                    <label>
                      Department
                      <select
                        value={personForm.department}
                        onChange={(e) =>
                          setPersonForm({
                            ...personForm,
                            department: e.target.value
                          })
                        }
                      >
                        <option>CSE</option>
                        <option>ISE</option>
                        <option>ECE</option>
                        <option>EEE</option>
                        <option>ME</option>
                        <option>CV</option>
                      </select>
                    </label>

                    {peopleTab === "students" && (
                      <label>
                        Semester
                        <select
                          value={personForm.semester}
                          onChange={(e) =>
                            setPersonForm({
                              ...personForm,
                              semester: e.target.value
                            })
                          }
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <option key={sem} value={String(sem)}>
                              Semester {sem}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => setShowPersonForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      <FontAwesomeIcon icon={faSave} />
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="management-section">
                <div className="management-toolbar">
                  <div className="table-search">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                      placeholder="Search by name, USN or email..."
                      value={peopleSearch}
                      onChange={(e) => setPeopleSearch(e.target.value)}
                    />
                  </div>

                  <button className="primary-button" onClick={openAddPerson}>
                    <FontAwesomeIcon icon={faUserPlus} />
                    Add {peopleTab === "students" ? "Student" : "Teacher"}
                  </button>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>USN</th>
                        <th>Email</th>
                        <th>Department</th>
                        {peopleTab === "students" && <th>Semester</th>}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                        {peopleTab === "students" && studentsLoading ? (
                          <tr>
                            <td colSpan="6" className="empty-state">
                              Loading students...
                            </td>
                          </tr>
                        ) : peopleTab === "students" && studentsError ? (
                          <tr>
                            <td colSpan="6" className="empty-state">
                              {studentsError}
                            </td>
                          </tr>
                        ) : filteredPeople.length > 0 ? (
                          filteredPeople.map((person) => (
                            <tr key={person.id}>
                              <td><strong>{person.name}</strong></td>
                              <td>{person.usn}</td>
                              <td>{person.email}</td>
                              <td>{person.department}</td>
                              {peopleTab === "students" && <td>{person.semester}</td>}
                              <td>
                                <div className="action-group">
                                  <button
                                    className="icon-action edit"
                                    title="Edit"
                                    onClick={() => openEditPerson(person)}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    className="icon-action delete"
                                    title="Remove"
                                    onClick={() => deletePerson(person.id)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={peopleTab === "students" ? 6 : 5}
                              className="empty-state"
                            >
                              No records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* UPDATES */}
{activeTab === "updates" && (
    <section className="admin-panel updates-panel">

        <div className="sub-tabs">
            <button
                className={updateTab === "add" ? "selected" : ""}
                onClick={() => setUpdateTab("add")}
            >
                <FontAwesomeIcon icon={faPlus} /> Add Update
            </button>

            <button
                className={updateTab === "added" ? "selected" : ""}
                onClick={() => {
                    setUpdateTab("added");
                    fetchLibraryUpdates();
                }}
            >
                <FontAwesomeIcon icon={faBell} /> Added Update
            </button>
        </div>

        {/* ADD UPDATE */}
        {updateTab === "add" && (
            <div className="management-section">

                <div className="updates-heading">
                    <div>
                        <h3>Add Library Updates</h3>
                        <p>Publish announcements to the Home page.</p>
                    </div>
                </div>

                <form onSubmit={handlePublishUpdates}>

                    {updateRows.map((message, index) => (
                        <div className="update-input-row" key={index}>

                            <label>
                                Update {index + 1}

                                <input
                                    value={message}
                                    placeholder="Enter update content..."
                                    onChange={(e) =>
                                        setUpdateRows(prev =>
                                            prev.map((row, i) =>
                                                i === index ? e.target.value : row
                                            )
                                        )
                                    }
                                />
                            </label>

                            {updateRows.length > 1 && (
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setUpdateRows(prev =>
                                            prev.filter((_, i) => i !== index)
                                        )
                                    }
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    Remove
                                </button>
                            )}

                        </div>
                    ))}

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setUpdateRows(prev => [...prev, ""])}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Add Row
                    </button>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={updatesSaving}
                        >
                            <FontAwesomeIcon icon={faSave} />
                            {updatesSaving ? "Publishing..." : "Publish Updates"}
                        </button>
                    </div>

                </form>
            </div>
        )}

        {/* ADDED UPDATE */}
        {updateTab === "added" && (
            <div className="management-section">

                <div className="updates-heading">
                    <div>
                        <h3>Published Library Updates</h3>
                        <p>Manage announcements displayed on the Home page.</p>
                    </div>

                    <FontAwesomeIcon icon={faRotate} />
                </div>

                {updatesLoading ? (
                    <div className="empty-state">Loading updates...</div>
                ) : libraryUpdates.length > 0 ? (

                    libraryUpdates.map(update => (
                        <div className="update-item" key={update.update_id}>

                            <div className="update-icon">
                                <FontAwesomeIcon icon={faBell} />
                            </div>

                            <div className="update-content">
                                <strong>Library Announcement</strong>
                                <p>{update.message}</p>
                            </div>

                            <button
                                className="icon-action delete"
                                disabled={deletingUpdateId === update.update_id}
                                onClick={() => handleDeleteUpdate(update.update_id)}
                                title="Delete update"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>

                        </div>
                    ))

                ) : (
                    <div className="empty-state">
                        No updates published yet.
                    </div>
                )}

            </div>
        )}

    </section>
)}

        <footer className="admin-footer">
          Agentic AI Smart Library Management System
        </footer>
      </main>

      {/* ADD SUBJECT MODAL */}
      {showSubjectModal && (
        <div
          className="subject-modal-overlay"
          onClick={() => setShowSubjectModal(false)}
        >
          <div
            className="subject-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="subject-modal-header">
              <div>
                <h3>Add New Subject</h3>
                <p>Enter the subject details below.</p>
              </div>

              <button
                type="button"
                className="subject-modal-close"
                onClick={() => setShowSubjectModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubjectSubmit}>
              <div className="subject-modal-fields">
                <label>
                  Department *
                  <select
                    required
                    value={subjectForm.department_id}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        department_id: e.target.value
                      })
                    }
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name} ({department.department_code})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Semester *
                  <select
                    required
                    value={subjectForm.semester_id}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        semester_id: e.target.value
                      })
                    }
                  >
                    <option value="">Select Semester</option>

                    {semesters.map((semester) => (
                      <option
                        key={semester.semester_id}
                        value={semester.semester_id}
                      >
                        {semester.semester_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Subject Name *
                  <input
                    required
                    type="text"
                    placeholder="Enter subject name"
                    value={subjectForm.subject_name}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        subject_name: e.target.value
                      })
                    }
                  />
                </label>

                <label>
                  Subject Code *
                  <input
                    required
                    type="text"
                    placeholder="Enter subject code"
                    value={subjectForm.subject_code}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        subject_code: e.target.value
                      })
                    }
                  />
                </label>
              </div>

              <div className="subject-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowSubjectModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={subjectSaving}
                >
                  <FontAwesomeIcon icon={faSave} />
                  {subjectSaving ? "Saving..." : "Save Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


     {/* FINE WITHDRAWAL MODAL */}
{showWithdrawalModal && (
    <div className="payment-modal-overlay">
        <div className="payment-modal">

            {!withdrawalSuccess ? (
                <>
                    <button
                        className="payment-modal-close"
                        onClick={() => setShowWithdrawalModal(false)}
                    >
                        ×
                    </button>

                    <h2>Demo Payment</h2>

                    <p className="payment-modal-subtitle">
                        Payment integration will be completed before website launch.
                    </p>

                    <div className="payment-details">
                        <div>
                            <span>Admin</span>
                            <strong>{adminUsername || "N/A"}</strong>
                        </div>

                        <div>
                            <span>Total Available Balance</span>
                            <strong className="payment-amount">
                                ₹{Number(withdrawAmount || 0).toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <p className="payment-demo-note">
                        This is a demo payment. No real money will be deducted.
                    </p>

                    <form onSubmit={handleFineWithdrawal}>
                        <button
                            type="submit"
                            className="payment-confirm-button"
                            disabled={
                                withdrawLoading ||
                                Number(withdrawAmount) <= 0
                            }
                        >
                            {withdrawLoading
                                ? "Processing..."
                                : `Withdraw ₹${Number(withdrawAmount || 0).toFixed(2)}`}
                        </button>
                    </form>
                </>
            ) : (
                <div className="payment-success">
                    <div className="payment-success-icon">✓</div>

                    <h2>Withdraw Successful!</h2>

                    <h3>
                        ₹{Number(completedWithdrawalAmount).toFixed(2)}
                    </h3>

                    <p>
                        Your withdrawal has been completed successfully.
                    </p>

                    <button
                        className="payment-confirm-button"
                        onClick={() => {
                            setShowWithdrawalModal(false);
                            setWithdrawAmount("");
                            setWithdrawRemarks("");
                            setWithdrawalSuccess(false);
                        }}
                    >
                        Done
                    </button>
                </div>
            )}

        </div>
    </div>
)}

      {/* NOTIFICATION */}
      {notice && (
        <div className="admin-toast">
          <FontAwesomeIcon icon={faCheckCircle} />
          {notice}
        </div>
      )}

      {/* ALL CSS IN THIS JSX FILE */}
      <style>{`
          
          html, body, #root {
          width: 100%;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        * {
          box-sizing: border-box;
        }

        .admin-dashboard {
          min-height: 100vh;
          background: #f7f9fc;
          color: #102b55;
          font-family: "Inter", "Segoe UI", sans-serif;
        }

        .admin-header {
          height: 82px;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #ffffff;
          border-bottom: 1px solid #e8edf4;
          box-shadow: 0 2px 12px rgba(16, 43, 85, 0.05);
        }

        .admin-header img {
          width: 70px;
          height: 70px;
          object-fit: contain;
          transform: scale(2.1);
        }

        .admin-header-label {
          position: absolute;
          right: 125px;
          font-size: 11px;
          letter-spacing: 1.4px;
          font-weight: 750;
          color: #2878e5;
        }

        .admin-logout-button {
          position: absolute;
          right: 25px;
          padding: 9px 16px;
          border: 1px solid #2878e5;
          border-radius: 7px;
          background: #edf4ff;
          color: #2878e5;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .admin-logout-button:hover {
          background: #2878e5;
          color: #ffffff;
        }

        .admin-main {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 35px 3%;
        }

        .admin-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
        }

        .admin-eyebrow {
          color: #2878e5;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
        }

        .admin-welcome h1 {
          margin: 8px 0 5px;
          color: #102b55;
          font-size: 28px;
          font-weight: 750;
        }

        .admin-welcome p,
        .section-heading p {
          margin: 0;
          color: #8492a6;
          font-size: 13px;
        }

        .admin-date {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #61738b;
          background: #ffffff;
          border: 1px solid #e8edf4;
          border-radius: 8px;
          padding: 11px 15px;
          font-size: 12px;
        }

        /* SUMMARY */

        .admin-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e9eef5;
          border-radius: 11px;
          min-width: 0;
        }

        .stat-icon {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 18px;
        }

        .stat-icon.blue {
          background: #eaf2ff;
          color: #2878e5;
        }

        .stat-icon.orange {
          background: #fff3e6;
          color: #e68a29;
        }

        .stat-icon.green {
          background: #e8f8ef;
          color: #239b5c;
        }

        .stat-icon.red {
          background: #fff0f0;
          color: #df5656;
        }

        .stat-card span {
          display: block;
          color: #8492a6;
          font-size: 11px;
        }

        .stat-card h2 {
          margin: 5px 0 3px;
          font-size: 24px;
          color: #102b55;
        }

        .stat-card small {
          color: #9aa7b7;
          font-size: 10px;
        }

        /* MAIN NAVIGATION */

        .admin-tabs {
          display: flex;
          align-items: stretch;
          gap: 5px;
          overflow-x: auto;
          border-bottom: 1px solid #e3eaf2;
          scrollbar-width: thin;
          margin-bottom: 27px;
        }

        .admin-tabs button {
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 15px 14px;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #718198;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .admin-tabs button:hover {
          color: #2878e5;
          background: #f0f5ff;
        }

        .admin-tabs button.active {
          color: #2878e5;
          border-bottom-color: #2878e5;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          border-radius: 20px;
          background: #fff0e4;
          color: #d87920;
          font-size: 10px;
        }

        .section-heading {
          margin-bottom: 17px;
        }

        .section-heading h2 {
          margin: 0 0 5px;
          font-size: 19px;
          color: #102b55;
        }

        /* PANEL */

        .admin-panel {
          min-height: 350px;
          background: #ffffff;
          border: 1px solid #e8edf4;
          border-radius: 12px;
          overflow: hidden;
        }

        .sub-tabs {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 16px 22px;
          border-bottom: 1px solid #edf0f5;
          overflow-x: auto;
        }

        .sub-tabs button {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: #75849a;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .sub-tabs button:hover {
          background: #f3f7ff;
          color: #2878e5;
        }

        .sub-tabs button.selected {
          color: #2878e5;
          background: #edf4ff;
          border-color: #dceaff;
        }

        /* FORMS */

        .form-section {
          padding: 25px;
        }

        .form-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 24px;
        }

        .form-heading h3,
        .updates-heading h3 {
          margin: 0 0 6px;
          font-size: 16px;
          color: #102b55;
        }

        .form-heading p,
        .updates-heading p {
          margin: 0;
          font-size: 12px;
          color: #8492a6;
        }

        .form-heading > svg {
          color: #2878e5;
          font-size: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 19px;
        }

        .form-grid label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #425773;
          font-size: 12px;
          font-weight: 650;
        }

        .form-grid input,
        .form-grid select,
        .form-grid textarea {
          width: 100%;
          min-height: 43px;
          padding: 11px 13px;
          border: 1px solid #dfe6ef;
          border-radius: 7px;
          background: #ffffff;
          outline: none;
          color: #102b55;
          font: inherit;
          font-size: 12px;
          transition: 0.2s ease;
        }

        .form-grid textarea {
          resize: vertical;
          min-height: 95px;
        }

        .form-grid input:focus,
        .form-grid select:focus,
        .form-grid textarea:focus {
          border-color: #2878e5;
          box-shadow: 0 0 0 3px rgba(40, 120, 229, 0.09);
        }

        .form-grid input::placeholder,
        .form-grid textarea::placeholder {
          color: #a5afbd;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #edf0f5;
        }

        .primary-button,
        .secondary-button,
        .small-primary,
        .back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 7px;
          padding: 11px 17px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .primary-button,
        .small-primary {
          color: #ffffff;
          background: #2878e5;
        }

        .primary-button:hover,
        .small-primary:hover {
          background: #155fc5;
        }

        .secondary-button {
          background: #eef2f7;
          color: #52647b;
        }

        .secondary-button:hover {
          background: #e1e8f1;
        }

        .back-button {
          background: #edf4ff;
          color: #2878e5;
        }

        /* TABLE TOOLBAR */

        .management-section {
          padding: 22px;
        }

        .management-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .table-search {
          flex: 1;
          min-width: 180px;
          height: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          border: 1px solid #e1e7ef;
          border-radius: 7px;
          color: #8b9aaf;
        }

        .table-search:focus-within {
          border-color: #2878e5;
        }

        .table-search input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #102b55;
          font-size: 12px;
        }

        .filter-control {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border: 1px solid #e1e7ef;
          border-radius: 7px;
          color: #8492a6;
        }

        .filter-control select {
          max-width: 150px;
          border: none;
          outline: none;
          background: transparent;
          color: #52647b;
          font-size: 11px;
        }

        /* TABLE */

        .table-container {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 650px;
        }

        thead {
          background: #f7f9fc;
        }

        th {
          padding: 14px 13px;
          color: #75849a;
          font-size: 10px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        td {
          padding: 15px 13px;
          border-bottom: 1px solid #edf0f5;
          color: #52647b;
          font-size: 12px;
          vertical-align: middle;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #fbfcff;
        }

        .book-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 220px;
        }

        .book-cover {
          width: 39px;
          height: 47px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          background: #edf4ff;
          color: #2878e5;
        }

        .book-cell strong,
        .member-cell strong {
          display: block;
          max-width: 280px;
          color: #102b55;
          font-size: 12px;
          font-weight: 650;
        }

        .book-cell span,
        .member-cell span {
          display: block;
          margin-top: 4px;
          color: #8492a6;
          font-size: 11px;
        }

        .book-cell small,
        .member-cell small {
          display: block;
          margin-top: 3px;
          color: #a1acba;
          font-size: 10px;
        }

        .member-cell strong {
          font-size: 12px;
        }

        .icon-action {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .icon-action.edit {
          color: #2878e5;
          background: #edf4ff;
        }

        .icon-action.edit:hover {
          background: #dceaff;
        }

        .icon-action.delete {
          color: #df5656;
          background: #fff0f0;
        }

        .icon-action.delete:hover {
          background: #ffe0e0;
        }

        .icon-action.approve {
          color: #239b5c;
          background: #e8f8ef;
        }

        .icon-action.approve:hover {
          background: #d5f1e1;
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .status {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .status.pending,
        .status.unpaid {
          color: #b87520;
          background: #fff5e8;
        }

        .status.approved,
        .status.paid {
          color: #228b54;
          background: #e9f8ef;
        }

        .status.rejected {
          color: #d54c4c;
          background: #fff0f0;
        }

        .completed-label {
          color: #8492a6;
          font-size: 11px;
          font-weight: 600;
        }

        .amount {
          color: #102b55;
          font-weight: 700;
        }

        .empty-state {
          padding: 35px;
          text-align: center;
          color: #98a5b6;
        }

        .helper-note {
          margin: 17px 0 0;
          color: #8998aa;
          font-size: 11px;
          line-height: 1.6;
        }

        /* FINE WITHDRAWAL FORM */
        .fine-withdrawal-form {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 12px;
            align-items: center;
            margin-top: 15px;
        }

        .fine-withdrawal-form input {
            width: 100%;
            min-width: 0;
            height: 42px;
            padding: 10px 13px;
            border: 1px solid #dfe6ef;
            border-radius: 7px;
            outline: none;
            color: #102b55;
            font-size: 12px;
        }

        .fine-withdrawal-form input:focus {
            border-color: #2878e5;
        }

        @media (max-width: 700px) {
            .fine-withdrawal-form {
                grid-template-columns: 1fr;
            }

            .fine-withdrawal-form button {
                width: 100%;
            }

            .fine-summary-stats {
                flex-wrap: wrap;
            }

            .fine-summary-stats .stat-card {
                flex: 1 1 100%;
                max-width: 100%;
            }
        }

        /* FINE SUMMARY */

        .fine-summary {
          margin: 22px 22px 0;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 9px;
          background: #fff8f1;
          border: 1px solid #f8eadb;
        }

        .fine-summary span {
          color: #9c754e;
          font-size: 11px;
        }

        .fine-summary h2 {
          margin: 5px 0 0;
          color: #a55b1b;
          font-size: 25px;
        }

        .fine-summary > svg {
          color: #d98b43;
          font-size: 25px;
        }

        /* UPDATES */

        /* UPDATE INPUT ROWS */
.update-input-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 14px;
}

.update-input-row label {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #425773;
    font-size: 12px;
    font-weight: 650;
}

.update-input-row input {
    width: 100%;
    min-height: 43px;
    padding: 11px 13px;
    border: 1px solid #dfe6ef;
    border-radius: 7px;
    outline: none;
    color: #102b55;
    font: inherit;
    font-size: 12px;
}

.update-input-row input:focus {
    border-color: #2878e5;
    box-shadow: 0 0 0 3px rgba(40, 120, 229, 0.09);
}

@media (max-width: 700px) {
    .update-input-row {
        align-items: stretch;
        flex-direction: column;
    }
}

        .updates-panel {
          padding: 23px;
        }

        .updates-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .updates-heading > svg {
          color: #2878e5;
          font-size: 20px;
        }

        .update-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px 5px;
          border-bottom: 1px solid #edf0f5;
        }

        .update-item:last-child {
          border-bottom: none;
        }

        .update-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #edf4ff;
          color: #2878e5;
        }

        .update-content {
          flex: 1;
        }

        .update-content strong {
          color: #102b55;
          font-size: 12px;
        }

        .update-content p {
          margin: 5px 0 0;
          color: #8492a6;
          font-size: 11px;
        }

        .update-item > span {
          color: #a0abba;
          font-size: 10px;
        }

        /* FOOTER AND TOAST */

        .admin-footer {
          padding: 25px 0 10px;
          text-align: center;
          color: #9aa7b7;
          font-size: 11px;
        }

        .admin-toast {
          position: fixed;
          right: 25px;
          bottom: 25px;
          z-index: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: calc(100vw - 40px);
          padding: 14px 18px;
          border-radius: 9px;
          background: #102b55;
          color: #ffffff;
          box-shadow: 0 8px 25px rgba(16, 43, 85, 0.2);
          font-size: 12px;
        }

        .admin-toast svg {
          color: #70d9a0;
        }

        /* SUBJECT DROPDOWN */
        .subject-select-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .subject-select-row select {
          flex: 1;
          min-width: 0;
        }

        .add-subject-button {
          min-height: 43px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #2878e5;
          border-radius: 7px;
          background: #edf4ff;
          color: #2878e5;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
          cursor: pointer;
        }

        .add-subject-button:hover {
          background: #dceaff;
        }

        /* SUBJECT MODAL */

        .subject-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(10, 25, 48, 0.55);
        }

        .subject-modal {
          width: 100%;
          max-width: 480px;
          padding: 25px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.18);
        }

        .subject-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 23px;
        }

        .subject-modal-header h3 {
          margin: 0 0 6px;
          color: #102b55;
          font-size: 18px;
        }

        .subject-modal-header p {
          margin: 0;
          color: #8492a6;
          font-size: 12px;
        }

        .subject-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: #fff0f0;
          color: #df5656;
          cursor: pointer;
        }

        .subject-modal-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 17px;
        }

        .subject-modal-fields label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #425773;
          font-size: 12px;
          font-weight: 650;
        }

        .subject-modal-fields input,
        .subject-modal-fields select {
          width: 100%;
          min-height: 43px;
          padding: 11px 13px;
          border: 1px solid #dfe6ef;
          border-radius: 7px;
          background: #ffffff;
          outline: none;
          color: #102b55;
          font-size: 12px;
        }

        .subject-modal-fields input:focus,
        .subject-modal-fields select:focus {
          border-color: #2878e5;
          box-shadow: 0 0 0 3px rgba(40, 120, 229, 0.09);
        }

        .subject-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
          padding-top: 18px;
          border-top: 1px solid #edf0f5;
        }

        .subject-modal-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .subject-modal {
            padding: 19px;
          }

          .subject-modal-fields {
            grid-template-columns: 1fr;
          }

          .subject-modal-actions {
            flex-direction: column-reverse;
          }

          .subject-modal-actions button {
            width: 100%;
          }
        }

        /* RESPONSIVE */

        @media (max-width: 1050px) {
          .admin-main {
            padding: 28px 25px;
          }

          .admin-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .admin-header {
            height: 72px;
          }

          .admin-header img {
            width: 58px;
            height: 58px;
            transform: scale(1.8);
          }

          .admin-header-label {
            right: 100px;
            font-size: 9px;
          }

          .admin-logout-button {
            right: 10px;
            padding: 8px 11px;
            font-size: 10px;
          }

          .admin-main {
            padding: 23px 14px;
          }

          .admin-welcome {
            align-items: flex-start;
          }

          .admin-welcome h1 {
            font-size: 23px;
          }

          .admin-date {
            display: none;
          }

          .admin-stats {
            gap: 10px;
          }

          .stat-card {
            padding: 13px;
            gap: 10px;
          }

          .stat-icon {
            width: 37px;
            height: 37px;
            font-size: 15px;
          }

          .stat-card h2 {
            font-size: 20px;
          }

          .stat-card span {
            font-size: 10px;
          }

          .admin-tabs {
            margin-right: -14px;
            padding-right: 14px;
          }

          .admin-tabs button {
            padding: 13px 11px;
            font-size: 11px;
          }

          .sub-tabs {
            padding: 12px;
          }

          .sub-tabs button {
            padding: 9px 11px;
            font-size: 11px;
          }

          .form-section,
          .management-section,
          .updates-panel {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .full-width {
            grid-column: auto;
          }

          .management-toolbar {
            flex-wrap: wrap;
          }

          .table-search {
            flex-basis: 100%;
          }

          .filter-control {
            flex: 1;
          }

          .filter-control select {
            max-width: 100%;
            width: 100%;
          }

          .management-toolbar > .primary-button {
            width: 100%;
          }

          .fine-summary {
            margin: 15px 15px 0;
          }

          .update-item {
            align-items: flex-start;
          }

          .update-item > span {
            white-space: nowrap;
          }
        }

        @media (max-width: 390px) {
          .admin-stats {
            grid-template-columns: 1fr;
          }

          .admin-welcome h1 {
            font-size: 21px;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions button {
            width: 100%;
          }
        }
          /* DEMO PAYMENT MODAL */

.payment-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(8, 20, 40, 0.65);
    backdrop-filter: blur(4px);
}

.payment-modal {
    position: relative;
    width: 100%;
    max-width: 440px;
    padding: 32px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
    animation: paymentModalOpen 0.25s ease;
}

@keyframes paymentModalOpen {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.payment-modal-close {
    position: absolute;
    top: 12px;
    right: 16px;
    border: none;
    background: transparent;
    color: #718096;
    font-size: 27px;
    cursor: pointer;
}

.payment-modal h2 {
    margin: 0 0 9px;
    color: #102b55;
    font-size: 23px;
    font-weight: 750;
}

.payment-modal-subtitle {
    margin: 0 0 25px;
    color: #718096;
    font-size: 13px;
    line-height: 1.6;
}

.payment-details {
    display: flex;
    flex-direction: column;
    gap: 17px;
    padding: 20px;
    background: #f7f9fc;
    border: 1px solid #e8edf4;
    border-radius: 10px;
}

.payment-details div {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.payment-details span {
    color: #8492a6;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.payment-details strong {
    color: #243b5a;
    font-size: 14px;
    overflow-wrap: anywhere;
}

.payment-details .payment-amount {
    color: #16834a;
    font-size: 23px;
}

.payment-demo-note {
    margin: 17px 0;
    color: #718096;
    font-size: 11px;
    line-height: 1.5;
    text-align: center;
}

.payment-confirm-button {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    background: #2878e5;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;
}

.payment-confirm-button:hover {
    background: #1763c7;
}

.payment-confirm-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.payment-success {
    padding: 15px 0 5px;
    text-align: center;
}

.payment-success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 68px;
    height: 68px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: #e8f8ef;
    color: #16a34a;
    font-size: 38px;
    font-weight: 700;
}

.payment-success p {
    margin: 10px 0 25px;
    color: #718096;
    font-size: 13px;
}

@media (max-width: 480px) {
    .payment-modal {
        padding: 26px 20px;
    }
}

/* CENTER FINE SUMMARY CARDS */

.fine-summary-stats {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 20px;
}

.fine-summary-stats .stat-card {
    flex: 0 1 380px;
    max-width: 380px;
}

.stat-card > div:last-child {
    flex: 1;
    min-width: 0;
}

.stat-card > div:last-child .primary-button {
    width: 100%;
    display: block;
    margin-top: 12px;
    box-sizing: border-box;
}


      `}</style>
    </div>
  );
}

export default AdminDashboard;
