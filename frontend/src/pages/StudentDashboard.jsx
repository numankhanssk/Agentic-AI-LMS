import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUser,
  faChevronDown,
  faBookOpen,
  faCamera,
  faSignOutAlt,
  faUserCircle,
  faShoppingCart,
  faPlus,
  faCheck,
  faFilter,
  faBook,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

import HomeIcon from "../assets/HomeIcon.png";

const API = "http://localhost:5000";

function StudentDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("studentToken");

  // HEADER AND PROFILE
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [student, setStudent] = useState({
    name: "",
    usn: "",
    email: "",
    profile_photo: ""
  });

  const [photoLoading, setPhotoLoading] = useState(false);

  // PHOTO CROPPER
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // BOOK DASHBOARD
  const [activeTab, setActiveTab] = useState("all");
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");
  const [filtersLoading, setFiltersLoading] = useState(true);

// Cart stored in MySQL
const [cart, setCart] = useState([]);
const [cartLoading, setCartLoading] = useState(false);
const [cartActionLoading, setCartActionLoading] = useState(false);

// Student order tracking
const [orders, setOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(false);
const [ordersError, setOrdersError] = useState("");
const [extensionLoadingId, setExtensionLoadingId] = useState(null);
const [clearReturnedLoading, setClearReturnedLoading] = useState(false);
const [fineActionLoadingId, setFineActionLoadingId] = useState(null);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedFine, setSelectedFine] = useState(null);
const [paymentSuccess, setPaymentSuccess] = useState(false);
const [istNow, setIstNow] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setIstNow(new Date());
  }, 30000);

  return () => clearInterval(timer);
}, []);

  const getPhotoUrl = (photo) => {
    if (!photo) return "";

    if (photo.startsWith("http")) return photo;

    return `${API}${photo.startsWith("/") ? "" : "/"}${photo}`;
  };

  const getBookImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) return image;

    // Book images such as /books/CSE/3rd-sem/dsa.jpg
    // should be placed inside frontend/public/books.
    return `${window.location.origin}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  // --------------------------------------------------
  // FETCH STUDENT DETAILS
  // --------------------------------------------------

  useEffect(() => {
    const fetchStudent = async () => {
      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API}/api/students/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Unable to fetch student details.");
        }

        const data = await response.json();
        const details = data.student || data.data || data;

        setStudent({
          name: details.student_name || details.name || "",
          usn: details.usn || "",
          email: details.email || "",
          profile_photo: details.profile_photo || ""
        });
      } catch (err) {
        console.error("Student fetch error:", err);
      }
    };

    fetchStudent();
  }, [token, navigate]);

  // --------------------------------------------------
  // FETCH SEMESTERS AND DEPARTMENTS
  // --------------------------------------------------

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);

        const response = await fetch(`${API}/api/books/filters`);

        if (!response.ok) {
          throw new Error("Unable to fetch book filters.");
        }

        const data = await response.json();

        setSemesters(data.semesters || []);
        setDepartments(data.departments || []);

        // Default department to the first available department.
        if (data.departments?.length > 0) {
          setSelectedDepartment(
            String(data.departments[0].department_id)
          );
        }
      } catch (err) {
        console.error("Filter fetch error:", err);
        setBooksError("Unable to load semester and department filters.");
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // --------------------------------------------------
  // FETCH BOOKS
  // --------------------------------------------------

  const fetchBooks = async (semesterId = "", departmentId = "") => {
    try {
      setBooksLoading(true);
      setBooksError("");

      const params = new URLSearchParams();

      if (semesterId) {
        params.append("semester_id", semesterId);
      }

      if (departmentId) {
        params.append("department_id", departmentId);
      }

      const url = `${API}/api/books${params.toString() ? `?${params}` : ""}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to fetch books.");
      }

      const data = await response.json();

      setBooks(data.books || []);
    } catch (err) {
      console.error("Books fetch error:", err);
      setBooksError("Unable to load books. Please try again.");
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  // Load all books when the dashboard opens.
  useEffect(() => {
    fetchBooks();
  }, []);

  // Apply filters only after clicking Apply.
  const handleApplyFilters = () => {
    fetchBooks(selectedSemester, selectedDepartment);
  };

// --------------------------------------------------
// BOOK CART - MYSQL API
// --------------------------------------------------

const fetchCart = async () => {
  try {
    setCartLoading(true);

    const response = await fetch(`${API}/api/students/cart`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load cart.");
    }

    setCart(data.books || []);
  } catch (err) {
    console.error("Cart fetch error:", err);
    alert(err.message || "Unable to load your cart.");
  } finally {
    setCartLoading(false);
  }
};


// FETCH STUDENT ORDERS
const fetchOrders = async () => {
  try {
    setOrdersLoading(true);
    setOrdersError("");

    const response = await fetch(`${API}/api/students/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load orders.");
    }

    setOrders(data.orders || []);
  } catch (err) {
    console.error("Fetch orders error:", err);
    setOrdersError(err.message || "Unable to load your orders.");
  } finally {
    setOrdersLoading(false);
  }
};

const handlePayFine = (order) => {
  setSelectedFine(order);
  setPaymentSuccess(false);
  setShowPaymentModal(true);
};

const handleConfirmDemoPayment = async () => {
  if (!selectedFine) return;

  try {
    setFineActionLoadingId(selectedFine.order_item_id);

    const response = await fetch(
      `${API}/api/students/fines/${selectedFine.order_item_id}/pay`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Payment failed.");
    }

    setPaymentSuccess(true);
    await fetchOrders();

  } catch (error) {
    console.error("Demo payment error:", error);
    alert(error.message || "Payment failed.");
  } finally {
    setFineActionLoadingId(null);
  }
};

const handleClearFine = async (orderItemId) => {
  if (!window.confirm("Clear this paid fine from your Fine Amounts list?")) return;

  try {
    setFineActionLoadingId(orderItemId);

    const response = await fetch(
      `${API}/api/students/fines/${orderItemId}/clear`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to clear fine.");
    }

    await fetchOrders();
    alert(data.message || "Paid fine cleared successfully!");
  } catch (error) {
    console.error("Clear fine error:", error);
    alert(error.message || "Unable to clear fine.");
  } finally {
    setFineActionLoadingId(null);
  }
};

// CLEAR ONLY RETURNED BOOKS
const handleClearReturnedBooks = async () => {
  const returnedBooks = orders.filter(
    (order) => order.return_status === "Returned"
  );

  if (returnedBooks.length === 0) {
    alert("There are no returned books to clear.");
    return;
  }

  if (
    !window.confirm(
      `Are you sure you want to clear ${returnedBooks.length} returned book(s)?`
    )
  ) {
    return;
  }

  try {
    setClearReturnedLoading(true);

    const response = await fetch(
      `${API}/api/students/orders/clear-returned`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to clear returned books.");
    }

    await fetchOrders();

    alert(data.message || "Returned books cleared successfully!");
  } catch (err) {
    console.error("Clear returned books error:", err);
    alert(err.message || "Unable to clear returned books.");
  } finally {
    setClearReturnedLoading(false);
  }
};

useEffect(() => {
  if (token && (activeTab === "track" || activeTab === "fine")) {
    fetchOrders();
  }
}, [activeTab, token]);

// Load saved cart when dashboard opens
useEffect(() => {
  if (token) {
    fetchCart();
  }
}, [token]);

// ADD BOOK
const handleAddToCart = async (book) => {
  if (cart.some((item) => item.book_id === book.book_id)) {
    alert("This book is already in your Added Books list.");
    return;
  }

  if (cart.length >= 5) {
    alert("You can add a maximum of 5 books at a time.");
    return;
  }

  if (Number(book.available_copies) <= 0) {
    alert("This book is currently unavailable.");
    return;
  }

  try {
    setCartActionLoading(true);

    const response = await fetch(`${API}/api/students/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        book_id: book.book_id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to add book.");
    }

    await fetchCart();
    await fetchBooks(selectedSemester, selectedDepartment);

    alert("Book added successfully!");
  } catch (err) {
    console.error("Add cart error:", err);
    alert(err.message || "Unable to add book.");
  } finally {
    setCartActionLoading(false);
  }
};

// REMOVE BOOK
const handleRemoveFromCart = async (bookId) => {
  try {
    setCartActionLoading(true);

    const response = await fetch(
      `${API}/api/students/cart/${bookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to remove book.");
    }

    await fetchCart();
    await fetchBooks(selectedSemester, selectedDepartment);

    alert("Book removed successfully!");
  } catch (err) {
    console.error("Remove cart error:", err);
    alert(err.message || "Unable to remove book.");
  } finally {
    setCartActionLoading(false);
  }
};

// PLACE ORDER
const handlePlaceOrder = async () => {
  if (cart.length === 0) {
    alert("Please add at least one book before placing an order.");
    return;
  }

  if (!window.confirm("Are you sure you want to place this order?")) {
    return;
  }

  try {
    setCartActionLoading(true);

    const response = await fetch(`${API}/api/students/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to place order.");
    }

    await fetchCart();
    await fetchBooks(selectedSemester, selectedDepartment);

    alert("Placed Order Successfully!");

    setActiveTab("track");
  } catch (err) {
    console.error("Place order error:", err);
    alert(err.message || "Unable to place order.");
  } finally {
    setCartActionLoading(false);
  }
};

const isBookAdded = (bookId) =>
  cart.some((book) => book.book_id === bookId);

  // --------------------------------------------------
  // BOOK SEARCH
  // --------------------------------------------------

  const searchBooks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/books/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Unable to search books.");
      }

      const data = await response.json();
      const results = data.books || data.results || [];

      setSearchResults(Array.isArray(results) ? results : []);
      setShowResults(true);
    } catch (err) {
      console.error("Book search error:", err);
      setError("Unable to connect to the library server.");
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setShowResults(false);
      setError("");
      return;
    }

    const timer = setTimeout(() => {
      searchBooks(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    searchBooks(searchQuery);
  };

  const handleBookSelect = (book) => {
    setSearchQuery(book.book_name);
    setShowResults(false);
    setActiveTab("all");
  };

  // --------------------------------------------------
  // PROFILE PHOTO
  // --------------------------------------------------

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be below 5 MB.");
      e.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setShowCropper(true);

    e.target.value = "";
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const getCroppedImage = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      throw new Error("Please select and adjust your photo.");
    }

    const image = new Image();
    image.src = selectedImage;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () =>
        reject(new Error("Unable to load selected image."));
    });

    const canvas = document.createElement("canvas");

    canvas.width = Math.round(croppedAreaPixels.width);
    canvas.height = Math.round(croppedAreaPixels.height);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Unable to process the cropped image.");
    }

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Unable to crop image."));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSaveCroppedPhoto = async () => {
    try {
      if (!croppedAreaPixels) {
        alert("Please adjust your photo before saving.");
        return;
      }

      setPhotoLoading(true);

      const croppedBlob = await getCroppedImage();

      const formData = new FormData();
      formData.append("profile_photo", croppedBlob, "profile.jpg");

      const response = await fetch(
        `${API}/api/students/profile-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Photo upload failed.");
      }

      const photo = data.profile_photo || data.student?.profile_photo;

      if (!photo) {
        throw new Error("Photo uploaded, but no photo path was returned.");
      }

      setStudent((previous) => ({
        ...previous,
        profile_photo: photo
      }));

      setShowCropper(false);

      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }

      setSelectedImage(null);
      setCroppedAreaPixels(null);

      alert("Profile photo updated successfully!");
    } catch (err) {
      console.error("Photo upload error:", err);
      alert(err.message || "Unable to upload photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleCancelCrop = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setCroppedAreaPixels(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("student");
      localStorage.removeItem("role");
      navigate("/", { replace: true });
    }
  };

  // --------------------------------------------------
  // BOOK CARD
  // --------------------------------------------------

  const renderBookCard = (book) => {
    const added = isBookAdded(book.book_id);
    const unavailable = Number(book.available_copies) <= 0;

    return (
      <article className="library-book-card" key={book.book_id}>
        <div className="library-book-image">
          {book.image_url ? (
            <img
              src={getBookImageUrl(book.image_url)}
              alt={book.book_name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="book-image-fallback"
            style={{ display: book.image_url ? "none" : "flex" }}
          >
            <FontAwesomeIcon icon={faBookOpen} />
          </div>
        </div>

        <div className="library-book-info">
          <h3>{book.book_name}</h3>

          <p className="book-author">
            By {book.author || "Unknown Author"}
          </p>

          <div className="book-details">
            <p>
              <strong>ISBN:</strong> {book.isbn || "Not available"}
            </p>

            <p className="book-description">
              {book.description || "No description available."}
            </p>

            <p>
              <strong>Available Copies:</strong>{" "}
              <span className={unavailable ? "copies-zero" : "copies-count"}>
                {book.available_copies}
              </span>
            </p>

            {book.subject_names && (
              <p>
                <strong>Subject:</strong> {book.subject_names}
              </p>
            )}
          </div>

          <button
            type="button"
            className={`add-cart-button ${added ? "added" : ""}`}
            onClick={() => handleAddToCart(book)}
            disabled={
              added ||
              unavailable ||
              cart.length >= 5 ||
              cartActionLoading ||
              cartLoading
            }
          >
            <FontAwesomeIcon icon={added ? faCheck : faPlus} />
            {added
              ? "Added"
              : unavailable
                ? "Unavailable"
                : "Add to Cart"}
          </button>
        </div>
      </article>
    );
  };

  // --------------------------------------------------
  // MAIN CONTENT
  // --------------------------------------------------

  // FINE DETAILS

const fineOrders = orders.filter(
  (order) =>
    Number(order.fine_hidden_from_student || 0) === 0 &&
    (
      Number(order.fine_amount || 0) > 0 ||
      order.payment_status === "Paid"
    )
);

const totalOutstanding = fineOrders
  .filter((order) => order.payment_status !== "Paid")
  .reduce(
    (total, order) => total + Number(order.fine_amount || 0),
    0
  );

const pendingFineCount = fineOrders.filter(
  (order) => order.payment_status !== "Paid"
).length;

const paidFineCount = fineOrders.filter(
  (order) => order.payment_status === "Paid"
).length;

  const formatDate = (value) => {
    if (!value) return "—";

    const [year, month, day] = String(value).slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  };

  const getISTDetails = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(istNow);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value;

    return {
      date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
      minutes: Number(getPart("hour")) * 60 + Number(getPart("minute"))
    };
  };

  const handleExtendReturnDate = async (orderItemId) => {
    if (
      !window.confirm(
        "Are you sure you want to extend this book's return date by 15 days? This extension can only be used once."
      )
    ) {
      return;
    }

    try {
      setExtensionLoadingId(orderItemId);

      const response = await fetch(
        `${API}/api/students/orders/${orderItemId}/extend`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to extend return date.");
      }

      alert(data.message || "Return date extended successfully!");

      await fetchOrders();
    } catch (err) {
      console.error("Return date extension error:", err);
      alert(err.message || "Unable to extend return date.");
    } finally {
      setExtensionLoadingId(null);
    }
  };

  return (
    <div className="student-dashboard">

      {/* HEADER */}
      <header className="student-header">

        <div className="header-logo">
          <img src={HomeIcon} alt="Agentic AI Logo" />
        </div>

        <div className="search-area">
          <form className="header-search" onSubmit={handleSearch}>
            <FontAwesomeIcon icon={faSearch} className="search-icon" />

            <input
              type="text"
              placeholder="Search books, authors, subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowResults(true);
              }}
            />

            <button type="submit" className="search-button">
              Search
            </button>
          </form>

          {showResults && (
            <div className="search-results">
              {loading && (
                <div className="search-message">Searching books...</div>
              )}

              {!loading && error && (
                <div className="search-message error-message">{error}</div>
              )}

              {!loading && !error && searchResults.length === 0 && (
                <div className="search-message">No books found.</div>
              )}

              {!loading && !error && searchResults.length > 0 && (
                <>
                  <div className="results-heading">
                    Search Results ({searchResults.length})
                  </div>

                  {searchResults.map((book) => (
                    <button
                      type="button"
                      className="book-result"
                      key={book.book_id}
                      onClick={() => handleBookSelect(book)}
                    >
                      {book.image_url ? (
                        <img
                          src={getBookImageUrl(book.image_url)}
                          alt={book.book_name}
                          className="book-result-image"
                        />
                      ) : (
                        <div className="book-placeholder">
                          <FontAwesomeIcon icon={faBookOpen} />
                        </div>
                      )}

                      <div className="book-result-info">
                        <h4>{book.book_name}</h4>
                        <span>{book.author}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* STUDENT PROFILE */}
        <div className="profile-container">
          <button
            type="button"
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="profile-avatar">
              {student.profile_photo ? (
                <img
                  src={getPhotoUrl(student.profile_photo)}
                  alt="Student"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>

            <div className="profile-info">
              <h4>{student.name || "Loading..."}</h4>
              <span>{student.usn}</span>
            </div>

            <FontAwesomeIcon
              icon={faChevronDown}
              className={`profile-arrow ${showProfile ? "rotate" : ""}`}
            />
          </button>

          {showProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-profile-info">
                <div className="dropdown-avatar">
                  {student.profile_photo ? (
                    <img
                      src={getPhotoUrl(student.profile_photo)}
                      alt="Student Profile"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} />
                  )}
                </div>

                <div>
                  <strong>{student.name}</strong>
                  <span>{student.usn}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-action"
                onClick={handleEditPhoto}
                disabled={photoLoading}
              >
                <FontAwesomeIcon icon={faCamera} />
                {photoLoading ? "Uploading..." : "Edit Profile Photo"}
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-action logout-action"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard-content">

        <div className="dashboard-welcome">
          <div>
            <h1>Welcome to Your Library</h1>
            <p>Explore books and manage your library activities.</p>
          </div>

          <div className="cart-summary">
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Added Books</span>
            <strong>{cart.length}/5</strong>
          </div>
        </div>

        {/* TABS */}
        <nav className="dashboard-tabs">
          <button
            type="button"
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            <FontAwesomeIcon icon={faBookOpen} />
            All Books
            <span className="tab-count">{books.length}</span>
          </button>

          <button
            type="button"
            className={activeTab === "added" ? "active" : ""}
            onClick={() => setActiveTab("added")}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            Added Books
            <span className="tab-count">{cart.length}</span>
          </button>

          <button
            type="button"
            className={activeTab === "track" ? "active" : ""}
            onClick={() => setActiveTab("track")}
          >
            <FontAwesomeIcon icon={faBook} />
            Track the Books
          </button>

          <button
            type="button"
            className={activeTab === "fine" ? "active" : ""}
            onClick={() => setActiveTab("fine")}
          >
            Fine Amounts
          </button>

          {/* <button
            type="button"
            className={activeTab === "materials" ? "active" : ""}
            onClick={() => setActiveTab("materials")}
          >
            Teacher Study Materials
          </button> */}
        </nav>

        {/* ALL BOOKS TAB */}
        {activeTab === "all" && (
          <section className="tab-content">
            <div className="section-heading">
              <div>
                <h2>All Books</h2>
                <p>Find books from your department and semester.</p>
              </div>

              <div className="total-books">
                <FontAwesomeIcon icon={faBookOpen} />
                {books.length} Books
              </div>
            </div>

            {/* FILTERS */}
            <div className="book-filters">
              <div className="filter-title">
                <FontAwesomeIcon icon={faFilter} />
                Filter Books
              </div>

              <div className="filter-controls">
                <div className="filter-field">
                  <label htmlFor="semester-filter">Select Semester</label>

                  <select
                    id="semester-filter"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    disabled={filtersLoading}
                  >
                    <option value="">All Semesters</option>

                    {semesters.map((semester) => (
                      <option
                        key={semester.semester_id}
                        value={semester.semester_id}
                      >
                        {semester.semester_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="department-filter">Select Department</label>

                  <select
                    id="department-filter"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={filtersLoading}
                  >
                    <option value="">All Departments</option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_code} - {department.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="apply-filter-button"
                  onClick={handleApplyFilters}
                  disabled={filtersLoading || booksLoading}
                >
                  <FontAwesomeIcon icon={faFilter} />
                  Apply
                </button>
              </div>
            </div>

            {/* BOOK LIST */}
            {booksLoading && (
              <div className="dashboard-message">
                Loading books...
              </div>
            )}

            {!booksLoading && booksError && (
              <div className="dashboard-message error-message">
                {booksError}
              </div>
            )}

            {!booksLoading && !booksError && books.length === 0 && (
              <div className="empty-state">
                <FontAwesomeIcon icon={faBookOpen} />
                <h3>No Books Found</h3>
                <p>There are no books matching your selected filters.</p>
              </div>
            )}

            {!booksLoading && books.length > 0 && (
              <div className="books-grid">
                {books.map(renderBookCard)}
              </div>
            )}
          </section>
        )}

        {/* ADDED BOOKS TAB */}
        {activeTab === "added" && (
          <section className="tab-content">
            <div className="section-heading">
              <div>
                <h2>Added Books</h2>
                <p>Books you have added to your selection.</p>
              </div>

              <div className="total-books">
                <FontAwesomeIcon icon={faShoppingCart} />
                {cart.length}/5 Selected
              </div>
            </div>

            {cart.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                <button
                  type="button"
                  className="add-cart-button"
                  style={{ width: "auto", minWidth: "160px", padding: "12px 22px" }}
                  onClick={handlePlaceOrder}
                  disabled={cartActionLoading || cartLoading}
                >
                  {cartActionLoading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faShoppingCart} />
                <h3>No Books Added Yet</h3>
                <p>Go to All Books and add up to five books.</p>

                <button
                  type="button"
                  className="empty-state-button"
                  onClick={() => setActiveTab("all")}
                >
                  Browse Books
                </button>
              </div>
            ) : (
              <div className="books-grid">
                {cart.map((book) => (
                  <article className="library-book-card" key={book.book_id}>
                    <div className="library-book-image">
                      {book.image_url ? (
                        <img
                          src={getBookImageUrl(book.image_url)}
                          alt={book.book_name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}

                      <div
                        className="book-image-fallback"
                        style={{ display: book.image_url ? "none" : "flex" }}
                      >
                        <FontAwesomeIcon icon={faBookOpen} />
                      </div>
                    </div>

                    <div className="library-book-info">
                      <h3>{book.book_name}</h3>
                      <p className="book-author">
                        By {book.author || "Unknown Author"}
                      </p>

                      <div className="book-details">
                        <p>
                          <strong>ISBN:</strong> {book.isbn || "Not available"}
                        </p>
                        <p className="book-description">
                          {book.description || "No description available."}
                        </p>
                        <p>
                          <strong>Available Copies:</strong>{" "}
                          {book.available_copies}
                        </p>
                      </div>

                     <button
                        type="button"
                        className="remove-cart-button"
                        onClick={() => handleRemoveFromCart(book.book_id)}
                        disabled={cartActionLoading}
                      >
                      <FontAwesomeIcon icon={faTimes} />
                      {cartActionLoading ? "Please wait..." : "Remove"}
                    </button>
                    
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PLACEHOLDER TABS */}
        {activeTab === "track" && (
          <section className="tab-content">
            <div className="section-heading">
              <div>
                <h2>Track the Books</h2>
                <p>Track your book orders, collection and return status.</p>
              </div>

              <div style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <button
                  type="button"
                  className="remove-cart-button"
                  style={{
                    width: "auto",
                    minWidth: "160px",
                    padding: "12px 18px"
                  }}
                  onClick={handleClearReturnedBooks}
                  disabled={
                    ordersLoading ||
                    clearReturnedLoading ||
                    !orders.some((order) => order.return_status === "Returned")
                  }
                >
                  {clearReturnedLoading ? "Clearing..." : "Clear Returned Books"}
                </button>

                <button
                  type="button"
                  className="apply-filter-button"
                  onClick={fetchOrders}
                  disabled={ordersLoading || clearReturnedLoading}
                >
                  {ordersLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="library-policies">
              <h2 className="policy-main-heading">Library Policies</h2>

              <div className="policy-grid">

                <div className="policy-card">
                  <h3>Collection Policy</h3>
                  <ul>
                    <li>Provide your USN to the admin when collecting your book.</li>
                    <li>Collect your book within the assigned collection period.</li>
                    <li>If you fail to collect the book within the collection period, your order will be automatically cancelled.</li>
                    <li>
                      <strong>Collection Timings:</strong>
                      <br />
                      Monday – Friday: 9:00 AM – 3:30 PM
                      <br />
                      Saturday: 9:00 AM – 1:00 PM
                      <br />
                      <strong>Sunday:</strong> <strong style={{ color: "#DC2626" }}>Closed</strong>
                    </li>
                  </ul>
                </div>

                <div className="policy-card">
                  <h3>Return Policy</h3>
                  <ul>
                    <li>Return your book on or before the final return due date.</li>
                    <li>Extension is available only on the final return due date.</li>
                    <li>You can extend between 12:00 AM and 1:00 PM IST.</li>
                    <li>Only one extension of 15 days is permitted per book.</li>
                    <li>If you do not extend, your original due date remains unchanged.</li>
                    <li>If the extended date falls on Sunday, it moves to Monday.</li>
                  </ul>
                </div>

                <div className="policy-card">
                  <h3>Fine Policy</h3>
                  <ul>
                    <li>Return your book by 3:30 PM on the due date to avoid a late fine.</li>
                    <li>A late fine will be generated if the book is not returned by 3:30 PM.</li>
                    <li>Any applicable fine will be displayed in the Fine Amounts section.</li>
                  </ul>
                  <p className="fine-note">
                    <strong>Note:</strong> Collected fines will be exclusively used to organize skill-development events, workshops, and learning activities for students.
                  </p>
                </div>

              </div>
            </div>
            {ordersLoading && (
              <div className="dashboard-message">Loading your orders...</div>
            )}

            {!ordersLoading && ordersError && (
              <div className="dashboard-message error-message">
                {ordersError}
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length === 0 && (
              <div className="empty-state">
                <FontAwesomeIcon icon={faBook} />
                <h3>No Orders Yet</h3>
                <p>Your placed book orders will appear here.</p>
              </div>
            )}

            {!ordersLoading && !ordersError && orders.length > 0 && (
              <div className="books-grid">
                {orders.map((order) => (
                  <article className="library-book-card" key={order.order_item_id}>
                    <div className="library-book-image">
                      {order.image_url ? (
                        <img
                          src={getBookImageUrl(order.image_url)}
                          alt={order.book_name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}

                      <div
                        className="book-image-fallback"
                        style={{ display: order.image_url ? "none" : "flex" }}
                      >
                        <FontAwesomeIcon icon={faBookOpen} />
                      </div>
                    </div>

                    <div className="library-book-info">
                      <h3>{order.book_name}</h3>

                      <p className="book-author">
                        By {order.author || "Unknown Author"}
                      </p>

                      <div className="book-details">
                        <p>
                          <strong>Order ID:</strong> #{order.order_id}
                        </p>

                        <p>
                          <strong>Order Placed:</strong>{" "}
                          {new Date(order.order_date).toLocaleDateString("en-IN")}
                        </p>

                        <p>
                          <strong>Order Status:</strong>{" "}
                          <span className="copies-count">✓ Placed Successfully</span>
                        </p>

                        <p>
                          <strong>Collection Dates:</strong>{" "}
                          {formatDate(order.collection_start_date)} to{" "}
                          {formatDate(order.collection_end_date)}
                        </p>

                        <p>
                          <strong>Collection Timings:</strong>{" "}
                          Monday – Friday: 9:00 AM – 3:30 PM
                          {" | "}
                          Saturday: 9:00 AM – 1:00 PM
                          {" | "}
                          Sunday: Closed
                        </p>

                        <p>
                          <strong>Collection Status:</strong>{" "}
                          <span className={
                            order.collection_status === "Collected"
                              ? "copies-count"
                              : "copies-zero"
                          }>
                            {order.collection_status}
                          </span>
                        </p>

                        {order.collected_at && (
                          <p>
                            <strong>Collected On:</strong>{" "}
                            {new Date(order.collected_at).toLocaleDateString("en-IN")}
                          </p>
                        )}

                        {order.return_start_date && order.return_due_date && (
                          <p>
                            <strong>Return Dates:</strong>{" "}
                            {new Date(order.return_start_date).toLocaleDateString("en-IN")}{" "}
                            to{" "}
                            {new Date(order.return_due_date).toLocaleDateString("en-IN")}
                          </p>
                        )}

                        <p>
                          <strong>Return Status:</strong>{" "}
                          <span className={
                            order.return_status === "Returned"
                              ? "copies-count"
                              : "copies-zero"
                          }>
                            {order.return_status}
                          </span>
                        </p>

                        {Number(order.extension_count || 0) > 0 && (
                          <p className="copies-count">
                            ✓ Return date extended successfully (15 days)
                          </p>
                        )}

                        {order.collection_status === "Collected" &&
                        order.return_status === "Pending" &&
                        Number(order.extension_count || 0) < 1 &&
                        order.return_due_date && (() => {
                          const ist = getISTDetails();
                          const dueDate = String(order.return_due_date).slice(0, 10);

                          // const isDueDate = ist.date === dueDate;
                          // const isWithinTime = ist.minutes <= 23 * 60;
                          // // 13 * 60; -> 1:00 PM
                          // const canExtend = isDueDate && isWithinTime;

                          const isDueDate = true;
                          const isWithinTime = true;
                          const canExtend = true;

                          let message = "Available only on your return due date.";

                          if (isDueDate && !isWithinTime) {
                            message = "Extension window closed. Deadline was 1:00 PM IST.";
                          }

                          if (ist.date > dueDate) {
                            message = "Extension window has expired.";
                          }

                          return (
                            <div className="return-extension">
                              <button
                                type="button"
                                className="extend-return-button"
                                onClick={() => handleExtendReturnDate(order.order_item_id)}
                                disabled={!canExtend || extensionLoadingId === order.order_item_id}
                              >
                                {extensionLoadingId === order.order_item_id
                                  ? "Extending..."
                                  : "Extend Return Date"}
                              </button>

                              {!canExtend && (
                                <p className="extension-hint">{message}</p>
                              )}

                              {canExtend && (
                                <p className="extension-hint available">
                                  {/* Your extension window is open until 1:00 PM IST. */}
                                  Your extension window is open until 11:00 PM IST.

                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "fine" && (
          <section className="fine-tab">

            {/* FINE OVERVIEW */}
            <div className="fine-overview">

              <div className="fine-overview-heading">
                <h2>My Fines</h2>
                <p>View and manage your library fines.</p>
              </div>

              <div className="fine-overview-stat">
                <span>Total Outstanding</span>
                <h2>₹{totalOutstanding.toFixed(2)}</h2>
              </div>

              <div className="fine-overview-stat">
                <span>Pending Fines</span>
                <h2>{pendingFineCount}</h2>
              </div>

              <div className="fine-overview-stat">
                <span>Paid Fines</span>
                <h2>{paidFineCount}</h2>
              </div>

              <button
                type="button"
                className="fine-refresh-button"
                onClick={fetchOrders}
                disabled={ordersLoading}
              >
                {ordersLoading ? "Refreshing..." : "↻ Refresh"}
              </button>

            </div>

            {/* FINE RECORDS */}

            <div className="fine-list">

              {ordersLoading && (
                <div className="dashboard-message">
                  Loading your fines...
                </div>
              )}

              {!ordersLoading && ordersError && (
                <div className="dashboard-message error-message">
                  {ordersError}
                </div>
              )}

              {!ordersLoading && !ordersError && fineOrders.length === 0 && (
                <div className="fine-empty">
                  <FontAwesomeIcon icon={faBookOpen} />
                  <h3>No Fines to Display</h3>
                  <p>You currently have no outstanding or paid fines.</p>
                </div>
              )}

              {!ordersLoading && !ordersError && fineOrders.length > 0 && (
                <div className="books-grid">

                  {fineOrders.map((order) => (

                    <article
                      className="library-book-card"
                      key={order.order_item_id}
                    >

                      <div className="library-book-image">

                        {order.image_url ? (
                          <img
                            src={getBookImageUrl(order.image_url)}
                            alt={order.book_name}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}

                        <div
                          className="book-image-fallback"
                          style={{
                            display: order.image_url ? "none" : "flex"
                          }}
                        >
                          <FontAwesomeIcon icon={faBookOpen} />
                        </div>

                      </div>

                      <div className="library-book-info">

                        <h3>{order.book_name}</h3>

                        <p className="book-author">
                          By {order.author || "Unknown Author"}
                        </p>

                        <div className="book-details">

                          <p>
                            <strong>ISBN:</strong>{" "}
                            {order.isbn || "Not available"}
                          </p>

                          <p>
                            <strong>Fine Amount:</strong>{" "}
                            ₹{order.payment_status === "Paid"
                              ? "0.00"
                              : Number(order.fine_amount || 0).toFixed(2)}
                          </p>

                          <p>
                            <strong>Payment Status:</strong>{" "}
                            <span className={
                              order.payment_status === "Paid"
                                ? "copies-count"
                                : "copies-zero"
                            }>
                              {order.payment_status || "Pending"}
                            </span>
                          </p>

                          {order.paid_at && (
                            <p>
                              <strong>Paid On:</strong>{" "}
                              {new Date(order.paid_at).toLocaleDateString("en-IN")}
                            </p>
                          )}

                                              </div>

                        {order.payment_status === "Paid" ? (
                          <button
                            type="button"
                            className="remove-cart-button"
                            onClick={() =>
                              handleClearFine(order.order_item_id)
                            }
                            disabled={
                              fineActionLoadingId === order.order_item_id
                            }
                          >
                            {fineActionLoadingId === order.order_item_id
                              ? "Clearing..."
                              : "Clear Fine"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="add-cart-button"
                            onClick={() => handlePayFine(order)}
                            disabled={
                              fineActionLoadingId === order.order_item_id
                            }
                          >
                            {fineActionLoadingId === order.order_item_id
                              ? "Processing..."
                              : "Pay Now"}
                          </button>
                        )}

                      </div>

                    </article>

                  ))}

                </div>
              )}

            </div>

          </section>
        )}

        {activeTab === "materials" && (
          <section className="placeholder-tab">
            <h2>Teacher Study Materials</h2>
            <p>This feature will be available in a future update.</p>
          </section>
        )}
      </main>

      {/* DEMO PAYMENT MODAL */}
{showPaymentModal && selectedFine && (
  <div className="payment-modal-overlay">
    <div className="payment-modal">

      {!paymentSuccess ? (
        <>
          <button
            className="payment-modal-close"
            onClick={() => setShowPaymentModal(false)}
          >
            ×
          </button>

          <h2>Demo Payment</h2>

          <p className="payment-modal-subtitle">
            Payment integration will be completed before website launch.
          </p>

          <div className="payment-details">
            <div>
              <span>Student USN</span>
              <strong>{student.usn || "N/A"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{student.email || "N/A"}</strong>
            </div>

            <div>
              <span>Fine Amount</span>
              <strong className="payment-amount">
                ₹{Number(selectedFine.fine_amount || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          <p className="payment-demo-note">
            This is a demo payment. No real money will be deducted.
          </p>

          <button
            className="payment-confirm-button"
            onClick={handleConfirmDemoPayment}
            disabled={fineActionLoadingId === selectedFine.order_item_id}
          >
            {fineActionLoadingId === selectedFine.order_item_id
              ? "Processing..."
              : `Pay ₹${Number(selectedFine.fine_amount || 0).toFixed(2)}`}
          </button>
        </>
      ) : (
        <div className="payment-success">
          <div className="payment-success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p>Your fine has been marked as paid.</p>

          <button
            className="payment-confirm-button"
            onClick={() => {
              setShowPaymentModal(false);
              setSelectedFine(null);
            }}
          >
            Done
          </button>
        </div>
      )}

    </div>
  </div>
)}

      {/* PHOTO CROPPER MODAL */}
      {showCropper && selectedImage && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <h2>Edit Profile Photo</h2>

            <p className="crop-description">
              Drag and zoom your photo to fit inside the circle.
            </p>

            <div className="crop-container">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                restrictPosition={true}
              />
            </div>

            <div className="zoom-control">
              <label htmlFor="photo-zoom">Zoom</label>

              <input
                id="photo-zoom"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              <span>{zoom.toFixed(1)}x</span>
            </div>

            <div className="crop-actions">
              <button
                type="button"
                className="crop-cancel-button"
                onClick={handleCancelCrop}
                disabled={photoLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="crop-save-button"
                onClick={handleSaveCroppedPhoto}
                disabled={photoLoading}
              >
                {photoLoading ? "Saving..." : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          overflow-x: hidden;
        }

        .student-dashboard {
          min-height: 100vh;
          width: 100%;
          background: #f8faff;
          font-family: "Inter", "Segoe UI", sans-serif;
          color: #102b55;
        }

        /* HEADER */

        .student-header {
          width: 100%;
          min-height: 82px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
          background: #ffffff;
          border-bottom: 1px solid #e8edf4;
          box-shadow: 0 2px 12px rgba(16, 43, 85, 0.04);
          position: relative;
          z-index: 100;
        }

        .header-logo {
          margin-left: 80px;
          flex-shrink: 0;
        }

        .header-logo img {
          width: 75px;
          height: 75px;
          object-fit: contain;
          transform: scale(2.5);
          transform-origin: center;
        }

        .search-area {
          position: relative;
          flex: 1;
          max-width: 540px;
        }

        .header-search {
          display: flex;
          align-items: center;
          height: 46px;
          width: 100%;
          background: #f7f9fc;
          border: 1px solid #e0e7f0;
          border-radius: 9px;
          padding: 4px 5px 4px 16px;
          transition: 0.25s ease;
        }

        .header-search:focus-within {
          border-color: #2878e5;
          box-shadow: 0 0 0 3px rgba(40, 120, 229, 0.10);
          background: #ffffff;
        }

        .search-icon {
          color: #8a98aa;
          font-size: 15px;
        }

        .header-search input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          padding: 0 12px;
          font-size: 13px;
          color: #102b55;
        }

        .search-button {
          height: 36px;
          padding: 0 22px;
          border: none;
          border-radius: 7px;
          background: #2878e5;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .search-button:hover {
          background: #155fc5;
        }

        .search-results {
          position: absolute;
          top: 55px;
          left: 0;
          width: 100%;
          max-height: 380px;
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e5ebf3;
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(16, 43, 85, 0.13);
          z-index: 200;
          padding: 8px;
        }

        .results-heading {
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #8492a6;
          text-transform: uppercase;
        }

        .search-message {
          padding: 20px 12px;
          text-align: center;
          font-size: 13px;
          color: #8492a6;
        }

        .error-message {
          color: #dc4545;
        }

        .book-result {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .book-result:hover {
          background: #f1f6ff;
        }

        .book-result-image,
        .book-placeholder {
          width: 43px;
          height: 53px;
          flex-shrink: 0;
          object-fit: cover;
          border-radius: 5px;
          background: #eaf2ff;
        }

        .book-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2878e5;
          font-size: 20px;
        }

        .book-result-info h4 {
          margin: 0 0 5px;
          font-size: 13px;
          color: #102b55;
        }

        .book-result-info span {
          font-size: 11px;
          color: #8492a6;
        }

        /* PROFILE */

        .profile-container {
          position: relative;
          flex-shrink: 0;
        }

        .profile-button {
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 5px;
          text-align: left;
        }

        .profile-avatar {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          background: #e9f2ff;
          color: #2878e5;
          font-size: 17px;
          flex-shrink: 0;
        }

        .profile-avatar img,
        .dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-info h4 {
          font-size: 13px;
          margin: 0 0 4px;
          font-weight: 650;
          color: #102b55;
        }

        .profile-info span {
          font-size: 11px;
          color: #8492a6;
        }

        .profile-arrow {
          font-size: 11px;
          color: #8492a6;
          transition: transform 0.2s ease;
        }

        .profile-arrow.rotate {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: 58px;
          right: 0;
          width: 245px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e8edf4;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(16, 43, 85, 0.13);
          z-index: 300;
        }

        .dropdown-profile-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-avatar {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9f2ff;
          color: #2878e5;
          font-size: 35px;
        }

        .dropdown-profile-info strong {
          display: block;
          font-size: 13px;
          color: #102b55;
          margin-bottom: 5px;
        }

        .dropdown-profile-info span {
          display: block;
          font-size: 11px;
          color: #8492a6;
        }

        .dropdown-divider {
          height: 1px;
          background: #e8edf4;
          width: 100%;
        }

        .dropdown-action {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #102b55;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .dropdown-action:hover {
          background: #f1f6ff;
          color: #2878e5;
        }

        .dropdown-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .logout-action {
          color: #dc4545;
        }

        .logout-action:hover {
          background: #fff1f1;
          color: #c52e2e;
        }

        /* DASHBOARD */

        .dashboard-content {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 35px 45px 60px;
        }

        .dashboard-welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .dashboard-welcome h1 {
          margin: 0 0 8px;
          font-size: 25px;
          font-weight: 750;
          color: #102b55;
        }

        .dashboard-welcome p {
          margin: 0;
          color: #8492a6;
          font-size: 13px;
        }

        .cart-summary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e5ebf3;
          border-radius: 9px;
          color: #2878e5;
          font-size: 13px;
        }

        .cart-summary strong {
          color: #102b55;
          font-size: 14px;
        }

        /* TABS */

        .dashboard-tabs {
          display: flex;
          align-items: stretch;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          border-bottom: 1px solid #e2e9f2;
          margin-bottom: 28px;
        }

        .dashboard-tabs button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          flex-shrink: 0;
          padding: 14px 17px;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #75849a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .dashboard-tabs button:hover {
          color: #2878e5;
          background: #f1f6ff;
        }

        .dashboard-tabs button.active {
          color: #2878e5;
          border-bottom-color: #2878e5;
        }

        .tab-count {
          min-width: 21px;
          height: 21px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border-radius: 20px;
          background: #eaf2ff;
          color: #2878e5;
          font-size: 11px;
        }

        /* SECTION HEADING */

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .section-heading h2 {
          margin: 0 0 6px;
          font-size: 20px;
          color: #102b55;
        }

        .section-heading p {
          margin: 0;
          color: #8492a6;
          font-size: 13px;
        }

        .total-books {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 14px;
          background: #eaf2ff;
          border-radius: 8px;
          color: #2878e5;
          font-size: 13px;
          font-weight: 650;
          white-space: nowrap;
        }

        /* FILTERS */

        .book-filters {
          padding: 20px;
          margin-bottom: 25px;
          background: #ffffff;
          border: 1px solid #e5ebf3;
          border-radius: 11px;
        }

        .filter-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 17px;
          color: #102b55;
          font-size: 14px;
          font-weight: 700;
        }

        .filter-title svg {
          color: #2878e5;
        }

        .filter-controls {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          align-items: end;
          gap: 16px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-field label {
          color: #53647b;
          font-size: 12px;
          font-weight: 650;
        }

        .filter-field select {
          width: 100%;
          height: 43px;
          padding: 0 12px;
          border: 1px solid #dce4ef;
          border-radius: 7px;
          outline: none;
          background: #ffffff;
          color: #102b55;
          font-size: 13px;
        }

        .filter-field select:focus {
          border-color: #2878e5;
          box-shadow: 0 0 0 3px rgba(40, 120, 229, 0.08);
        }

        .apply-filter-button {
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 24px;
          border: none;
          border-radius: 7px;
          background: #2878e5;
          color: #ffffff;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        }

        .apply-filter-button:hover {
          background: #155fc5;
        }

        .apply-filter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* BOOK GRID AND CARDS */

        .books-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .library-book-card {
          min-width: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e5ebf3;
          border-radius: 11px;
          box-shadow: 0 3px 12px rgba(16, 43, 85, 0.035);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .library-book-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 22px rgba(16, 43, 85, 0.09);
        }

        .library-book-image {
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background: #f1f5fb;
          border-bottom: 1px solid #e8edf4;
        }

        .library-book-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .book-image-fallback {
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: #8aa9d6;
          font-size: 48px;
        }

        .library-book-info {
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 16px;
        }

        .library-book-info h3 {
          margin: 0 0 7px;
          color: #102b55;
          font-size: 15px;
          line-height: 1.45;
          min-height: 43px;
        }

        .book-author {
          margin: 0 0 13px;
          color: #2878e5;
          font-size: 12px;
        }

        .book-details {
          flex: 1;
          margin-bottom: 15px;
        }

        .book-details p {
          margin: 0 0 9px;
          color: #697991;
          font-size: 11px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .book-details strong {
          color: #43546c;
          font-weight: 650;
        }

        .book-description {
          display: -webkit-box;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          min-height: 49px;
        }

        .copies-count {
          color: #16834a;
          font-weight: 700;
        }

        .copies-zero {
          color: #dc4545;
          font-weight: 700;
        }

        .add-cart-button,
        .remove-cart-button {
          width: 100%;
          min-height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 12px;
          border: none;
          border-radius: 7px;
          background: #2878e5;
          color: #ffffff;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .add-cart-button:hover {
          background: #155fc5;
        }

        .add-cart-button.added {
          background: #e8f7ee;
          color: #16834a;
          cursor: default;
        }

        .add-cart-button:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .remove-cart-button {
          background: #fff0f0;
          color: #d33c3c;
        }

        .remove-cart-button:hover {
          background: #ffe1e1;
        }

        /* EMPTY AND LOADING STATES */

        .dashboard-message {
          padding: 35px 15px;
          text-align: center;
          color: #8492a6;
          font-size: 14px;
        }

        .empty-state,
        .placeholder-tab {
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 35px 20px;
          background: #ffffff;
          border: 1px dashed #d7e1ef;
          border-radius: 12px;
          text-align: center;
        }

        .empty-state > svg,
        .placeholder-tab > svg {
          margin-bottom: 15px;
          color: #8aa9d6;
          font-size: 38px;
        }

        .empty-state h3,
        .placeholder-tab h2 {
          margin: 0 0 9px;
          color: #102b55;
          font-size: 18px;
        }

        .empty-state p,
        .placeholder-tab p {
          margin: 0;
          color: #8492a6;
          font-size: 13px;
        }

        .empty-state-button {
          margin-top: 20px;
          padding: 10px 18px;
          border: none;
          border-radius: 7px;
          background: #2878e5;
          color: #ffffff;
          font-size: 13px;
          cursor: pointer;
        }

        /* RETURN DATE EXTENSION */
        /* LIBRARY POLICIES */

        .library-policies {
          margin-bottom: 24px;
        }

        .policy-main-heading {
          margin: 0 0 16px;
          color: #173b68;
          font-size: 20px;
          font-weight: 700;
        }

        .policy-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .fine-note {
          margin: 12px 0 0;
          padding: 10px;
          background: #eaf7ee;
          border-left: 3px solid #15803D;
          border-radius: 5px;
          color: #27623b;
          font-size: 12px;
          line-height: 1.6;
          text-align: left;
        }

        .policy-card {
          padding: 18px;
          background: #eef5ff;
          border: 1px solid #d7e6ff;
          border-radius: 10px;
        }

        .policy-card h3 {
          margin: 0 0 12px;
          color: #174b91;
          font-size: 15px;
          font-weight: 700;
          text-align: left;
        }

        .policy-card ul {
          margin: 0;
          padding-left: 18px;
          text-align: left;
        }

        .policy-card li {
          text-align: left;
        }
          

        .policy-card li {
          margin-bottom: 9px;
          color: #52647b;
          font-size: 12px;
          line-height: 1.6;
        }

        .policy-card li:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 900px) {
          .policy-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .policy-grid {
            grid-template-columns: 1fr;
          }
        }
        .extension-policy h3 {
          margin: 0 0 12px;
          color: #174b91;
          font-size: 15px;
        }

        .extension-policy ul {
          margin: 0;
          padding-left: 20px;
        }

        .extension-policy li {
          margin-bottom: 7px;
          color: #52647b;
          font-size: 12px;
          line-height: 1.6;
        }

        .return-extension {
          margin-top: 12px;
        }

        .extend-return-button {
          width: 100%;
          min-height: 40px;
          padding: 10px 14px;
          border: none;
          border-radius: 7px;
          background: #16834a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .extend-return-button:hover:not(:disabled) {
          background: #106b3b;
        }

        .extend-return-button:disabled {
          background: #dce3eb;
          color: #77869a;
          cursor: not-allowed;
        }

        .extension-hint {
          margin: 8px 0 0;
          color: #dc4545;
          font-size: 11px;
          line-height: 1.5;
        }

        .extension-hint.available {
          color: #16834a;
        }

        /* PHOTO CROPPER */

        .crop-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(8, 20, 40, 0.72);
        }

        .crop-modal {
          width: 100%;
          max-width: 440px;
          padding: 25px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          text-align: center;
        }

        .crop-modal h2 {
          margin: 0 0 8px;
          color: #102b55;
          font-size: 21px;
        }

        .crop-description {
          margin: 0 0 20px;
          color: #8492a6;
          font-size: 13px;
        }

        .crop-container {
          position: relative;
          width: 100%;
          height: 300px;
          overflow: hidden;
          background: #172338;
          border-radius: 10px;
        }

        .zoom-control {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
          color: #102b55;
          font-size: 13px;
          font-weight: 600;
        }

        .zoom-control input {
          flex: 1;
          accent-color: #2878e5;
          cursor: pointer;
        }

        .zoom-control span {
          min-width: 35px;
          color: #2878e5;
        }

        .crop-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 25px;
        }

        .crop-actions button {
          padding: 11px 20px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .crop-cancel-button {
          background: #eef2f7;
          color: #52647b;
        }

        .crop-save-button {
          background: #2878e5;
          color: #ffffff;
        }

        .crop-save-button:hover {
          background: #155fc5;
        }

        .crop-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* FINE OVERVIEW */

        .fine-overview {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
          align-items: center;
          gap: 22px;
          padding: 22px 24px;
          margin-bottom: 25px;
          background: #ffffff;
          border: 1px solid #e5ebf3;
          border-radius: 12px;
          box-shadow: 0 3px 12px rgba(16, 43, 85, 0.04);
        }

        .fine-overview-heading h2 {
          margin: 0 0 6px;
          color: #102b55;
          font-size: 21px;
          font-weight: 700;
        }

        .fine-overview-heading p {
          margin: 0;
          color: #8492a6;
          font-size: 12px;
        }

        .fine-overview-stat {
          padding-left: 18px;
          border-left: 1px solid #e8edf4;
        }

        .fine-overview-stat span {
          display: block;
          margin-bottom: 8px;
          color: #697991;
          font-size: 11px;
          font-weight: 600;
        }

        .fine-overview-stat h2 {
          margin: 0;
          color: #102b55;
          font-size: 22px;
          font-weight: 750;
        }

        .fine-overview-stat:first-of-type h2 {
          color: #16834a;
        }

        .fine-refresh-button {
          padding: 11px 17px;
          border: 1px solid #dce7f7;
          border-radius: 7px;
          background: #eef5ff;
          color: #2878e5;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }

        .fine-refresh-button:hover {
          background: #dceaff;
        }

        .fine-refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* RESPONSIVE FINE OVERVIEW */

        @media (max-width: 1000px) {
          .fine-overview {
            grid-template-columns: repeat(3, 1fr);
          }

          .fine-overview-heading {
            grid-column: span 2;
          }

          .fine-refresh-button {
            justify-self: end;
          }
        }

        @media (max-width: 600px) {
          .fine-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px 12px;
            padding: 18px;
          }

          .fine-overview-heading {
            grid-column: 1 / -1;
          }

          .fine-overview-stat {
            padding-left: 10px;
          }

          .fine-overview-stat h2 {
            font-size: 19px;
          }

          .fine-refresh-button {
            justify-self: start;
          }
        }

        /* RESPONSIVE */

        @media (max-width: 1200px) {
          .books-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .dashboard-content {
            padding-left: 30px;
            padding-right: 30px;
          }

          .header-logo {
            margin-left: 25px;
          }
        }

        @media (max-width: 850px) {
          .books-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .student-header {
            gap: 15px;
          }

          .header-logo {
            margin-left: 0;
          }

          .filter-controls {
            grid-template-columns: 1fr 1fr;
          }

          .apply-filter-button {
            grid-column: 1 / -1;
          }

          .dashboard-content {
            padding: 28px 20px 45px;
          }
        }

        @media (max-width: 600px) {
          .student-header {
            min-height: 75px;
            padding: 10px 12px;
            gap: 12px;
            flex-wrap: wrap;
          }

          .header-logo img {
            width: 42px;
            height: 42px;
            transform: none;
          }

          .profile-info {
            display: none;
          }

          .search-area {
            order: 3;
            flex-basis: 100%;
            max-width: 100%;
          }

          .dashboard-content {
            padding: 24px 14px 40px;
          }

          .dashboard-welcome {
            align-items: flex-start;
            flex-direction: column;
          }

          .dashboard-welcome h1 {
            font-size: 21px;
          }

          .dashboard-tabs {
            gap: 2px;
          }

          .dashboard-tabs button {
            padding: 12px 13px;
            font-size: 12px;
          }

          .section-heading {
            align-items: flex-start;
          }

          .filter-controls {
            grid-template-columns: 1fr;
          }

          .apply-filter-button {
            grid-column: auto;
          }

          .books-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .library-book-image {
            height: 150px;
          }

          .library-book-info {
            padding: 12px;
          }

          .library-book-info h3 {
            font-size: 13px;
          }

          .book-details p {
            font-size: 10px;
          }

          .crop-modal {
            padding: 18px;
          }

          .crop-container {
            height: 280px;
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

        @media (max-width: 380px) {
          .books-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
