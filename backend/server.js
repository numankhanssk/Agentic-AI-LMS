
// Smart Library Backend
// Student and Teacher OTP Login, JWT Authentication,
// Profile Management, Book Search and All Books Dashboard

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("./db");
const { sendOtpEmail } = require("./emailService");

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from backend/.env");
}

const uploadDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

app.use("/uploads", express.static(uploadDirectory));

const otpStore = new Map();

// --------------------------------------------------
// MULTER CONFIGURATION
// --------------------------------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const extensions = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        cb(null, crypto.randomUUID() + extensions[file.mimetype]);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG, PNG and WEBP images are allowed.")
            );
        }

        cb(null, true);
    }
});

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

function authenticateStudent(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login."
        });
    }

    try {
        const decoded = jwt.verify(
            authHeader.split(" ")[1],
            process.env.JWT_SECRET
        );

        if (!decoded.student_id) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        req.student = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please login again."
        });
    }
}

function authenticateTeacher(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please login."
        });
    }

    try {
        const decoded = jwt.verify(
            authHeader.split(" ")[1],
            process.env.JWT_SECRET
        );

        if (!decoded.teacher_id || decoded.role !== "teacher") {
            return res.status(401).json({
                success: false,
                message: "Invalid teacher authentication token."
            });
        }

        req.teacher = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please login again."
        });
    }
}

function authenticateAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Admin authentication required."
        });
    }

    try {
        const decoded = jwt.verify(
            authHeader.split(" ")[1],
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access denied."
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session."
        });
    }
}

// ==================================================
// ADMIN AUTHENTICATION
// ==================================================



app.post("/api/admin/login", (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
            console.error("Admin credentials missing in .env");

            return res.status(500).json({
                success: false,
                message: "Admin credentials are not configured."
            });
        }

        if (
            username.trim() !== adminUsername ||
            password !== adminPassword
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin username or password."
            });
        }

        const token = jwt.sign(
            {
                role: "admin",
                username: adminUsername
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            success: true,
            message: "Admin login successful!",
            token,
            admin: {
                username: adminUsername,
                role: "admin"
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process admin login."
        });
    }
});

// ==================================================
// ADMIN STUDENT MANAGEMENT
// ==================================================

// --------------------------------------------------
// GET ALL STUDENTS
// --------------------------------------------------

app.get("/api/admin/students", authenticateAdmin, (req, res) => {
    const sql = `
        SELECT
            student_id,
            name,
            email,
            usn,
            semester,
            profile_photo
        FROM students
        ORDER BY student_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Student fetch error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch students."
            });
        }

        return res.json({
            success: true,
            total: results.length,
            students: results
        });
    });
});

// --------------------------------------------------
// ADD STUDENT
// --------------------------------------------------

app.post("/api/admin/students", authenticateAdmin, (req, res) => {
    const { name, email, usn, semester } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof usn !== "string" ||
        typeof semester !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !usn.trim() ||
        !semester.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, email, USN and semester are required."
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanSemester = semester.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    const sql = `
        INSERT INTO students
            (name, email, usn, semester)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [cleanName, cleanEmail, cleanUsn, cleanSemester],
        (err, result) => {
            if (err) {
                console.error("Student insert error:", err.message);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "A student with this USN already exists."
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to add student."
                });
            }

            return res.status(201).json({
                success: true,
                message: "Student added successfully!",
                student: {
                    student_id: result.insertId,
                    name: cleanName,
                    email: cleanEmail,
                    usn: cleanUsn,
                    semester: cleanSemester,
                    profile_photo: null
                }
            });
        }
    );
});

// --------------------------------------------------
// UPDATE STUDENT
// --------------------------------------------------

app.put("/api/admin/students/:id", authenticateAdmin, (req, res) => {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID."
        });
    }

    const { name, email, usn, semester } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof usn !== "string" ||
        typeof semester !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !usn.trim() ||
        !semester.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, email, USN and semester are required."
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanUsn = usn.trim().toUpperCase();
    const cleanSemester = semester.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    const sql = `
        UPDATE students
        SET
            name = ?,
            email = ?,
            usn = ?,
            semester = ?
        WHERE student_id = ?
    `;

    db.query(
        sql,
        [
            cleanName,
            cleanEmail,
            cleanUsn,
            cleanSemester,
            studentId
        ],
        (err, result) => {
            if (err) {
                console.error("Student update error:", err.message);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        success: false,
                        message: "Another student already uses this USN."
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Unable to update student."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            return res.json({
                success: true,
                message: "Student updated successfully!"
            });
        }
    );
});

// --------------------------------------------------
// DELETE STUDENT
// --------------------------------------------------

app.delete("/api/admin/students/:id", authenticateAdmin, (req, res) => {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID."
        });
    }

    const sql = `
        DELETE FROM students
        WHERE student_id = ?
    `;

    db.query(sql, [studentId], (err, result) => {
        if (err) {
            console.error("Student delete error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to delete student."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        return res.json({
            success: true,
            message: "Student deleted successfully!"
        });
    });
});

// --------------------------------------------------
// HOME AND DATABASE TEST
// --------------------------------------------------

app.get("/", (req, res) => {
    res.send("Smart Library Backend is Running!");
});

app.get("/test-db", (req, res) => {
    db.query(
        "SELECT DATABASE() AS database_name",
        (err, results) => {
            if (err) {
                console.error("Database query failed:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Database query failed."
                });
            }

            res.json({
                success: true,
                message: "MySQL Connected Successfully!",
                database: results[0].database_name
            });
        }
    );
});

// ==================================================
// BOOK APIs
// ==================================================

// --------------------------------------------------
// ADMIN: GET ALL SUBJECTS
// --------------------------------------------------

