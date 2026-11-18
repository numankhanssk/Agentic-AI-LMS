import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import homeIcon from "../assets/HomeIcon.png";
import homeIcon2 from "../assets/HomeIcon2.jpeg";
import aiRobot from "../assets/ai-robot.gif";

function Home() {
  const navigate = useNavigate();

  const [placeholder, setPlaceholder] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateIndex, setUpdateIndex] = useState(0);

  // Book search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUSN, setChatUSN] = useState("");
  const [chatStudentName, setChatStudentName] = useState("");
  const [chatStudentId, setChatStudentId] = useState(null);
  const [isVerifyingUSN, setIsVerifyingUSN] = useState(false);
  const [usnMessage, setUsnMessage] = useState("");
  const [isUSNVerified, setIsUSNVerified] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const chatConversationRef = useRef(null);
  useEffect(() => {
    if (chatConversationRef.current) {
      chatConversationRef.current.scrollTop =
        chatConversationRef.current.scrollHeight;
    }
  }, [chatMessages]);
  const [chatInput, setChatInput] = useState("");
  const [isBookSearchActive, setIsBookSearchActive] = useState(false);
  const [isAvailabilitySearchActive, setIsAvailabilitySearchActive] = useState(false);
  const [showServiceMenu, setShowServiceMenu] = useState(true);
  const handleUSNVerify = async () => {
  const usn = chatUSN.trim().toUpperCase();

  if (!usn) {
    setUsnMessage("Please enter your USN.");
    setIsUSNVerified(false);
    return;
  }

  setIsVerifyingUSN(true);
  setUsnMessage("");
  setIsUSNVerified(false);

  try {
    const response = await fetch("http://localhost:5000/api/chat/verify-usn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ usn })
    });

    const data = await response.json();

    setUsnMessage(
      data.message || (response.ok ? "USN verified." : "USN not found.")
    );

    const verified = response.ok && data.success === true;
    setIsUSNVerified(verified);

    if (verified) {
      setChatStudentName(data.studentName || "Student");
      setChatStudentId(data.studentId);
    }

    if (verified) {
      setChatMessages([
        {
          sender: "bot",
          text: `Hi ${data.studentName || "Student"}! 👋 Welcome to your Smart Library. 📚 How can I help you today?`
        }
      ]);
    }

  } catch (error) {
    console.error("USN verification error:", error);
    setUsnMessage("Unable to verify USN. Please try again.");
  } finally {
    setIsVerifyingUSN(false);
  }
};

