// Step 29: Connect Node.js to the MySQL database

// Load environment variables from .env
require("dotenv").config();

// Import MySQL package
const mysql = require("mysql2");

// Create database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306
});

// Test the database connection
db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL Connected Successfully!");
});

// Export the connection for other backend files
module.exports = db;