app.get("/api/admin/subjects", authenticateAdmin, (req, res) => {
    const sql = `
        SELECT
            s.subject_id,
            s.subject_name,
            s.subject_code,
            d.department_id,
            d.department_name,
            d.department_code,
            sem.semester_id,
            sem.semester_number,
            sem.semester_name
        FROM subjects s
        JOIN departments d
            ON s.department_id = d.department_id
        JOIN semesters sem
            ON s.semester_id = sem.semester_id
        ORDER BY d.department_name, sem.semester_number, s.subject_name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Admin subjects fetch error:", err.message);
            return res.status(500).json({
                success: false,
                message: "Unable to fetch subjects."
            });
        }

        res.json({
            success: true,
            subjects: results
        });
    });
});


// --------------------------------------------------
// ADMIN: ADD NEW SUBJECT
// --------------------------------------------------

app.post("/api/admin/subjects", authenticateAdmin, (req, res) => {
    const {
        subject_name,
        subject_code,
        department_id,
        semester_id
    } = req.body;

    const cleanName =
        typeof subject_name === "string" ? subject_name.trim() : "";

    const cleanCode =
        typeof subject_code === "string" ? subject_code.trim() : "";

    const departmentId = Number(department_id);
    const semesterId = Number(semester_id);

    // Validate input
    if (
        !cleanName ||
        !cleanCode ||
        !Number.isInteger(departmentId) ||
        departmentId < 1 ||
        !Number.isInteger(semesterId) ||
        semesterId < 1
    ) {
        return res.status(400).json({
            success: false,
            message: "All subject details are required."
        });
    }

    // Verify department and semester
    const validationSql = `
        SELECT
            d.department_id,
            d.department_name,
            d.department_code,
            sem.semester_id,
            sem.semester_number,
            sem.semester_name
        FROM departments d
        CROSS JOIN semesters sem
        WHERE d.department_id = ?
          AND sem.semester_id = ?
    `;

    db.query(
        validationSql,
        [departmentId, semesterId],
        (validationError, results) => {
            if (validationError) {
                console.error("Subject validation error:", validationError.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to validate department and semester."
                });
            }

            if (results.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected department or semester does not exist."
                });
            }

            const selected = results[0];

            // Check for an existing subject in the same department and semester
            const duplicateSql = `
                SELECT subject_id
                FROM subjects
                WHERE department_id = ?
                  AND semester_id = ?
                  AND (
                      LOWER(subject_name) = LOWER(?)
                      OR UPPER(subject_code) = UPPER(?)
                  )
                LIMIT 1
            `;

            db.query(
                duplicateSql,
                [departmentId, semesterId, cleanName, cleanCode],
                (duplicateError, duplicates) => {
                    if (duplicateError) {
                        console.error("Subject duplicate check error:", duplicateError.message);

                        return res.status(500).json({
                            success: false,
                            message: "Unable to check existing subjects."
                        });
                    }

                    if (duplicates.length > 0) {
                        return res.status(409).json({
                            success: false,
                            message: "This subject name or code already exists for the selected department and semester."
                        });
                    }

                    // Insert new subject
                    const insertSql = `
                        INSERT INTO subjects
                            (subject_name, subject_code, department_id, semester_id)
                        VALUES (?, ?, ?, ?)
                    `;

                    db.query(
                        insertSql,
                        [cleanName, cleanCode, departmentId, semesterId],
                        (insertError, result) => {
                            if (insertError) {
                                console.error("Subject insert error:", insertError.message);

                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to add subject."
                                });
                            }

                            return res.status(201).json({
                                success: true,
                                message: "Subject added successfully!",
                                subject: {
                                    subject_id: result.insertId,
                                    subject_name: cleanName,
                                    subject_code: cleanCode,
                                    department_id: selected.department_id,
                                    department_name: selected.department_name,
                                    department_code: selected.department_code,
                                    semester_id: selected.semester_id,
                                    semester_number: selected.semester_number,
                                    semester_name: selected.semester_name
                                }
                            });
                        }
                    );
                }
            );
        }
    );
});


// --------------------------------------------------
// ADMIN: ADD BOOK
// --------------------------------------------------

app.post("/api/admin/books", authenticateAdmin, (req, res) => {
    const {
        name,
        author,
        isbn,
        subject_id,
        image,
        description,
        copies
    } = req.body;

    const subjectId = Number(subject_id);
    const availableCopies = Number(copies);

    if (
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isInteger(subjectId) ||
        subjectId < 1 ||
        !Number.isInteger(availableCopies) ||
        availableCopies < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Book name, valid subject and copies are required."
        });
    }

    const book = {
        name: name.trim(),
        author: typeof author === "string" ? author.trim() : "",
        isbn: typeof isbn === "string" && isbn.trim() ? isbn.trim() : null,
        image: typeof image === "string" ? image.trim() : "",
        description: typeof description === "string" ? description.trim() : "",
        copies: availableCopies
    };

    db.query(
        "SELECT subject_id FROM subjects WHERE subject_id = ?",
        [subjectId],
        (subjectError, subjects) => {
            if (subjectError) {
                console.error("Subject validation error:", subjectError.message);
                return res.status(500).json({
                    success: false,
                    message: "Unable to validate subject."
                });
            }

            if (subjects.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Selected subject does not exist."
                });
            }

            db.beginTransaction((transactionError) => {
                if (transactionError) {
                    console.error("Book transaction error:", transactionError.message);
                    return res.status(500).json({
                        success: false,
                        message: "Unable to start book creation."
                    });
                }

                const insertBookSql = `
                    INSERT INTO books
                        (book_name, author, isbn, image_url, description, available_copies)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    insertBookSql,
                    [
                        book.name,
                        book.author,
                        book.isbn,
                        book.image,
                        book.description,
                        book.copies
                    ],
                    (insertError, result) => {
                        if (insertError) {
                            return db.rollback(() => {
                                console.error("Book insert error:", insertError.message);

                                res.status(
                                    insertError.code === "ER_DUP_ENTRY" ? 409 : 500
                                ).json({
                                    success: false,
                                    message: insertError.code === "ER_DUP_ENTRY"
                                        ? "A book with this ISBN already exists."
                                        : "Unable to add book."
                                });
                            });
                        }

                        db.query(
                            "INSERT INTO book_subjects (book_id, subject_id) VALUES (?, ?)",
                            [result.insertId, subjectId],
                            (linkError) => {
                                if (linkError) {
                                    return db.rollback(() => {
                                        console.error("Book subject link error:", linkError.message);
                                        res.status(500).json({
                                            success: false,
                                            message: "Unable to link book with subject."
                                        });
                                    });
                                }

                                db.commit((commitError) => {
                                    if (commitError) {
                                        return db.rollback(() => {
                                            console.error("Book commit error:", commitError.message);
                                            res.status(500).json({
                                                success: false,
                                                message: "Unable to save book."
                                            });
                                        });
                                    }

                                    res.status(201).json({
                                        success: true,
                                        message: "Book added successfully!",
                                        book_id: result.insertId
                                    });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

// --------------------------------------------------
// ADMIN: EDIT BOOK
// --------------------------------------------------

app.put("/api/admin/books/:id", authenticateAdmin, (req, res) => {
    const bookId = Number(req.params.id);

    const {
        name,
        author,
        isbn,
        subject_id,
        image,
        description,
        copies
    } = req.body;

    const subjectId = Number(subject_id);
    const availableCopies = Number(copies);

    if (
        !Number.isInteger(bookId) || bookId < 1 ||
        typeof name !== "string" || !name.trim() ||
        !Number.isInteger(subjectId) || subjectId < 1 ||
        !Number.isInteger(availableCopies) || availableCopies < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid book details."
        });
    }

    const cleanBook = {
        name: name.trim(),
        author: typeof author === "string" ? author.trim() : "",
        isbn: typeof isbn === "string" && isbn.trim() ? isbn.trim() : null,
        image: typeof image === "string" ? image.trim() : "",
        description: typeof description === "string" ? description.trim() : "",
        copies: availableCopies
    };

    db.query(
        "SELECT book_id FROM books WHERE book_id = ?",
        [bookId],
        (bookError, books) => {
            if (bookError) {
                console.error("Book lookup error:", bookError.message);
                return res.status(500).json({
                    success: false,
                    message: "Unable to find book."
                });
            }

            if (books.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Book not found."
                });
            }

            db.query(
                "SELECT subject_id FROM subjects WHERE subject_id = ?",
                [subjectId],
                (subjectError, subjects) => {
                    if (subjectError) {
                        console.error("Subject lookup error:", subjectError.message);
                        return res.status(500).json({
                            success: false,
                            message: "Unable to validate subject."
                        });
                    }

                    if (subjects.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: "Selected subject does not exist."
                        });
                    }

                    db.beginTransaction((transactionError) => {
                        if (transactionError) {
                            return res.status(500).json({
                                success: false,
                                message: "Unable to start book update."
                            });
                        }

                        const updateSql = `
                            UPDATE books
                            SET book_name = ?,
                                author = ?,
                                isbn = ?,
                                image_url = ?,
                                description = ?,
                                available_copies = ?
                            WHERE book_id = ?
                        `;

                        db.query(
                            updateSql,
                            [
                                cleanBook.name,
                                cleanBook.author,
                                cleanBook.isbn,
                                cleanBook.image,
                                cleanBook.description,
                                cleanBook.copies,
                                bookId
                            ],
                            (updateError) => {
                                if (updateError) {
                                    return db.rollback(() => {
                                        console.error("Book update error:", updateError.message);
                                        res.status(
                                            updateError.code === "ER_DUP_ENTRY" ? 409 : 500
                                        ).json({
                                            success: false,
                                            message: updateError.code === "ER_DUP_ENTRY"
                                                ? "Another book already uses this ISBN."
                                                : "Unable to update book."
                                        });
                                    });
                                }

                                db.query(
                                    "DELETE FROM book_subjects WHERE book_id = ?",
                                    [bookId],
                                    (deleteLinkError) => {
                                        if (deleteLinkError) {
                                            return db.rollback(() => {
                                                console.error("Old subject link delete error:", deleteLinkError.message);
                                                res.status(500).json({
                                                    success: false,
                                                    message: "Unable to update book subject."
                                                });
                                            });
                                        }

                                        db.query(
                                            "INSERT INTO book_subjects (book_id, subject_id) VALUES (?, ?)",
                                            [bookId, subjectId],
                                            (linkError) => {
                                                if (linkError) {
                                                    return db.rollback(() => {
                                                        console.error("New subject link error:", linkError.message);
                                                        res.status(500).json({
                                                            success: false,
                                                            message: "Unable to link updated book."
                                                        });
                                                    });
                                                }

                                                db.commit((commitError) => {
                                                    if (commitError) {
                                                        return db.rollback(() => {
                                                            console.error("Book update commit error:", commitError.message);
                                                            res.status(500).json({
                                                                success: false,
                                                                message: "Unable to save book changes."
                                                            });
                                                        });
                                                    }

                                                    res.json({
                                                        success: true,
                                                        message: "Book updated successfully!"
                                                    });
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                }
            );
        }
    );
});

// --------------------------------------------------
// ADMIN: DELETE BOOK
// --------------------------------------------------

app.delete("/api/admin/books/:id", authenticateAdmin, (req, res) => {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid book ID."
        });
    }

    db.beginTransaction((transactionError) => {
        if (transactionError) {
            return res.status(500).json({
                success: false,
                message: "Unable to start book deletion."
            });
        }

        db.query(
            "DELETE FROM book_subjects WHERE book_id = ?",
            [bookId],
            (linkError) => {
                if (linkError) {
                    return db.rollback(() => {
                        console.error("Book subject deletion error:", linkError.message);
                        res.status(500).json({
                            success: false,
                            message: "Unable to remove book subject links."
                        });
                    });
                }

                db.query(
                    "DELETE FROM books WHERE book_id = ?",
                    [bookId],
                    (deleteError, result) => {
                        if (deleteError) {
                            return db.rollback(() => {
                                console.error("Book deletion error:", deleteError.message);
                                res.status(500).json({
                                    success: false,
                                    message: "Unable to delete book."
                                });
                            });
                        }

                        if (result.affectedRows === 0) {
                            return db.rollback(() => {
                                res.status(404).json({
                                    success: false,
                                    message: "Book not found."
                                });
                            });
                        }

                        db.commit((commitError) => {
                            if (commitError) {
                                return db.rollback(() => {
                                    console.error("Book deletion commit error:", commitError.message);
                                    res.status(500).json({
                                        success: false,
                                        message: "Unable to save book deletion."
                                    });
                                });
                            }

                            res.json({
                                success: true,
                                message: "Book deleted successfully!"
                            });
                        });
                    }
                );
            }
        );
    });
});


// --------------------------------------------------
// GET FILTER OPTIONS: DEPARTMENTS AND SEMESTERS
// --------------------------------------------------

app.get("/api/books/filters", (req, res) => {
  const query = `
    SELECT
      (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'department_id', department_id,
          'department_name', department_name
        )
      ) FROM departments) AS departments,

      (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'semester_id', semester_id,
          'semester_number', semester_number,
          'semester_name', semester_name
        )
      ) FROM semesters) AS semesters
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Filter fetch error:", err);
      return res.status(500).json({
        message: "Unable to fetch departments and semesters."
      });
    }

    res.json({
      departments: results[0].departments || [],
      semesters: results[0].semesters || []
    });
  });
});

// --------------------------------------------------
// GET BOOKS WITH OPTIONAL SEMESTER AND DEPARTMENT FILTERS
// --------------------------------------------------

app.get("/api/books", (req, res) => {
    const semesterId = req.query.semester_id;
    const departmentId = req.query.department_id;

    if (
        semesterId !== undefined &&
        (!/^\d+$/.test(String(semesterId)) || Number(semesterId) < 1)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid semester selection."
        });
    }

    if (
        departmentId !== undefined &&
        (!/^\d+$/.test(String(departmentId)) || Number(departmentId) < 1)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid department selection."
        });
    }

    let sql = `
        SELECT
            b.book_id,
            b.book_name,
            b.author,
            b.isbn,
            b.image_url,
            b.description,
            b.available_copies,
            MIN(s.department_id) AS department_id,
            MIN(sem.semester_number) AS semester_number,

            GROUP_CONCAT(
                DISTINCT s.subject_name
                ORDER BY s.subject_name
                SEPARATOR ', '
            ) AS subject_names,

            GROUP_CONCAT(
                DISTINCT sem.semester_name
                ORDER BY sem.semester_number
                SEPARATOR ', '
            ) AS semester_names,

            GROUP_CONCAT(
                DISTINCT d.department_name
                ORDER BY d.department_name
                SEPARATOR ', '
            ) AS department_names

        FROM books b

        LEFT JOIN book_subjects bs
            ON b.book_id = bs.book_id

        LEFT JOIN subjects s
            ON bs.subject_id = s.subject_id

        LEFT JOIN semesters sem
            ON s.semester_id = sem.semester_id

        LEFT JOIN departments d
            ON s.department_id = d.department_id

        WHERE 1 = 1
    `;

    const params = [];

    if (semesterId !== undefined) {
        sql += `
            AND EXISTS (
                SELECT 1
                FROM book_subjects filter_bs
                JOIN subjects filter_s
                    ON filter_bs.subject_id = filter_s.subject_id
                WHERE filter_bs.book_id = b.book_id
                AND filter_s.semester_id = ?
            )
        `;

        params.push(Number(semesterId));
    }

    if (departmentId !== undefined) {
        sql += `
            AND EXISTS (
                SELECT 1
                FROM book_subjects filter_bs
                JOIN subjects filter_s
                    ON filter_bs.subject_id = filter_s.subject_id
                WHERE filter_bs.book_id = b.book_id
                AND filter_s.department_id = ?
            )
        `;

        params.push(Number(departmentId));
    }

    sql += `
        GROUP BY
            b.book_id,
            b.book_name,
            b.author,
            b.isbn,
            b.image_url,
            b.description,
            b.available_copies

        ORDER BY b.book_name
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Books fetch failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch books."
            });
        }

        return res.json({
            success: true,
            total: results.length,
            books: results
        });
    });
});

// --------------------------------------------------
// BOOK SEARCH
// --------------------------------------------------

app.get("/api/books/search", (req, res) => {
    const search = req.query.q || "";

    const sql = `
        SELECT book_id, book_name, author, image_url
        FROM books
        WHERE book_name LIKE ?
           OR author LIKE ?
        ORDER BY book_name
        LIMIT 10
    `;

    const searchValue = `%${search}%`;

    db.query(
        sql,
        [searchValue, searchValue],
        (err, results) => {
            if (err) {
                console.error("Book search failed:", err.message);

                return res.status(500).json({
                    success: false,
                    message: "Unable to search books."
                });
            }

            res.json({
                success: true,
                books: results
            });
        }
    );
});

// --------------------------------------------------
// BOOK AVAILABILITY
// --------------------------------------------------

app.get("/api/books/availability", (req, res) => {
    const search = req.query.q || "";

    const sql = `
        SELECT book_id, book_name, author, available_copies
        FROM books
        WHERE book_name LIKE ?
           OR author LIKE ?
        ORDER BY book_name
        LIMIT 10
    `;

    const searchValue = `%${search}%`;

    db.query(sql, [searchValue, searchValue], (err, results) => {
        if (err) {
            console.error("Book availability check failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to check book availability."
            });
        }

        res.json({
            success: true,
            books: results
        });
    });
});

// ==================================================
// STUDENT AUTHENTICATION
// ==================================================

app.post("/api/auth/send-otp", (req, res) => {
    const { usn, email } = req.body;

    if (
        typeof usn !== "string" ||
        typeof email !== "string" ||
        !usn.trim() ||
        !email.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid USN and email are required."
        });
    }

    const sql = `
        SELECT student_id, name, email, usn
        FROM students
        WHERE usn = ? AND LOWER(email) = LOWER(?)
        LIMIT 1
    `;

    db.query(sql, [usn.trim(), email.trim()], async (err, results) => {
        if (err) {
            console.error("Student verification failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to verify student."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student does not exist. Please contact your college library."
            });
        }

        const student = results[0];
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        try {
            await sendOtpEmail(student.email, student.name, otp);

            otpStore.set(student.usn.trim().toUpperCase(), {
                otp,
                expiresAt,
                attempts: 0,
                student_id: student.student_id
            });

            return res.json({
                success: true,
                message: "OTP sent successfully to your registered email."
            });
        } catch (emailError) {
            console.error("OTP email failed:", emailError.message);

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }
    });
});

