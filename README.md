# MERN Auth Backend

A complete authentication system built with Node.js, Express, and MongoDB. Covers the full lifecycle of user authentication — signup with email verification, login, JWT-based session handling, and a self-service password reset flow.

**Live API:** https://mern-auth-backend-henna.vercel.app/
**Frontend repo:** [mern-auth-frontend](#)

## What This Covers

Most authentication tutorials stop at "hash the password, sign a token." This project goes further and handles the parts that actually come up in production:

- Email verification via OTP before an account is created, using a temporary collection with automatic expiry (MongoDB TTL indexes) rather than saving unverified users directly.
- A resend-OTP flow that reuses the same pending record instead of forcing the user to fill the signup form again.
- Password reset as a three-step, verification-gated process: request OTP, verify OTP, then reset — with a `verified` flag preventing the final step from being reachable without completing the one before it.
- JWT-based route protection with a reusable middleware, plus a `/me` endpoint that returns the authenticated user's data with the password field explicitly excluded.
- Passwords hashed with bcrypt; nothing sensitive is ever stored or returned in plaintext.

## Tech Stack

- Node.js / Express
- MongoDB with Mongoose
- JSON Web Tokens (jsonwebtoken)
- bcrypt
- Nodemailer

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Starts signup, sends an OTP to the provided email |
| POST | `/api/auth/verify-otp` | Verifies the OTP and creates the user account |
| POST | `/api/auth/login` | Authenticates a user and returns a JWT |
| POST | `/api/auth/forgot-password` | Sends a password reset OTP |
| POST | `/api/auth/verify-reset-otp` | Verifies the reset OTP |
| POST | `/api/auth/reset-password` | Sets a new password after verification |
| GET | `/api/user/me` | Returns the authenticated user's profile (requires a valid token) |

## Running Locally

```bash
git clone <this-repo-url>
cd MERN-Auth-Backend
npm install
```

Create a `.env` file in the root directory. See `.env.example` for the required variables:

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORTAL_EMAIL=your_gmail_address
PORTAL_PASSWORD=your_gmail_app_password
```

Start the server:

```bash
npm start
```

## Notes on Security

- OTPs are never stored on the client — they exist only in the database and in the email sent to the user, so verification always happens against a server-side record.
- The temporary signup and password-reset collections use MongoDB's TTL indexes to expire automatically, so no manual cleanup job is needed.
- Login and OTP-verification error messages are intentionally generic to avoid revealing whether a given email is registered.

## Author

Ayaan Waheed — [GitHub](https://github.com/awanayaan97-maker)