const handleChatSend = async (selectedMessage) => {
  const message = (selectedMessage || chatInput).trim();

  if (
  isAvailabilitySearchActive &&
  message &&
  message.toLowerCase() !== "book availability"
) {
  setChatMessages((prev) => [
    ...prev,
    { sender: "user", text: message }
  ]);

  setChatInput("");
  setIsAvailabilitySearchActive(false);

  try {
    const response = await fetch(
      `http://localhost:5000/api/books/availability?q=${encodeURIComponent(message)}`
    );

    const data = await response.json();

    let reply = "";

    if (!response.ok || !data.success) {
      reply = "Unable to check book availability. Please try again.";
    } else if (!data.books || data.books.length === 0) {
      reply = `No matching books found for "${message}".`;
    } else {
      reply = "📚 Book Availability:\n\n" +
        data.books.map((book, index) =>
          `${index + 1}. ${book.book_name}\nAuthor: ${book.author || "Unknown"}\nAvailable Copies: ${book.available_copies}\nStatus: ${Number(book.available_copies) > 0 ? "✅ Available" : "❌ Currently Unavailable"}`
        ).join("\n\n");
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: reply }
    ]);

  } catch (error) {
    console.error("Book availability error:", error);

    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: "Something went wrong while checking availability." }
    ]);
  }

  return;
}

  if (isBookSearchActive && message) {
  setChatMessages((prev) => [
    ...prev,
    { sender: "user", text: message }
  ]);

  
  setChatInput("");
  setIsBookSearchActive(false);

  try {
    const response = await fetch(
      `http://localhost:5000/api/books/search?q=${encodeURIComponent(message)}`
    );

    const data = await response.json();

    let reply = "";

    if (!response.ok || !data.success) {
      reply = "Unable to search books right now. Please try again.";
    } else if (!data.books || data.books.length === 0) {
      reply = `No books found for "${message}". Try another title or author.`;
    } else {
      reply = "📚 Books found in our library:\n\n" +
        data.books.map((book, index) =>
          `${index + 1}. ${book.book_name}\nAuthor: ${book.author || "Unknown"}\nBook ID: ${book.book_id}`
        ).join("\n\n");
    }

    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: reply }
    ]);

  } catch (error) {
    console.error("Chatbot book search error:", error);

    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: "Something went wrong while searching books." }
    ]);
  }

  return;
}

  if (!message) return;

  setChatMessages((prev) => [
    ...prev,
    { sender: "user", text: message }
  ]);

  setChatInput("");

  let botReply = "";

  switch (message.toLowerCase()) {
    case "my borrowed books": {
        const token = localStorage.getItem("studentToken");

        if (!token) {
          botReply = "🔐 Please log in to your student account to view your borrowed books.";
          break;
        }

        try {
  const response = await fetch("http://localhost:5000/api/students/orders", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    botReply = "Unable to fetch your borrowed books. Please log in again. 🔐";
    break;
  }

  if (!data.orders || data.orders.length === 0) {
    botReply = "You don't have any borrowed books currently. 📚";
    break;
  }

  botReply = "Here are your library records:\n\n" +
    data.orders.map((book, index) =>
      `${index + 1}. ${book.book_name}\nAuthor: ${book.author || "Unknown"}\nCollection: ${book.collection_status || "N/A"}\nReturn Status: ${book.return_status || "N/A"}\nDue Date: ${book.return_due_date || "Not assigned"}`
    ).join("\n\n");

} catch (error) {
  console.error("Chatbot borrowed books error:", error);
  botReply = "Something went wrong while fetching your books. Please try again.";
}
break;
      }

    case "search books":
  setIsBookSearchActive(true);
  botReply = "🔍 Sure! Enter the book title or author's name, and I'll search our library catalogue.";
  break;

    case "return dates": {
  const token = localStorage.getItem("studentToken");

  if (!token) {
    botReply = "🔐 Please log in to view your return dates.";
    break;
  }

  try {
    const response = await fetch("http://localhost:5000/api/students/orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      botReply = "Unable to fetch your return dates. Please log in again.";
      break;
    }

    const booksWithDates = (data.orders || []).filter(
      book => book.return_due_date
    );

    if (booksWithDates.length === 0) {
      botReply = "You don't have any return dates assigned yet. 📅";
      break;
    }

    botReply = "📅 Your Book Return Dates:\n\n" +
      booksWithDates.map((book, index) =>
        `${index + 1}. ${book.book_name}\nAuthor: ${book.author || "Unknown"}\nDue Date: ${new Date(book.return_due_date).toLocaleDateString("en-IN")}\nStatus: ${book.return_status || "N/A"}`
      ).join("\n\n");

  } catch (error) {
    console.error("Return dates error:", error);
    botReply = "Something went wrong while fetching your return dates.";
  }

  break;
}

    case "my fines": {
  const token = localStorage.getItem("studentToken");

  if (!token) {
    botReply = "🔐 Please log in to view your library fines.";
    break;
  }

  try {
    const response = await fetch("http://localhost:5000/api/students/orders", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      botReply = "Unable to fetch your fines. Please log in again.";
      break;
    }

    const fineBooks = (data.orders || []).filter(
      book => Number(book.fine_amount) > 0
    );

    if (fineBooks.length === 0) {
      botReply = "🎉 You don't have any library fines!";
      break;
    }

    const totalFine = fineBooks.reduce(
      (total, book) => total + Number(book.fine_amount),
      0
    );

    botReply = `💰 Your Library Fines\nTotal Fine: ₹${totalFine}\n\n⚠️ Please pay your pending fine as soon as possible. Otherwise, the fine may double every day as per library rules.\n\n` +
      fineBooks.map((book, index) =>
        `${index + 1}. ${book.book_name}\nFine: ₹${book.fine_amount}\nPayment Status: ${book.payment_status || "Pending"}`
      ).join("\n\n");

  } catch (error) {
    console.error("My fines error:", error);
    botReply = "Something went wrong while fetching your fines.";
  }

  break;
}

    case "book availability":
    setIsAvailabilitySearchActive(true);
    botReply = "📖 Enter the book title or author's name to check available copies.";
    break;

   case "library rules":
  botReply = `📚 LIBRARY POLICIES

📖 COLLECTION POLICY
• Provide your USN when collecting books.
• Collect within the assigned collection period.
• Uncollected orders will be automatically cancelled.

🕒 COLLECTION TIMINGS
Monday–Friday: 9:00 AM – 3:30 PM
Saturday: 9:00 AM – 1:00 PM
Sunday: Closed

🔄 RETURN POLICY
• Return books on or before the due date.
• One extension of 15 days is permitted.
• Extension is available only on the final due date, between 12:00 AM and 1:00 PM IST.
• If the extended date falls on Sunday, it moves to Monday.

💰 FINE POLICY
• Return books by 3:30 PM on the due date.
• Late fines apply after 3:30 PM.
• Check the Fine Amounts section for applicable fines.

🎓 Fine collections support skill-development events, workshops and student learning activities.`;
  break;

    default: {
  try {
    const response = await fetch(
      `http://localhost:5000/api/books/availability?q=${encodeURIComponent(message)}`
    );

    const data = await response.json();

    if (response.ok && data.success && data.books.length > 0) {
      botReply = "📚 Here are the matching books:\n\n" +
        data.books.map((book, index) =>
          `${index + 1}. ${book.book_name}\nAuthor: ${book.author || "Unknown"}\nAvailable Copies: ${book.available_copies}\nStatus: ${Number(book.available_copies) > 0 ? "✅ Available" : "❌ Unavailable"}`
        ).join("\n\n");
    } else {
      botReply = "Sorry, I couldn't find a matching book. Try another title or author. 📚";
    }
  } catch (error) {
    console.error("Automatic book search error:", error);
    botReply = "Unable to search the library catalogue right now.";
  }

  break;
}
  }

  setTimeout(() => {
    setChatMessages((prev) => [
      ...prev,
      { sender: "bot", text: botReply }
    ]);
  }, 500);
};

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchExamples = [
    "Search for Data Structures and Algorithms books...",
    "Explore Java programming books...",
    "Find Computer Networks books...",
    "Discover Database Management Systems books..."
  ];

  const [libraryUpdates, setLibraryUpdates] = useState([]);

  // Animated search placeholder
  useEffect(() => {
    const currentText = searchExamples[textIndex];
    let timer;

    if (!isDeleting && charIndex === currentText.length) {
      timer = setTimeout(() => setIsDeleting(true), 1200);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % searchExamples.length);
    } else {
      timer = setTimeout(() => {
        if (isDeleting) {
          setPlaceholder(currentText.substring(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setPlaceholder(currentText.substring(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        }
      }, isDeleting ? 35 : 75);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  // FETCH LIBRARY UPDATES FROM BACKEND
useEffect(() => {
    const fetchUpdates = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/library/updates"
            );

            const data = await response.json();

            if (response.ok) {
                setLibraryUpdates(data.updates || []);
            }
        } catch (error) {
            console.error("Library updates error:", error);
        }
    };

    fetchUpdates();

    const refreshTimer = setInterval(fetchUpdates, 30000);

    return () => clearInterval(refreshTimer);
}, []);


// ROTATE LIBRARY UPDATES
useEffect(() => {
    if (libraryUpdates.length === 0) {
        setUpdateIndex(0);
        return;
    }

    const timer = setInterval(() => {
        setUpdateIndex(prev => (prev + 1) % libraryUpdates.length);
    }, 3500);

    return () => clearInterval(timer);
}, [libraryUpdates.length]);

  // Fetch matching books from MySQL through the backend API
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setBooks([]);
      setSearchError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      try {
        const response = await fetch(
          `http://localhost:5000/api/books/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to search books.");
        }

        const data = await response.json();

        setBooks(data.books || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setBooks([]);
          setSearchError("Unable to load books. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
          max-width: 100%;
        }

        html,
        body {
          overflow-x: hidden;
        }

        body {
          font-family: Arial, sans-serif;
          background: #ffffff;
          color: #0b1f3a;
        }

        /* ================= HEADER ================= */

        .header {
          width: 100%;
          min-height: 80px;
          padding: 0 6%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #ffffff;
          border-bottom: 1px solid #e8edf3;
          position: relative;
          z-index: 1000;
        }

        /* ================= LOGO ================= */

        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .logo picture {
          display: flex;
          align-items: center;
        }

        .logo-image {
          width: 140px;
          height: 140px;
          object-fit: contain;
          display: block;
          transform: scale(3.4);
        }

        /* ================= LOGIN ================= */

        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #1769e0;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .login-btn:hover {
          background: #0b1f3a;
          transform: translateY(-1px);
        }

        /* ================= LARGE LAPTOP ================= */

        @media (min-width: 1200px) {
          .header {
            min-height: 86px;
            padding: 0 3% 0 8%;
          }

          .logo-image {
            width: 80px;
            height: 80px;
            transform: scale(2.5);
          }

          .login-btn {
            padding: 13px 28px;
            font-size: 16px;
          }
        }

        /* ================= TABLET ================= */

        @media (min-width: 601px) and (max-width: 900px) {
          .header {
            padding: 0 5%;
          }

          .logo-image {
            width: 52px;
            height: 52px;
            transform: scale(1);
          }

          .login-btn {
            padding: 11px 20px;
          }
        }

        /* ================= MOBILE ================= */

        @media (max-width: 600px) {
          .header {
            min-height: 68px;
            padding: 0 16px;
            gap: 10px;
          }

          .logo-image {
            width: 65px;
            height: 65px;
            transform: scale(1);
          }

          .login-btn {
            padding: 10px 15px;
            font-size: 14px;
            border-radius: 7px;
          }
        }

        /* ================= SMALL MOBILE ================= */

        @media (max-width: 400px) {
          .header {
            min-height: 64px;
            padding: 0 12px;
          }

          .logo-image {
            width: 65px;
            height: 65px;
            transform: scale(1);
          }

          .login-btn {
            padding: 9px 12px;
            font-size: 13px;
          }
        }

        /* ================= VERY SMALL SCREEN ================= */

        @media (max-width: 320px) {
          .header {
            padding: 0 10px;
          }

          .logo-image {
            width: 38px;
            height: 38px;
          }

          .login-btn {
            padding: 8px 10px;
            font-size: 12px;
            gap: 6px;
          }
        }

        /* ================= CENTER SEARCH SECTION ================= */

        .search-section {
          width: 100%;
          max-width: 100%;
          padding: 65px 20px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
          background: #ffffff;
        }

        .search-title {
          max-width: 100%;
          font-size: 32px;
          font-weight: 700;
          color: #0b1f3a;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .search-subtitle {
          max-width: 600px;
          font-size: 16px;
          color: #64748b;
          margin-bottom: 30px;
          line-height: 1.6;
        }

        /* ================= SEARCH BAR ================= */

        .search-container {
          width: 100%;
          max-width: 650px;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 8px 20px;
          background: #ffffff;
          border: 1px solid #dbe3ef;
          border-radius: 12px;
          box-shadow: 0 5px 20px rgba(15, 42, 80, 0.07);
          transition: border-color 0.25s ease,
                      box-shadow 0.25s ease;
        }

        .search-container:focus-within {
          border-color: #1769e0;
          box-shadow: 0 0 0 4px rgba(23, 105, 224, 0.10);
        }

        .search-icon {
          color: #64748b;
          font-size: 18px;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #0b1f3a;
          font-size: 15px;
          padding: 12px 0;
        }

        .search-input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .search-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: #1769e0;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.25s ease;
          flex-shrink: 0;
        }

        .search-button:hover {
          background: #0b1f3a;
        }

        /* ================= BOOK SEARCH RESULTS ================= */

        .book-results {
          width: 100%;
          max-width: 650px;
          margin-top: 12px;
          text-align: left;
        }

        .book-result-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          margin-bottom: 8px;
          border: 1px solid #e0eaf8;
          border-radius: 10px;
          background: #ffffff;
          box-shadow: 0 3px 12px rgba(15, 42, 80, 0.04);
          transition: box-shadow 0.2s ease;
        }

        .book-result-item:hover {
          box-shadow: 0 5px 16px rgba(15, 42, 80, 0.09);
        }

        .book-image-container {
          width: 60px;
          height: 75px;
          flex-shrink: 0;
          background: #f1f5f9;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .book-result-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .book-result-details {
          min-width: 0;
        }

        .book-result-title {
          font-size: 15px;
          color: #0b1f3a;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .book-result-author {
          font-size: 13px;
          color: #64748b;
          margin-top: 5px;
          line-height: 1.5;
        }

        .book-search-message {
          color: #64748b;
          padding: 12px 0;
          font-size: 14px;
        }

        .book-search-error {
          color: #dc2626;
        }

        /* ================= LIBRARY UPDATES BOX ================= */

        .library-updates {
          width: 100%;
          max-width: 650px;
          margin-top: 26px;
          padding: 20px 22px;
          background: #f8fbff;
          border: 1px solid #e0eaf8;
          border-radius: 12px;
          text-align: left;
          box-shadow: 0 5px 18px rgba(15, 42, 80, 0.05);
        }

        .library-updates-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          color: #0b1f3a;
          font-size: 18px;
          font-weight: 700;
        }

        .library-updates-heading i {
          color: #1769e0;
          font-size: 18px;
        }

        .library-updates-list {
          position: relative;
          width: 100%;
          height: 64px;
          overflow: hidden;
          display: flex;
          align-items: center;
          border-top: 1px solid #e7edf6;
        }

        .library-update-item {
          position: absolute;
          inset: 0;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #334155;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.6;
          overflow-wrap: anywhere;
          animation: slideUpdate 0.7s ease both;
        }

        .library-update-item i {
          color: #1769e0;
          font-size: 16px;
          flex-shrink: 0;
        }

        .library-update-item p {
          min-width: 0;
        }

        @keyframes slideUpdate {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* ================= MOBILE SEARCH BAR ================= */

        @media (max-width: 600px) {
          .search-section {
            padding: 48px 16px 25px;
          }

          .search-title {
            font-size: 25px;
            margin-bottom: 10px;
          }

          .search-subtitle {
            font-size: 14px;
            margin-bottom: 24px;
            max-width: 340px;
          }

          .search-container {
            gap: 9px;
            padding: 7px 8px 7px 12px;
            border-radius: 10px;
          }

          .search-input {
            font-size: 13px;
          }

          .search-icon {
            font-size: 16px;
          }

          .search-button {
            min-height: 42px;
            padding: 11px 13px;
            font-size: 13px;
            gap: 6px;
          }

          .book-result-item {
            gap: 10px;
            padding: 12px;
          }

          .book-image-container {
            width: 52px;
            height: 68px;
          }

          .book-result-title {
            font-size: 14px;
          }

          .book-result-author {
            font-size: 12px;
          }

          .library-updates {
            margin-top: 22px;
            padding: 16px 14px;
          }

          .library-updates-heading {
            font-size: 16px;
            margin-bottom: 12px;
          }

          .library-updates-list {
            height: 66px;
          }

          .library-update-item {
            font-size: 13px;
            gap: 9px;
          }

          .library-update-item i {
            font-size: 14px;
          }
        }

        /* ================= SMALL PHONE ================= */

        @media (max-width: 360px) {
          .search-section {
            padding: 40px 12px 20px;
          }

          .search-title {
            font-size: 22px;
          }

          .search-subtitle {
            font-size: 13px;
          }

          .search-container {
            gap: 7px;
            padding: 6px 7px 6px 9px;
          }

          .search-input {
            font-size: 12px;
          }

          .search-icon {
            font-size: 14px;
          }

          .search-button {
            min-height: 40px;
            padding: 10px 11px;
            font-size: 12px;
            gap: 5px;
          }

          .library-updates {
            padding: 14px 11px;
            margin-top: 18px;
          }

          .library-updates-heading {
            font-size: 15px;
          }

          .library-updates-list {
            height: 70px;
          }

          .library-update-item {
            font-size: 12px;
            gap: 7px;
          }

          .library-update-item i {
            font-size: 13px;
          }
        }

        /* ================= FLOATING AI ASSISTANT ================= */

        .ai-assistant-button {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 170px;
          height: 170px;
          padding: 0;
          border: none;
          border-radius: 0;
          background: transparent;
          cursor: pointer;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          box-shadow: none;
          transition: transform 0.25s ease;
        }

        .ai-assistant-button:hover {
          transform: scale(1.1);
        }

        .ai-assistant-button img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @media (max-width: 600px) {
          .ai-assistant-button {
            width: 120px;
            height: 120px;
            right: 0;
            bottom: 0;
          }
        }

        /* ================= FULL HEIGHT MOBILE SCREEN ================= */

        html,
        body,
        #root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #ffffff;
        }

        body {
          margin: 0;
        }
        /* AI CHAT WINDOW */
.ai-chat-window {
  position: fixed;
  bottom: 100px;
  right: 25px;
  width: 370px;
  height: 480px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 35px rgba(0, 0, 0, 0.25);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* CHAT HEADER */
.ai-chat-header {
  background: #071b3a;
  color: white;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.ai-chat-header span {
  color: #35d39a;
  font-size: 12px;
}

.ai-chat-header button {
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

/* CHAT BODY */
.ai-chat-body {
  flex: 1;
  padding: 18px;
  background: #f4f7fc;
}

.ai-chat-message {
  background: white;
  color: #172b4d;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  max-width: 90%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  white-space: pre-line;
}

/* MOBILE RESPONSIVE */
@media (max-width: 480px) {
  .ai-chat-window {
    width: calc(100% - 24px);
    right: 12px;
    bottom: 85px;
    height: 70vh;
  }
}

/* USN INPUT */
.ai-usn-input {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.ai-usn-input input {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border: 1px solid #d5deeb;
  border-radius: 9px;
  outline: none;
  font-size: 13px;
}

.ai-usn-input input:focus {
  border-color: #1769d2;
}

.ai-usn-input button {
  padding: 0 16px;
  background: #1769d2;
  color: white;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.ai-usn-input button:hover {
  background: #0b4fa8;
}

.ai-usn-message {
  margin: 10px 15px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.ai-usn-message.success {
  color: #087443;
  background: #e7f8ef;
  border: 1px solid #a8e6c3;
}

.ai-usn-message.error {
  color: #b42318;
  background: #fff0ef;
  border: 1px solid #f5b5b0;
}

.ai-usn-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-chat-conversation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.ai-chat-message.user-message {
  align-self: flex-end;
  background: #075985;
  color: #ffffff;
  border-radius: 12px 12px 2px 12px;
  padding: 10px 14px;
  max-width: 80%;
}

.ai-chat-message.bot-message {
  align-self: flex-start;
  background: #eaf2f8;
  color: #172b4d;
  border-radius: 12px 12px 12px 2px;
  padding: 10px 14px;
  max-width: 80%;
}

.ai-chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.ai-chat-input input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
}

.ai-chat-input input:focus {
  border-color: #0284c7;
}

.ai-chat-input button {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #075985;
  color: white;
  cursor: pointer;
}

.ai-chat-window {
  display: flex;
  flex-direction: column;
}

.ai-chat-input {
  position: sticky;
  bottom: 0;
  background: #ffffff;
  align-items: center;
  flex-shrink: 0;
}

.chat-verified {
  color: #087443;
  background: #e7f8ef;
  border: 1px solid #a8e6c3;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.ai-chat-window {
  display: flex;
  flex-direction: column;
  height: 480px;
  max-height: 80vh;
  overflow: hidden;
}

.ai-chat-header {
  flex-shrink: 0;
}

.ai-chat-conversation {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-chat-input {
  flex-shrink: 0;
  position: relative;
  bottom: auto;
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.ai-chat-conversation {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ai-chat-conversation::-webkit-scrollbar {
  display: none;
}

.ai-service-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
}

.ai-service-menu p {
  grid-column: 1 / -1;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 4px;
}

.ai-service-menu button {
  width: 100%;
  margin: 0;
  padding: 12px 6px;
  box-sizing: border-box;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  background: #f0f7ff;
  color: #075985;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.ai-service-menu button:hover {
  background: #075985;
  color: #ffffff;
}

.ai-more-services {
  margin: 10px 12px;
  padding: 9px 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f0f7ff;
  color: #075985;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
      `}</style>

      {/* ================= HEADER ================= */}

      <header className="header">
        <a href="/" className="logo">
          <picture>
            <source
              media="(max-width: 600px)"
              srcSet={homeIcon2}
            />

            <img
              src={homeIcon}
              alt="Agentic AI Smart Library"
              className="logo-image"
            />
          </picture>
        </a>

        <button
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          <i className="fa-solid fa-right-to-bracket"></i>
          Login
        </button>
      </header>

      {/* ================= CENTER SEARCH SECTION ================= */}

      <section className="search-section">
        <h1 className="search-title">
          Discover Your Next Book
        </h1>

        <p className="search-subtitle">
          Search books, explore knowledge, and find the resources you need.
        </p>

        {/* Search bar connected to the backend */}

        <form
          className="search-container"
          onSubmit={(e) => e.preventDefault()}
        >
          <i className="fa-solid fa-magnifying-glass search-icon"></i>

          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            aria-label="Search books"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button type="submit" className="search-button">
            <span>Search</span>
          </button>
        </form>

        {/* Live book search results */}

        {searchQuery.trim() && (
          <div className="book-results" aria-live="polite">
            {loading && (
              <p className="book-search-message">
                Searching books...
              </p>
            )}

            {!loading && searchError && (
              <p className="book-search-message book-search-error">
                {searchError}
              </p>
            )}

            {!loading && !searchError && books.length === 0 && (
              <p className="book-search-message">
                No books found.
              </p>
            )}

            {!loading &&
              books.map((book) => (
                <div
                  className="book-result-item"
                  key={book.book_id}
                >
                  <div className="book-image-container">
                    <img
                      className="book-result-image"
                      src={book.image_url}
                      alt={book.book_name}
                      onError={(e) => {
                        console.error("Book image failed:", book.image_url);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="book-result-details">
                    <h3 className="book-result-title">
                      {book.book_name}
                    </h3>

                    <p className="book-result-author">
                      Author: {book.author}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ================= LIBRARY UPDATES ================= */}

        <div className="library-updates">
          <h2 className="library-updates-heading">
            <i className="fa-solid fa-bell"></i>
            Library Updates
          </h2>

          <div className="library-updates-list" aria-live="polite">
            <div
              className="library-update-item"
              key={updateIndex}
            >
              <i className="fa-solid fa-circle-info"></i>

              <p>
                  {libraryUpdates.length > 0
                      ? libraryUpdates[updateIndex]?.message
                      : "No new library updates at the moment."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FLOATING AI ASSISTANT GIF ================= */}

      <button
        className="ai-assistant-button"
        aria-label="Open AI Library Assistant"
        title="AI Library Assistant"
        onClick={() => setIsChatOpen(true)}
      >
        <img src={aiRobot} alt="AI Robot" />
      </button>
      {isChatOpen && (
  <div className="ai-chat-window">

    <div className="ai-chat-header">
      <div>
        <h3>AI Library Assistant</h3>
        <span>● Online</span>
      </div>

      <button onClick={() => setIsChatOpen(false)}>
        ✕
      </button>
    </div>

   {!isUSNVerified ? (
        <div className="ai-chat-message">
          Hello! 👋 Welcome to your Smart Library.
          <br /><br />
          Before we begin, may I know your USN?
        </div>
      ) : (
        <div className="ai-chat-conversation" ref={chatConversationRef}>
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`ai-chat-message ${message.sender === "user" ? "user-message" : "bot-message"}`}
            >
              {message.text}
            </div>
          ))}
          {isUSNVerified && showServiceMenu && (
          <div className="ai-service-menu">
              <p>Choose a service</p>

              {[
                "My Borrowed Books",
                "Search Books",
                "Return Dates",
                "My Fines",
                "Book Availability",
                "Library Rules"
              ].map((service) => (
                <button
                  key={service}
                  onClick={() => {
                    setShowServiceMenu(false);
                    handleChatSend(service);
                  }}
                >
                  {service}
                </button>
              ))}
            </div>
          )}
          {isUSNVerified && !showServiceMenu && (
            <button
              className="ai-more-services"
              onClick={() => setShowServiceMenu(true)}
            >
              + Choose another service
            </button>
          )}
        </div>
      )}
    {!isUSNVerified && (
    <div className="ai-usn-input">
      <input
        type="text"
        placeholder="Enter your USN"
        value={chatUSN}
        onChange={(e) => setChatUSN(e.target.value.toUpperCase())}
      />
      <button
        onClick={handleUSNVerify}
        disabled={isVerifyingUSN || isUSNVerified}
      >
        {isVerifyingUSN ? "Verifying..." : isUSNVerified ? "Verified ✓" : "Verify"}
      </button>
    </div>
    )}
    {usnMessage && !isUSNVerified && (
      <div className="ai-usn-message error">
        {usnMessage}
      </div>
    )}
    {isUSNVerified && (
  <div className="ai-chat-input">
    <span className="chat-verified">✓ Verified</span>

    <input
      type="text"
      placeholder="Ask me anything..."
      value={chatInput}
      onChange={(e) => setChatInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleChatSend();
      }}
    />

    <button onClick={handleChatSend}>Send</button>
  </div>
)}

  </div>
)}
    </>
  );
}

export default Home;