app.post("/api/auth/verify-otp", (req, res) => {
    const { usn, otp } = req.body;

    if (
        typeof usn !== "string" ||
        typeof otp !== "string" ||
        !usn.trim() ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid USN and six-digit OTP are required."
        });
    }

    const key = usn.trim().toUpperCase();
    const storedData = otpStore.get(key);

    if (!storedData) {
        return res.status(400).json({
            success: false,
            message: "OTP not found. Please request a new OTP."
        });
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(key);

        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new OTP."
        });
    }

    if (storedData.attempts >= 5) {
        otpStore.delete(key);

        return res.status(429).json({
            success: false,
            message: "Maximum OTP attempts reached. Please request a new OTP."
        });
    }

    if (storedData.otp !== otp) {
        storedData.attempts++;

        if (storedData.attempts >= 5) {
            otpStore.delete(key);

            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts reached. Please request a new OTP."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Incorrect OTP. Please try again."
        });
    }

    otpStore.delete(key);

    const sql = `
        SELECT student_id, name, email, usn, semester, profile_photo
        FROM students
        WHERE student_id = ?
        LIMIT 1
    `;

    db.query(sql, [storedData.student_id], (err, results) => {
        if (err) {
            console.error("Student details fetch failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch student details."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const student = results[0];

        const token = jwt.sign(
            {
                student_id: student.student_id,
                usn: student.usn
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.json({
            success: true,
            message: "OTP verified successfully!",
            token,
            student: {
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                usn: student.usn,
                semester: student.semester,
                profile_photo: student.profile_photo
                    ? `/uploads/${student.profile_photo}`
                    : null
            }
        });
    });
});

// --------------------------------------------------
// GET STUDENT DETAILS
// --------------------------------------------------

app.get("/api/students/me", authenticateStudent, (req, res) => {
    const sql = `
        SELECT student_id, name, email, usn, semester, profile_photo
        FROM students
        WHERE student_id = ?
        LIMIT 1
    `;

    db.query(sql, [req.student.student_id], (err, results) => {
        if (err) {
            console.error("Student profile fetch failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch student profile."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const student = results[0];

        res.json({
            success: true,
            student: {
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                usn: student.usn,
                semester: student.semester,
                profile_photo: student.profile_photo
                    ? `/uploads/${student.profile_photo}`
                    : null
            }
        });
    });
});

// ==================================================
// STUDENT BOOK CART APIs
// ==================================================

// Serialize cart transactions because db.js currently uses
// one MySQL connection.
let cartTransactionQueue = Promise.resolve();

function runCartTransaction(callback) {
    const task = cartTransactionQueue.then(async () => {
        const connection = db.promise();

        await connection.beginTransaction();

        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });

    cartTransactionQueue = task.catch(() => {});
    return task;
}

// --------------------------------------------------
// GET STUDENT CART
// --------------------------------------------------

app.get("/api/students/cart", authenticateStudent, (req, res) => {
    const sql = `
        SELECT
            b.book_id,
            b.book_name,
            b.author,
            b.isbn,
            b.image_url,
            b.description,
            b.available_copies,
            c.added_at
        FROM student_book_cart c
        JOIN books b
            ON c.book_id = b.book_id
        WHERE c.student_id = ?
        ORDER BY c.added_at DESC
    `;

    db.query(sql, [req.student.student_id], (err, results) => {
        if (err) {
            console.error("Student cart fetch error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch added books."
            });
        }

        return res.json({
            success: true,
            total: results.length,
            books: results
        });
    });
});

// --------------------------------------------------
// ADD BOOK TO STUDENT CART
// --------------------------------------------------

app.post("/api/students/cart", authenticateStudent, async (req, res) => {
    const studentId = req.student.student_id;
    const bookId = Number(req.body.book_id);

    if (!Number.isInteger(bookId) || bookId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid book ID."
        });
    }

    try {
        await runCartTransaction(async (connection) => {

            // Lock the student row to prevent simultaneous cart updates.
            const [students] = await connection.query(
                "SELECT student_id FROM students WHERE student_id = ? FOR UPDATE",
                [studentId]
            );

            if (students.length === 0) {
                const error = new Error("Student not found.");
                error.status = 404;
                throw error;
            }

            // Lock the selected book row.
            const [books] = await connection.query(
                "SELECT available_copies FROM books WHERE book_id = ? FOR UPDATE",
                [bookId]
            );

            if (books.length === 0) {
                const error = new Error("Book not found.");
                error.status = 404;
                throw error;
            }

            if (books[0].available_copies <= 0) {
                const error = new Error("This book is currently out of stock.");
                error.status = 409;
                throw error;
            }

            // Check whether this student already added the book.
            const [existing] = await connection.query(
                `SELECT cart_id FROM student_book_cart
                 WHERE student_id = ? AND book_id = ?`,
                [studentId, bookId]
            );

            if (existing.length > 0) {
                const error = new Error("This book is already in your cart.");
                error.status = 409;
                throw error;
            }

            // Maximum five books per student.
            const [cartCount] = await connection.query(
                "SELECT COUNT(*) AS total FROM student_book_cart WHERE student_id = ?",
                [studentId]
            );

            if (cartCount[0].total >= 5) {
                const error = new Error("You can add a maximum of 5 books.");
                error.status = 409;
                throw error;
            }

            // Reduce available copies.
            await connection.query(
                `UPDATE books
                 SET available_copies = available_copies - 1
                 WHERE book_id = ? AND available_copies > 0`,
                [bookId]
            );

            // Save the book in the student's cart.
            await connection.query(
                `INSERT INTO student_book_cart (student_id, book_id)
                 VALUES (?, ?)`,
                [studentId, bookId]
            );
        });

        return res.status(201).json({
            success: true,
            message: "Book added successfully!"
        });

    } catch (error) {
        console.error("Add to cart error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Unable to add book."
        });
    }
});

