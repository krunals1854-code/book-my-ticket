# Book My Ticket - Backend Extension 🎫

This project is a follow-up hackathon assignment based on the Chai Aur SQL class. It extends an existing seat booking codebase by adding a secure authentication layer and protecting booking endpoints.

## 🚀 Features Added

* **Database Schema:** Created a PostgreSQL `users` table to store account credentials securely.
* **Authentication:** Implemented user registration and login endpoints.
* **Security:** Integrated `bcrypt` for password hashing and `jsonwebtoken` (JWT) for secure session management.
* **Protected Routes:** Added an `authenticateToken` middleware to ensure only logged-in users can book seats.
* **Data Integrity:** Implemented logic to prevent duplicate seat bookings using SQL transactions.

## 🛠️ Tech Stack

* **Node.js** & **Express.js** (Backend Server)
* **PostgreSQL** (Database)
* **bcrypt** (Password Hashing)
* **jsonwebtoken** (JWT Authentication)

## 📦 Setup Instructions

### 1. Database Setup
You will need PostgreSQL installed (e.g., via pgAdmin). Open a Query Tool and run these commands to set up the database tables:

\`\`\`sql
-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create the seats table
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

-- Populate the theater with 20 empty seats
INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 20);
\`\`\`

*Note: Ensure your database connection settings in `index.mjs` (port, password, etc.) match your local PostgreSQL setup.*

### 2. Install Dependencies
Open your terminal in the project directory and run:

\`\`\`bash
npm install
\`\`\`

### 3. Start the Server
Run the following command to start the Node.js server:

\`\`\`bash
node index.mjs
\`\`\`

The server will start on `http://localhost:8080`.

## 🧪 API Endpoints

### Public Endpoints
* \`GET /seats\` - View all available and booked seats.
* \`POST /register\` - Create a new user account (Requires JSON body with `username` and `password`).
* \`POST /login\` - Authenticate user and receive a JWT token (Requires JSON body with `username` and `password`).

### Protected Endpoints
* \`PUT /:id/:name\` - Book a seat. Requires a valid JWT token in the `Authorization` header (`Bearer <token>`). The name parameter in the URL is ignored, and the booking is associated with the authenticated user's username.
