# Dev-Sync: An AI-Enhanced Real Time Project Collaboration Platform

This repository contains the source code for an **AI-powered project collaboration chat application**. The app allows users to create projects, invite collaborators, communicate in private chat rooms, and interact with an AI assistant for code generation and server code execution directly in the browser.

**🌐 Live Site:** [https://dev-syncs.vercel.app/](https://dev-syncs.vercel.app/)

---

## Description

Dev-Sync is a *real-time* platform designed for teams to work together seamlessly. Users can:
- ✅ **Register and log in** securely
- ✅ **Create projects** and invite collaborators
- ✅ **Communicate privately** in project-specific chat rooms
- ✅ **Interact with AI** using @ai commands for assistance
- ✅ **Request AI-generated server code** and run it within the browser

This application enhances teamwork and efficiency by integrating *AI-powered assistance* into collaborative software development.

---

## Features

### 🏠 Authentication
- Secure registration and login
- JWT-based authentication

### 📂 Project Management
- Create new projects
- Invite collaborators

### 💬 Real-Time Chat & AI Interaction
- Private chat rooms for project members
- Interact with AI using @ai for:
  - General queries
  - Code assistance
  - Debugging suggestions
  - Code review

### 🖥 AI-Powered Server Code Execution
- Request AI-generated server code
- Embedded code editor to modify code
- Run generated server code directly in the browser

---

## Technologies Used

| Technology         | Purpose                              |
|-------------------|--------------------------------------|
| React.js          | Frontend UI & chat interface         |
| Node.js (Express) | Backend API                          |
| MongoDB           | Database for users/projects           |
| Socket.io         | Real-time chat functionality         |
| Redis             | Efficient session & message handling |
| Gemini AI         | AI for code generation and queries   |
| Web Container     | Running AI-powered server containers |

---

## Getting Started (Local Development)

### 1️⃣ Clone the repository
```sh
git clone [repository URL]
cd [project-name]
```

### 2️⃣ Install backend dependencies
```sh
cd backend
npm install
```

### 3️⃣ Install frontend dependencies
```sh
cd ../frontend
npm install
```

### 4️⃣ Start the backend server
```sh
cd ../backend
npx nodemon
```

### 5️⃣ Start the frontend application
```sh
cd ../frontend
npm run dev
```

---

## 🚀 Deployment Guide

### 🌐 Live Site
- **Frontend:** [https://dev-syncs.vercel.app/](https://dev-syncs.vercel.app/)
- **Backend:** (Add your backend Render.com URL here after deployment)

---

### 📝 Professional Deployment Steps

#### Backend Deployment (Render.com)
1. Push your code to GitHub.
2. Go to [Render.com](https://render.com/) and create a new Web Service.
3. Set the root directory to `backend`.
4. **Build Command:**
   ```sh
   npm install
   ```
5. **Start Command:**
   ```sh
   node server.js
   ```
6. **Environment Variables:**
   - `PORT` (e.g., 3000)
   - `MONGODB_URI` (from MongoDB Atlas)
   - `JWT_SECRET` (your secret)
   - `FRONTEND_URL` (`https://dev-syncs.vercel.app`)
7. Click **Create Web Service** to deploy.

#### Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and import your GitHub repo.
2. Set the project root to `frontend`.
3. **Build Command:**
   ```sh
   npm run build
   ```
4. **Output Directory:**
   ```sh
   dist
   ```
5. **Environment Variable:**
   - `VITE_API_URL` (your deployed backend URL)
6. Click **Deploy**.

#### Environment Variables Example
- Backend: see `backend/.env.example` for required variables.
- Frontend: create `frontend/.env`:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```

#### CORS & API URL
- Ensure your backend CORS `origin` matches your frontend URL (`https://dev-syncs.vercel.app`).
- All frontend API calls should use `VITE_API_URL` for the base URL.

#### Redeploy on Changes
- Push changes to GitHub to trigger automatic redeploys on both platforms.

---

### 💡 Pro Tips for Production
- **Never commit your real `.env` files to git.** Use `.env.example` for reference.
- **Monitor your services** (Render and Vercel both provide logs and status dashboards).
- **Set up custom domains** for a branded experience (both platforms support this easily).
- **Use HTTPS** (enabled by default on both platforms).
- **Scale up** your backend plan on Render if you expect high traffic.
- **Keep dependencies updated** and run security audits regularly.

---