// --------------------------------------------------
// REMOVE BOOK FROM STUDENT CART
// --------------------------------------------------

app.delete("/api/students/cart/:bookId", authenticateStudent, async (req, res) => {
    const studentId = req.student.student_id;
    const bookId = Number(req.params.bookId);

    if (!Number.isInteger(bookId) || bookId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid book ID."
        });
    }

    try {
        await runCartTransaction(async (connection) => {

            // Lock the student row.
            const [students] = await connection.query(
                "SELECT student_id FROM students WHERE student_id = ? FOR UPDATE",
                [studentId]
            );

            if (students.length === 0) {
                const error = new Error("Student not found.");
                error.status = 404;
                throw error;
            }

            // Confirm the book belongs to this student's cart.
            const [cartItems] = await connection.query(
                `SELECT cart_id FROM student_book_cart
                 WHERE student_id = ? AND book_id = ?
                 FOR UPDATE`,
                [studentId, bookId]
            );

            if (cartItems.length === 0) {
                const error = new Error("Book not found in your cart.");
                error.status = 404;
                throw error;
            }

            // Remove the cart entry.
            await connection.query(
                `DELETE FROM student_book_cart
                 WHERE student_id = ? AND book_id = ?`,
                [studentId, bookId]
            );

            // Restore one available copy.
            await connection.query(
                `UPDATE books
                 SET available_copies = available_copies + 1
                 WHERE book_id = ?`,
                [bookId]
            );
        });

        return res.json({
            success: true,
            message: "Book removed successfully!"
        });

    } catch (error) {
        console.error("Remove from cart error:", error.message);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Unable to remove book."
        });
    }
});



// ==================================================
// STUDENT PLACE ORDER API
// ==================================================

function getCollectionWindow() {
    const now = new Date();

    // Get current date and time in Indian Standard Time.
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(now);

    const values = {};
    parts.forEach(part => {
        values[part.type] = part.value;
    });

    const date = new Date(
        Date.UTC(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day)
        )
    );

    const weekday = date.getUTCDay();
    const minutes = Number(values.hour) * 60 + Number(values.minute);

    const closingTime = weekday === 6 ? 13 * 60 : 15 * 60 + 30;

    // Sunday is closed. After closing time, start next working day.
    if (
        weekday === 0 ||
        minutes < 9 * 60 ||
        minutes >= closingTime
    ) {
        if (weekday === 0 || minutes >= closingTime) {
            date.setUTCDate(date.getUTCDate() + 1);
        }

        while (date.getUTCDay() === 0) {
            date.setUTCDate(date.getUTCDate() + 1);
        }
    }

    const startDate = new Date(date);

    // Find the next working day.
    date.setUTCDate(date.getUTCDate() + 1);

    while (date.getUTCDay() === 0) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    const endDate = date;

    const formatDate = d =>
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}


// ==================================================
// GET STUDENT ORDERS API
// ==================================================

