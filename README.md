# Auth System — Full Stack Implementation

## Overview
Built a complete authentication system with FastAPI backend and React frontend, implementing JWT-based access & refresh token flow with SQLite database.

---

## Backend (FastAPI + SQLite)

### Endpoints Implemented
- **POST `/auth/register`** — Accepts username & password, hashes password using bcrypt, saves user to SQLite database
- **POST `/auth/login`** — Validates credentials against database, returns access token (30 min expiry) + refresh token (7 day expiry)
- **POST `/auth/refresh`** — Accepts refresh token, validates it, issues a new access token without rotating the refresh token
- **GET `/me`** — Protected route, validates access token via Bearer header, returns current user info

### Tech Stack
- **FastAPI** — Python web framework for building REST API
- **SQLite** — Lightweight database for user storage
- **SQLAlchemy** — ORM for database interactions
- **python-jose** — JWT token creation and verification
- **passlib + bcrypt** — Password hashing and verification

---

## Frontend (React + Vite)

### Features Implemented
- **Login form** — Sends credentials to `/auth/login`, stores access & refresh tokens in `localStorage`
- **Register form** — Sends new user data to `/auth/register`
- **Protected dashboard** — Calls `/me` on load using stored access token, displays user info
- **Logout** — Clears both tokens from `localStorage`
- **Token storage** — Both `access_token` and `refresh_token` saved in `localStorage` on login

### Tech Stack
- **React 19** — Frontend UI library
- **Vite** — Build tool and dev server
- **Vanilla fetch()** — HTTP client for API calls

---

## What Was Done
1. Set up FastAPI project with CORS middleware
2. Created SQLAlchemy models and SQLite database
3. Implemented password hashing with bcrypt
4. Built JWT token generation (access + refresh)
5. Created all 4 API endpoints (register, login, refresh, me)
6. Built React frontend with login/register/dashboard views
7. Connected frontend to backend API
8. Pushed frontend code to GitHub repository

---

## GitHub
- **Repository:** https://github.com/Ashutosh-AIBOT/frontend-15
- **Branch:** `main`
- **Status:** Pushed successfully
