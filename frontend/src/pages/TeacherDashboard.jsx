
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
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";

import HomeIcon from "../assets/HomeIcon.png";

function TeacherDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // CROPPER STATES
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [teacher, setTeacher] = useState({
    name: "",
    usn: "",
    profile_photo: ""
  });

  const [photoLoading, setPhotoLoading] = useState(false);

  const token = localStorage.getItem("teacherToken");

  // BUILD CORRECT BACKEND IMAGE URL
  const getPhotoUrl = (photo) => {
    if (!photo) return "";

    if (photo.startsWith("http")) {
      return photo;
    }

    return `http://localhost:5000${photo.startsWith("/") ? "" : "/"}${photo}`;
  };

  // FETCH LOGGED-IN TEACHER DETAILS
  useEffect(() => {
    const fetchTeacher = async () => {
      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/teachers/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("Unable to fetch teacher details.");
        }

        const data = await response.json();
        const details = data.teacher || data.data || data;

        setTeacher({
          name: details.teacher_name || details.name || "",
          usn: details.usn || "",
          profile_photo: details.profile_photo || ""
        });
      } catch (err) {
        console.error("Teacher fetch error:", err);
      }
    };

    fetchTeacher();
  }, [token, navigate]);

  // SEARCH BOOKS
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
        `http://localhost:5000/api/books/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Unable to search books.");
      }

      const data = await response.json();

      const books = Array.isArray(data)
        ? data
        : data.books || data.results || data.data?.books || data.data || [];

      setSearchResults(Array.isArray(books) ? books : []);
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

  // AUTOMATIC SEARCH AFTER 300ms
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

  // SEARCH BUTTON
  const handleSearch = (e) => {
    e.preventDefault();
    searchBooks(searchQuery);
  };

  // SELECT BOOK
  const handleBookSelect = (book) => {
    setSearchQuery(book.book_name);
    setShowResults(false);
  };

  // OPEN PHOTO SELECTOR
  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

  // SELECT PHOTO AND OPEN CROPPER
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

  // STORE FINAL CROPPED AREA
  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  // CREATE CROPPED IMAGE
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

  // SAVE CROPPED PHOTO TO BACKEND
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
        "http://localhost:5000/api/teachers/profile-photo",
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

      const photo =
        data.profile_photo || data.teacher?.profile_photo;

      if (!photo) {
        throw new Error("Photo uploaded, but no photo path was returned.");
      }

      setTeacher((prev) => ({
        ...prev,
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

  // CANCEL PHOTO CROPPING
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

  // LOGOUT
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/teachers/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("teacher");
      localStorage.removeItem("role");
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="student-dashboard">

      {/* HEADER */}
      <header className="student-header">

        {/* LOGO */}
        <div className="header-logo">
          <img src={HomeIcon} alt="Agentic AI Logo" />
        </div>

        {/* SEARCH */}
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

          {/* SEARCH RESULTS */}
          {showResults && (
            <div className="search-results">

              {loading && (
                <div className="search-message">
                  Searching books...
                </div>
              )}

              {!loading && error && (
                <div className="search-message error-message">
                  {error}
                </div>
              )}

              {!loading && !error && searchResults.length === 0 && (
                <div className="search-message">
                  No books found.
                </div>
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
                          src={book.image_url}
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

        {/* TEACHER PROFILE */}
        <div className="profile-container">

          <button
            className="profile-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="profile-avatar">
              {teacher.profile_photo ? (
                <img
                  src={getPhotoUrl(teacher.profile_photo)}
                  alt="Teacher"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>

            <div className="profile-info">
              <h4>{teacher.name || "Loading..."}</h4>
              <span>{teacher.usn}</span>
            </div>

            <FontAwesomeIcon
              icon={faChevronDown}
              className={`profile-arrow ${showProfile ? "rotate" : ""}`}
            />
          </button>

          {/* PROFILE DROPDOWN */}
          {showProfile && (
            <div className="profile-dropdown">

              <div className="dropdown-profile-info">

                <div className="dropdown-avatar">
                  {teacher.profile_photo ? (
                    <img
                      src={getPhotoUrl(teacher.profile_photo)}
                      alt="Teacher Profile"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} />
                  )}
                </div>

                <div>
                  <strong>{teacher.name}</strong>
                  <span>{teacher.usn}</span>
                </div>

              </div>

              <div className="dropdown-divider"></div>

              {/* EDIT PHOTO */}
              <button
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

              <div className="dropdown-divider"></div>

              {/* LOGOUT */}
              <button
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

      {/* TEACHER DASHBOARD MAIN BODY - TO BE IMPLEMENTED LATER */}
      <main className="teacher-dashboard-main">
      </main>

      {/* CIRCULAR PHOTO CROPPER MODAL */}
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
          background: #ffffff;
          font-family: "Inter", "Segoe UI", sans-serif;
          color: #102b55;
        }

        .student-header {
          width: 100%;
          min-height: 82px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
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

        /* PROFILE DROPDOWN */

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

        /* PHOTO CROPPER MODAL */

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

        /* RESPONSIVE */

        @media (max-width: 600px) {
          .student-header {
            min-height: 75px;
            padding: 10px 12px;
            gap: 12px;
            flex-wrap: wrap;
          }

          .header-logo {
            margin-left: 0;
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

          .crop-modal {
            padding: 18px;
          }

          .crop-container {
            height: 280px;
          }
        }
      `}</style>

    </div>
  );
}

export default TeacherDashboard;