app.get("/api/students/orders", authenticateStudent, async (req, res) => {
    const studentId = req.student.student_id;

    try {
        const [orders] = await db.promise().query(
            `SELECT
                o.order_id,
                o.order_date,
                o.order_status,
                i.order_item_id,
                i.book_id,
                i.book_name,
                i.author,
                i.image_url,
                b.isbn,
                i.fine_amount,
                i.payment_status,
                i.paid_at,
                i.fine_hidden_from_student,
                i.collection_start_date,
                i.collection_end_date,
                i.collection_status,
                i.collected_at,
                i.return_start_date,
                i.return_due_date,
                i.return_status,
                i.returned_at,
                i.extension_count
            FROM student_orders o
            INNER JOIN student_order_items i
                ON o.order_id = i.order_id
            LEFT JOIN books b
                ON i.book_id = b.book_id
            WHERE o.student_id = ?
               AND i.collection_status != 'Expired'
                AND (
                    i.hidden_from_student = 0
                    OR (
                        i.fine_hidden_from_student = 0
                        AND (i.fine_amount > 0 OR i.payment_status = 'Paid')
                    )
                )
            ORDER BY o.order_date DESC, i.order_item_id DESC`,
            [studentId]
        );

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("Fetch student orders error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch your orders."
        });
    }
});

// ==================================================
// CLEAR RETURNED BOOKS API
// ==================================================

app.put("/api/students/orders/clear-returned", authenticateStudent, async (req, res) => {
    const studentId = req.student.student_id;

    try {
        const [result] = await db.promise().query(
            `UPDATE student_order_items i
             INNER JOIN student_orders o
                ON i.order_id = o.order_id
             SET i.hidden_from_student = 1
             WHERE o.student_id = ?
               AND i.return_status = 'Returned'
               AND i.hidden_from_student = 0`,
            [studentId]
        );

        res.json({
            success: true,
            message: `${result.affectedRows} returned book(s) cleared successfully.`,
            clearedCount: result.affectedRows
        });

    } catch (error) {
        console.error("Clear returned books error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to clear returned books."
        });
    }
});


// ==================================================
// STUDENT: PAY FINE (DEMO PAYMENT)
// ==================================================

app.put(
    "/api/students/fines/:orderItemId/pay",
    authenticateStudent,
    async (req, res) => {
        const orderItemId = Number(req.params.orderItemId);
        const studentId = req.student.student_id;

        if (!Number.isInteger(orderItemId) || orderItemId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid fine record."
            });
        }

        try {
            const result = await runCartTransaction(async (connection) => {

                const [items] = await connection.query(
                    `SELECT
                        i.order_item_id,
                        i.fine_amount,
                        i.payment_status,
                        i.return_status,
                        i.fine_generated_at
                     FROM student_order_items i
                     INNER JOIN student_orders o
                        ON i.order_id = o.order_id
                     WHERE i.order_item_id = ?
                       AND o.student_id = ?
                       AND i.fine_hidden_from_student = 0
                     FOR UPDATE`,
                    [orderItemId, studentId]
                );

                if (items.length === 0) {
                    const error = new Error("Fine record not found.");
                    error.status = 404;
                    throw error;
                }

                const item = items[0];

                if (!item.fine_generated_at) {
                    const error = new Error("Fine is not yet finalized.");
                    error.status = 400;
                    throw error;
                }

                if (item.payment_status === "Paid") {
                    const error = new Error("This fine has already been paid.");
                    error.status = 400;
                    throw error;
                }

                if (Number(item.fine_amount) <= 0) {
                    const error = new Error("There is no pending fine to pay.");
                    error.status = 400;
                    throw error;
                }

                await connection.query(
                    `UPDATE student_order_items
                     SET
                        payment_status = 'Paid',
                        paid_at = UTC_TIMESTAMP()
                     WHERE order_item_id = ?`,
                    [orderItemId]
                );

                return {
                    order_item_id: orderItemId,
                    paid_amount: Number(item.fine_amount)
                };
            });

            return res.json({
                success: true,
                message: "Fine payment successful!",
                payment: result
            });

        } catch (error) {
            console.error("Fine payment error:", error);

            return res.status(error.status || 500).json({
                success: false,
                message: error.message || "Unable to process fine payment."
            });
        }
    }
);

// ==================================================
// STUDENT: CLEAR PAID FINE
// ==================================================

app.put(
    "/api/students/fines/:orderItemId/clear",
    authenticateStudent,
    async (req, res) => {
        const orderItemId = Number(req.params.orderItemId);
        const studentId = req.student.student_id;

        if (!Number.isInteger(orderItemId) || orderItemId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid fine record."
            });
        }

        try {
            const [result] = await db.promise().query(
                `UPDATE student_order_items i
                 INNER JOIN student_orders o
                    ON i.order_id = o.order_id
                 SET i.fine_hidden_from_student = 1
                 WHERE i.order_item_id = ?
                   AND o.student_id = ?
                   AND i.payment_status = 'Paid'
                   AND i.fine_hidden_from_student = 0`,
                [orderItemId, studentId]
            );

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Only paid fines can be cleared."
                });
            }

            return res.json({
                success: true,
                message: "Paid fine cleared successfully!"
            });

        } catch (error) {
            console.error("Clear fine error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to clear paid fine."
            });
        }
    }
);


// ==================================================
// STUDENT: EXTEND RETURN DATE
// ==================================================

app.put(
    "/api/students/orders/:orderItemId/extend",
    authenticateStudent,
    async (req, res) => {
        const orderItemId = Number(req.params.orderItemId);
        const studentId = req.student.student_id;

        if (!Number.isInteger(orderItemId) || orderItemId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid order item ID."
            });
        }

        try {
            const result = await runCartTransaction(async (connection) => {

                // Lock the book order and verify student ownership.
                const [items] = await connection.query(
                    `SELECT
                        i.order_item_id,
                        i.collection_status,
                        i.return_status,
                        i.extension_count,
                        DATE_FORMAT(i.return_due_date, '%Y-%m-%d') AS return_due_date
                     FROM student_order_items i
                     INNER JOIN student_orders o
                        ON i.order_id = o.order_id
                     WHERE i.order_item_id = ?
                       AND o.student_id = ?
                     FOR UPDATE`,
                    [orderItemId, studentId]
                );

                if (items.length === 0) {
                    const error = new Error("Book order not found.");
                    error.status = 404;
                    throw error;
                }

                const item = items[0];

                if (item.collection_status !== "Collected") {
                    const error = new Error(
                        "You can extend the return date only after collecting the book."
                    );
                    error.status = 400;
                    throw error;
                }

                if (item.return_status !== "Pending") {
                    const error = new Error(
                        "This book has already been returned."
                    );
                    error.status = 400;
                    throw error;
                }

                if (Number(item.extension_count) >= 1) {
                    const error = new Error(
                        "You have already extended the return date for this book."
                    );
                    error.status = 400;
                    throw error;
                }

                if (!item.return_due_date) {
                    const error = new Error("Return due date is missing.");
                    error.status = 400;
                    throw error;
                }

                // Get current date and time in Indian Standard Time.
                const parts = new Intl.DateTimeFormat("en-GB", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hourCycle: "h23"
                }).formatToParts(new Date());

                const values = {};

                parts.forEach(part => {
                    values[part.type] = part.value;
                });

                const todayIST =
                    `${values.year}-${values.month}-${values.day}`;

                const currentMinutes =
                    Number(values.hour) * 60 + Number(values.minute);

                // Extension is available only on the due date
                // between 12:00 AM and 1:00 PM IST.
                // if (todayIST !== item.return_due_date) {
                //     const error = new Error(
                //         "Extension is available only on your return due date."
                //     );
                //     error.status = 400;
                //     throw error;
                // }

                // if (currentMinutes > 13 * 60) {
                if (currentMinutes > 26 * 60) {
                    const error = new Error(
                        // "The extension window has closed. You can extend only until 1:00 PM IST."
                        "The extension window has closed. You can extend only until 11:00 PM IST."
                    );
                    error.status = 400;
                    throw error;
                }

                // Add 15 calendar days.
                const newDueDate = new Date(
                    `${item.return_due_date}T00:00:00Z`
                );

                newDueDate.setUTCDate(newDueDate.getUTCDate() + 15);

                // If the new due date is Sunday, move it to Monday.
                if (newDueDate.getUTCDay() === 0) {
                    newDueDate.setUTCDate(newDueDate.getUTCDate() + 1);
                }

                const extendedDate =
                    `${newDueDate.getUTCFullYear()}-` +
                    `${String(newDueDate.getUTCMonth() + 1).padStart(2, "0")}-` +
                    `${String(newDueDate.getUTCDate()).padStart(2, "0")}`;

                // Save the extension.
                const [updateResult] = await connection.query(
                    `UPDATE student_order_items
                     SET
                        return_due_date = ?,
                        extension_count = extension_count + 1
                     WHERE order_item_id = ?
                       AND extension_count = 0
                       AND return_status = 'Pending'`,
                    [extendedDate, orderItemId]
                );

                if (updateResult.affectedRows !== 1) {
                    const error = new Error(
                        "Unable to extend the return date. Please refresh and try again."
                    );
                    error.status = 400;
                    throw error;
                }

                return {
                    previous_due_date: item.return_due_date,
                    new_due_date: extendedDate,
                    extension_count: 1
                };
            });

            return res.json({
                success: true,
                message: "Return date extended successfully by 15 days!",
                extension: result
            });

        } catch (error) {
            console.error("Extend return date error:", error);

            return res.status(error.status || 500).json({
                success: false,
                message: error.status
                    ? error.message
                    : "Unable to extend the return date."
            });
        }
    }
);

// ADMIN: FETCH COLLECTION REQUESTS
app.get("/api/admin/collection-requests", authenticateAdmin, async (req, res) => {
    try {
        const [requests] = await db.promise().query(
            `SELECT
                i.order_item_id,
                o.order_id,
                o.order_date,
                s.name AS student_name,
                s.usn,
                i.book_name,
                i.author,
                i.image_url,
                i.collection_start_date,
                i.collection_end_date,
                i.collection_status
             FROM student_order_items i
             INNER JOIN student_orders o ON i.order_id = o.order_id
             INNER JOIN students s ON o.student_id = s.student_id
             WHERE i.collection_status = 'Pending'
             ORDER BY o.order_date ASC`
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error("Admin collection requests error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch collection requests."
        });
    }
});

// ADMIN: FETCH RETURN REQUESTS
app.get("/api/admin/return-requests", authenticateAdmin, async (req, res) => {
    try {
        const [requests] = await db.promise().query(
            `SELECT
                i.order_item_id,
                o.order_id,
                o.order_date,
                s.name AS student_name,
                s.usn,
                i.book_name,
                i.author,
                i.image_url,
                i.collected_at,
                i.return_start_date,
                i.return_due_date,
                i.return_status
             FROM student_order_items i
             INNER JOIN student_orders o ON i.order_id = o.order_id
             INNER JOIN students s ON o.student_id = s.student_id
             WHERE i.collection_status = 'Collected'
               AND i.return_status = 'Pending'
             ORDER BY i.return_due_date ASC`
        );

        res.json({
            success: true,
            requests
        });

    } catch (error) {
        console.error("Admin return requests error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch return requests."
        });
    }
});

// ADMIN CONFIRM BOOK RETURN
app.put(
    "/api/admin/orders/:orderItemId/return",
    authenticateAdmin,
    async (req, res) => {
        const { orderItemId } = req.params;

        try {
            const result = await runCartTransaction(async (connection) => {

                // Lock the order item to prevent duplicate confirmation
                const [items] = await connection.query(
                    `SELECT
                        order_item_id,
                        book_id,
                        collection_status,
                        return_status,
                        DATE_FORMAT(return_due_date, '%Y-%m-%d') AS return_due_date
                     FROM student_order_items
                     WHERE order_item_id = ?
                     FOR UPDATE`,
                    [orderItemId]
                );

                if (items.length === 0) {
                    throw new Error("Return request not found.");
                }

                const item = items[0];

                if (item.collection_status !== "Collected") {
                    throw new Error("This book has not been collected.");
                }

                if (item.return_status !== "Pending") {
                    throw new Error("This book has already been returned.");
                }

                if (!item.return_due_date) {
                    throw new Error("Return due date is missing.");
                }

                // Get today's date in Indian Standard Time
                const todayIST = new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }).format(new Date());

                // Calculate late days using date-only values
                const dueDate = new Date(`${item.return_due_date}T00:00:00Z`);
                const todayDate = new Date(`${todayIST}T00:00:00Z`);

                const lateDays = Math.max(
                    0,
                    Math.floor(
                        (todayDate.getTime() - dueDate.getTime()) / 86400000
                    )
                );

                const fineAmount = lateDays * 50;

                // Mark the book as returned
                const [updateResult] = await connection.query(
                    `UPDATE student_order_items
                        SET
                            return_status = 'Returned',
                            returned_at = UTC_TIMESTAMP(),
                            fine_amount = ?,
                            fine_generated_at = CASE
                                WHEN ? > 0 THEN UTC_TIMESTAMP()
                                ELSE NULL
                            END
                        WHERE order_item_id = ?
                        AND collection_status = 'Collected'
                        AND return_status = 'Pending'`,
                        [fineAmount, fineAmount, orderItemId]
                );

                if (updateResult.affectedRows !== 1) {
                    throw new Error("Unable to confirm this return.");
                }

                // Restore inventory exactly once
                if (item.book_id !== null) {
                    await connection.query(
                        `UPDATE books
                         SET available_copies = available_copies + 1
                         WHERE book_id = ?`,
                        [item.book_id]
                    );
                }

                return {
                    late_days: lateDays,
                    fine_amount: fineAmount
                };
            });

            res.json({
                success: true,
                message: "Book return confirmed successfully.",
                late_days: result.late_days,
                fine_amount: result.fine_amount
            });

        } catch (error) {
            console.error("Confirm return error:", error);

            const clientErrors = [
                "Return request not found.",
                "This book has not been collected.",
                "This book has already been returned.",
                "Return due date is missing.",
                "Unable to confirm this return."
            ];

            const statusCode = clientErrors.includes(error.message) ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                message: statusCode === 400
                    ? error.message
                    : "Unable to confirm book return."
            });
        }
    }
);


// ADMIN: CONFIRM BOOK COLLECTION
app.put("/api/admin/orders/:orderItemId/collect", authenticateAdmin, async (req, res) => {
    const { orderItemId } = req.params;

    try {
        const [result] = await db.promise().query(
            `UPDATE student_order_items
             SET
                collection_status = 'Collected',
                collected_at = NOW(),
                return_start_date = CURDATE(),
                return_due_date = CASE
                    WHEN DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL 15 DAY)) = 1
                    THEN DATE_ADD(CURDATE(), INTERVAL 16 DAY)
                    ELSE DATE_ADD(CURDATE(), INTERVAL 15 DAY)
                END,
                return_status = 'Pending'
             WHERE order_item_id = ?
               AND collection_status = 'Pending'`,
            [orderItemId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "This collection request is no longer pending."
            });
        }

        res.json({
            success: true,
            message: "Book collection confirmed successfully."
        });

    } catch (error) {
        console.error("Confirm collection error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to confirm book collection."
        });
    }
});

// --------------------------------------------------
// PLACE ORDER FROM STUDENT CART
// --------------------------------------------------

app.post("/api/students/orders", authenticateStudent, async (req, res) => {
    const studentId = req.student.student_id;

    try {
        const collection = getCollectionWindow();

        const order = await runCartTransaction(async connection => {

            // Lock student row.
            const [students] = await connection.query(
                `SELECT student_id
                 FROM students
                 WHERE student_id = ?
                 FOR UPDATE`,
                [studentId]
            );

            if (students.length === 0) {
                const error = new Error("Student not found.");
                error.status = 404;
                throw error;
            }

            // Lock and fetch cart books.
            const [cartBooks] = await connection.query(
                `SELECT
                    c.book_id,
                    b.book_name,
                    b.author,
                    b.image_url
                 FROM student_book_cart c
                 JOIN books b ON b.book_id = c.book_id
                 WHERE c.student_id = ?
                 FOR UPDATE`,
                [studentId]
            );

            if (cartBooks.length === 0) {
                const error = new Error("Your cart is empty.");
                error.status = 400;
                throw error;
            }

            // Create order.
            const [orderResult] = await connection.query(
                `INSERT INTO student_orders
                    (student_id, order_date, order_status)
                 VALUES (?, UTC_TIMESTAMP(), 'Pending')`,
                [studentId]
            );

            const orderId = orderResult.insertId;

            // Save each book separately.
            for (const book of cartBooks) {
                await connection.query(
                    `INSERT INTO student_order_items (
                        order_id,
                        book_id,
                        book_name,
                        author,
                        image_url,
                        collection_start_date,
                        collection_end_date
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        book.book_id,
                        book.book_name,
                        book.author,
                        book.image_url,
                        collection.start,
                        collection.end
                    ]
                );
            }

            // Remove cart entries.
            // Do not increase available_copies:
            // these copies are already reserved.
            await connection.query(
                `DELETE FROM student_book_cart
                 WHERE student_id = ?`,
                [studentId]
            );

            return {
                order_id: orderId,
                total_books: cartBooks.length,
                collection_start_date: collection.start,
                collection_end_date: collection.end
            };
        });

        return res.status(201).json({
            success: true,
            message: "Placed Order Successfully",
            order
        });

    } catch (error) {
        console.error("Place order error:", error);

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Unable to place order."
        });
    }
});





// --------------------------------------------------
// STUDENT PROFILE PHOTO
// --------------------------------------------------

app.post(
    "/api/students/profile-photo",
    authenticateStudent,
    upload.single("profile_photo"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a profile photo."
            });
        }

        const studentId = req.student.student_id;
        const newPhoto = req.file.filename;

        db.query(
            "SELECT profile_photo FROM students WHERE student_id = ? LIMIT 1",
            [studentId],
            (err, results) => {
                if (err || results.length === 0) {
                    fs.unlink(req.file.path, () => {});
                    console.error("Student photo lookup failed:", err?.message);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to update profile photo."
                    });
                }

                const oldPhoto = results[0].profile_photo;

                db.query(
                    "UPDATE students SET profile_photo = ? WHERE student_id = ?",
                    [newPhoto, studentId],
                    (updateError) => {
                        if (updateError) {
                            fs.unlink(req.file.path, () => {});

                            return res.status(500).json({
                                success: false,
                                message: "Unable to save profile photo."
                            });
                        }

                        if (oldPhoto) {
                            const oldPath = path.join(
                                uploadDirectory,
                                path.basename(oldPhoto)
                            );

                            fs.unlink(oldPath, () => {});
                        }

                        res.json({
                            success: true,
                            message: "Profile photo updated successfully!",
                            profile_photo: `/uploads/${newPhoto}`
                        });
                    }
                );
            }
        );
    }
);

app.post("/api/auth/logout", authenticateStudent, (req, res) => {
    res.json({
        success: true,
        message: "Logout successful. Please clear the token on the frontend."
    });
});

// ==================================================
// TEACHER AUTHENTICATION
// ==================================================

app.post("/api/teachers/auth/send-otp", (req, res) => {
    const { usn, email } = req.body;

    if (
        typeof usn !== "string" ||
        typeof email !== "string" ||
        !usn.trim() ||
        !email.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid USN and email are required."
        });
    }

    const sql = `
        SELECT teacher_id, name, email, usn
        FROM teachers
        WHERE usn = ? AND LOWER(email) = LOWER(?)
        LIMIT 1
    `;

    db.query(sql, [usn.trim().toUpperCase(), email.trim()], async (err, results) => {
        if (err) {
            console.error("Teacher verification failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to verify teacher."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher does not exist. Please contact your college administration."
            });
        }

        const teacher = results[0];
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        try {
            await sendOtpEmail(teacher.email, teacher.name, otp);

            otpStore.set(
                `teacher:${teacher.usn.trim().toUpperCase()}`,
                {
                    otp,
                    expiresAt,
                    attempts: 0,
                    teacher_id: teacher.teacher_id
                }
            );

            res.json({
                success: true,
                message: "OTP sent successfully to your registered email."
            });
        } catch (emailError) {
            console.error("Teacher OTP email failed:", emailError.message);

            res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }
    });
});

app.post("/api/teachers/auth/verify-otp", (req, res) => {
    const { usn, otp } = req.body;

    if (
        typeof usn !== "string" ||
        typeof otp !== "string" ||
        !usn.trim() ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid USN and six-digit OTP are required."
        });
    }

    const key = `teacher:${usn.trim().toUpperCase()}`;
    const storedData = otpStore.get(key);

    if (!storedData) {
        return res.status(400).json({
            success: false,
            message: "OTP not found. Please request a new OTP."
        });
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(key);

        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new OTP."
        });
    }

    if (storedData.attempts >= 5) {
        otpStore.delete(key);

        return res.status(429).json({
            success: false,
            message: "Maximum OTP attempts reached. Please request a new OTP."
        });
    }

    if (storedData.otp !== otp) {
        storedData.attempts++;

        if (storedData.attempts >= 5) {
            otpStore.delete(key);

            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts reached. Please request a new OTP."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Incorrect OTP. Please try again."
        });
    }

    otpStore.delete(key);

    const sql = `
        SELECT teacher_id, name, email, usn, department, profile_photo
        FROM teachers
        WHERE teacher_id = ?
        LIMIT 1
    `;

    db.query(sql, [storedData.teacher_id], (err, results) => {
        if (err) {
            console.error("Teacher details fetch failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch teacher details."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found."
            });
        }

        const teacher = results[0];

        const token = jwt.sign(
            {
                teacher_id: teacher.teacher_id,
                usn: teacher.usn,
                role: "teacher"
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({
            success: true,
            message: "Teacher OTP verified successfully!",
            token,
            teacher: {
                teacher_id: teacher.teacher_id,
                name: teacher.name,
                email: teacher.email,
                usn: teacher.usn,
                department: teacher.department,
                profile_photo: teacher.profile_photo
                    ? `/uploads/${teacher.profile_photo}`
                    : null
            }
        });
    });
});

// --------------------------------------------------
// GET TEACHER DETAILS
// --------------------------------------------------

app.get("/api/teachers/me", authenticateTeacher, (req, res) => {
    const sql = `
        SELECT teacher_id, name, email, usn, department, profile_photo
        FROM teachers
        WHERE teacher_id = ?
        LIMIT 1
    `;

    db.query(sql, [req.teacher.teacher_id], (err, results) => {
        if (err) {
            console.error("Teacher profile fetch failed:", err.message);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch teacher profile."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found."
            });
        }

        const teacher = results[0];

        res.json({
            success: true,
            teacher: {
                teacher_id: teacher.teacher_id,
                name: teacher.name,
                email: teacher.email,
                usn: teacher.usn,
                department: teacher.department,
                profile_photo: teacher.profile_photo
                    ? `/uploads/${teacher.profile_photo}`
                    : null
            }
        });
    });
});

// --------------------------------------------------
// TEACHER PROFILE PHOTO 
// --------------------------------------------------

app.post(
    "/api/teachers/profile-photo",
    authenticateTeacher,
    upload.single("profile_photo"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a profile photo."
            });
        }

        const teacherId = req.teacher.teacher_id;
        const newPhoto = req.file.filename;

        db.query(
            "SELECT profile_photo FROM teachers WHERE teacher_id = ? LIMIT 1",
            [teacherId],
            (err, results) => {
                if (err || results.length === 0) {
                    fs.unlink(req.file.path, () => {});
                    console.error("Teacher photo lookup failed:", err?.message);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to update profile photo."
                    });
                }

                const oldPhoto = results[0].profile_photo;

                db.query(
                    "UPDATE teachers SET profile_photo = ? WHERE teacher_id = ?",
                    [newPhoto, teacherId],
                    (updateError) => {
                        if (updateError) {
                            fs.unlink(req.file.path, () => {});

                            return res.status(500).json({
                                success: false,
                                message: "Unable to save profile photo."
                            });
                        }

                        if (oldPhoto) {
                            const oldPath = path.join(
                                uploadDirectory,
                                path.basename(oldPhoto)
                            );

                            fs.unlink(oldPath, () => {});
                        }

                        res.json({
                            success: true,
                            message: "Teacher profile photo updated successfully!",
                            profile_photo: `/uploads/${newPhoto}`
                        });
                    }
                );
            }
        );
    }
);

app.post("/api/teachers/auth/logout", authenticateTeacher, (req, res) => {
    res.json({
        success: true,
        message: "Teacher logout successful. Please clear the token on the frontend."
    });
});

// --------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "Profile photo must be smaller than 5 MB."
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "File upload failed."
        });
    }

    next();
});

// ==================================================
// LIBRARY UPDATES APIs
// ==================================================

// ADMIN: GET ALL LIBRARY UPDATES
app.get("/api/admin/updates", authenticateAdmin, async (req, res) => {
    try {
        const [updates] = await db.promise().query(
            `SELECT update_id, message, created_at
             FROM library_updates
             ORDER BY created_at DESC, update_id DESC`
        );

        res.json({
            success: true,
            updates
        });

    } catch (error) {
        console.error("Fetch library updates error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch library updates."
        });
    }
});


// ADMIN: PUBLISH MULTIPLE LIBRARY UPDATES
app.post("/api/admin/updates", authenticateAdmin, async (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
        return res.status(400).json({
            success: false,
            message: "Updates must be provided as an array."
        });
    }

    const messages = updates
        .filter(message => typeof message === "string")
        .map(message => message.trim())
        .filter(message => message.length > 0);

    if (messages.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter at least one update."
        });
    }

    try {
        const values = messages.map(message => [message]);

        await db.promise().query(
            "INSERT INTO library_updates (message) VALUES ?",
            [values]
        );

        res.status(201).json({
            success: true,
            message: "Library updates published successfully!",
            total: messages.length
        });

    } catch (error) {
        console.error("Publish library updates error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to publish library updates."
        });
    }
});


// ADMIN: DELETE LIBRARY UPDATE
app.delete("/api/admin/updates/:id", authenticateAdmin, async (req, res) => {
    const updateId = Number(req.params.id);

    if (!Number.isInteger(updateId) || updateId < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid update ID."
        });
    }

    try {
        const [result] = await db.promise().query(
            "DELETE FROM library_updates WHERE update_id = ?",
            [updateId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Library update not found."
            });
        }

        res.json({
            success: true,
            message: "Library update deleted successfully!"
        });

    } catch (error) {
        console.error("Delete library update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete library update."
        });
    }
});


// PUBLIC: GET LIBRARY UPDATES FOR HOME PAGE
app.get("/api/library/updates", async (req, res) => {
    try {
        const [updates] = await db.promise().query(
            `SELECT update_id, message, created_at
             FROM library_updates
             ORDER BY created_at DESC, update_id DESC`
        );

        res.json({
            success: true,
            updates
        });

    } catch (error) {
        console.error("Public library updates error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch library updates."
        });
    }
});

// ==================================================
// ADMIN FINE MANAGEMENT APIs
// ==================================================

// GET ALL FINE RECORDS
app.get("/api/admin/fines", authenticateAdmin, async (req, res) => {
    try {
        const [fines] = await db.promise().query(`
            SELECT
                soi.order_item_id,
                s.student_id,
                s.name AS student_name,
                s.usn,
                soi.book_name,
                soi.fine_amount,
                soi.payment_status,
                soi.fine_generated_at,
                soi.paid_at,
                soi.fine_hidden_from_student
            FROM student_order_items soi
            INNER JOIN student_orders so
                ON soi.order_id = so.order_id
            INNER JOIN students s
                ON so.student_id = s.student_id
            WHERE soi.fine_amount > 0
            ORDER BY soi.created_at DESC
        `);

        res.json(fines);

    } catch (error) {
        console.error("Fetch Admin Fines Error:", error);
        res.status(500).json({ message: "Failed to fetch fines." });
    }
});


// ADMIN MARK FINE AS PAID
app.put("/api/admin/fines/:orderItemId/pay", authenticateAdmin, async (req, res) => {
    const { orderItemId } = req.params;

    try {
        const [result] = await db.promise().query(
            `UPDATE student_order_items
             SET payment_status = 'Paid',
                 paid_at = NOW()
             WHERE order_item_id = ?
             AND fine_amount > 0
             AND payment_status = 'Pending'`,
            [orderItemId]
        );

        if (result.affectedRows === 0) {
            const [rows] = await db.promise().query(
                `SELECT payment_status, fine_amount
                 FROM student_order_items
                 WHERE order_item_id = ?`,
                [orderItemId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Fine record not found."
                });
            }

            if (Number(rows[0].fine_amount) <= 0) {
                return res.status(400).json({
                    message: "No fine amount exists."
                });
            }

            if (rows[0].payment_status === "Paid") {
                return res.json({
                    message: "Fine is already paid."
                });
            }

            return res.status(400).json({
                message: "Unable to update fine."
            });
        }

        res.json({
            message: "Fine marked as paid successfully."
        });

    } catch (error) {
        console.error("Admin Mark Fine Paid Error:", error);
        res.status(500).json({ message: "Failed to mark fine as paid." });
    }
});


// ADMIN CLEAR PAID FINE FROM STUDENT DASHBOARD
app.put("/api/admin/fines/:orderItemId/clear", authenticateAdmin, async (req, res) => {
    const { orderItemId } = req.params;

    try {
        const [result] = await db.promise().query(
            `UPDATE student_order_items
             SET fine_hidden_from_student = 1
             WHERE order_item_id = ?
             AND fine_amount > 0
             AND payment_status = 'Paid'`,
            [orderItemId]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Fine not found or not yet paid."
            });
        }

        res.json({
            message: "Paid fine cleared from student dashboard."
        });

    } catch (error) {
        console.error("Admin Clear Fine Error:", error);
        res.status(500).json({ message: "Failed to clear fine." });
    }
});


// GET FINE SUMMARY
app.get("/api/admin/fines/summary", authenticateAdmin, async (req, res) => {
    try {
        const [fineRows] = await db.promise().query(`
            SELECT
                COALESCE(
                    SUM(CASE
                        WHEN payment_status = 'Pending'
                        THEN fine_amount ELSE 0
                    END), 0
                ) AS unpaid_amount,

                COALESCE(
                    SUM(CASE
                        WHEN payment_status = 'Paid'
                        THEN fine_amount ELSE 0
                    END), 0
                ) AS collected_amount

            FROM student_order_items
            WHERE fine_amount > 0
        `);

        const [withdrawalRows] = await db.promise().query(`
            SELECT COALESCE(SUM(amount), 0) AS withdrawn_amount
            FROM fine_withdrawals
        `);

        const unpaid = Number(fineRows[0].unpaid_amount);
        const collected = Number(fineRows[0].collected_amount);
        const withdrawn = Number(withdrawalRows[0].withdrawn_amount);

        res.json({
            unpaid_amount: unpaid,
            collected_amount: collected,
            withdrawn_amount: withdrawn,
            available_balance: collected - withdrawn
        });

    } catch (error) {
        console.error("Fine Summary Error:", error);
        res.status(500).json({ message: "Failed to fetch fine summary." });
    }
});




// ADMIN WITHDRAW FINE COLLECTION
app.post("/api/admin/fines/withdraw", authenticateAdmin, async (req, res) => {
    const { amount, remarks } = req.body;
    const withdrawalAmount = Number(amount);

    if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({
            message: "Enter a valid withdrawal amount."
        });
    }

    try {
        const [fineRows] = await db.promise().query(`
            SELECT COALESCE(SUM(fine_amount), 0) AS collected_amount
            FROM student_order_items
            WHERE fine_amount > 0
            AND payment_status = 'Paid'
        `);

        const [withdrawalRows] = await db.promise().query(`
            SELECT COALESCE(SUM(amount), 0) AS withdrawn_amount
            FROM fine_withdrawals
        `);

        const collected = Number(fineRows[0].collected_amount);
        const withdrawn = Number(withdrawalRows[0].withdrawn_amount);
        const availableBalance = collected - withdrawn;

        if (withdrawalAmount > availableBalance) {
            return res.status(400).json({
                message: `Insufficient balance. Available balance: ₹${availableBalance.toFixed(2)}`
            });
        }

        await db.promise().query(
            `INSERT INTO fine_withdrawals (amount, remarks)
             VALUES (?, ?)`,
            [withdrawalAmount, remarks || null]
        );

        res.json({
            message: "Withdrawal recorded successfully.",
            withdrawn_amount: withdrawalAmount,
            available_balance: availableBalance - withdrawalAmount
        });

    } catch (error) {
        console.error("Fine Withdrawal Error:", error);
        res.status(500).json({ message: "Failed to record withdrawal." });
    }
});

// ==================================================
// CHATBOT - VERIFY STUDENT USN
// ==================================================

app.post("/api/chat/verify-usn", async (req, res) => {
    const { usn } = req.body;

    if (typeof usn !== "string" || !usn.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid USN."
        });
    }

    try {
        const [students] = await db.promise().query(
            "SELECT student_id, name FROM students WHERE UPPER(usn) = ? LIMIT 1",
            [usn.trim().toUpperCase()]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "This USN is not registered in the library."
            });
        }

        return res.status(200).json({
            success: true,
            studentId: students[0].student_id,
            studentName: students[0].name,
            message: "USN verified successfully!"
        });

    } catch (error) {
        console.error("Chatbot USN verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify USN. Please try again."
        });
    }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
