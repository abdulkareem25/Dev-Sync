# Dev-Sync: AI-Enhanced Real-Time Project Collaboration Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project)

A modern, full-stack platform for seamless team collaboration, powered by AI. Create projects, chat in real time, invite collaborators, and leverage AI for code generation and server code execution—all in one place.

**🌐 Live Site:** [https://dev-syncs.vercel.app/](https://dev-syncs.vercel.app/)
**🌐 Backend:** (Add your backend Render.com URL after deployment)

---

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started (Local Development)](#-getting-started-local-development)
- [Deployment Guide](#-deployment-guide)
- [Environment Variables Example](#-environment-variables-example)
- [CORS & API URL](#-cors--api-url)
- [Pro Tips](#-pro-tips)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚩 Features
- **Authentication:** Secure JWT-based registration & login
- **Project Management:** Create projects, invite collaborators
- **Real-Time Chat:** Project-specific chat rooms with Socket.io
- **AI Assistant:** Use @ai for code help, debugging, and reviews
- **AI-Powered Server Code:** Generate, edit, and run server code in-browser

---

## 🛠️ Tech Stack
| Technology         | Purpose                              |
|-------------------|--------------------------------------|
| React.js          | Frontend UI & chat interface         |
| Vite              | Fast frontend build tool             |
| Node.js (Express) | Backend API                          |
| MongoDB           | Database for users/projects           |
| Socket.io         | Real-time chat functionality         |
| Redis             | Session & message handling           |
| Gemini AI         | AI for code generation and queries   |
| Web Container     | Run server code in-browser           |

---

## 🚀 Getting Started (Local Development)

### 1️⃣ Clone the Repository
```sh
git clone [your-repo-url]
cd [project-folder]
```

### 2️⃣ Install Dependencies
- **Backend:**
  ```sh
  cd backend
  npm install
  ```
- **Return to root:**
  ```sh
  cd ..
  ```
- **Frontend:**
  ```sh
  cd frontend
  npm install
  ```

### 3️⃣ Configure Environment Variables
- Copy `backend/.env.example` to `backend/.env` and fill in your values (MongoDB URI, JWT secret, etc.)
- Create `frontend/.env` and add:
  ```env
  VITE_API_URL=http://localhost:3000
  ```

### 4️⃣ Start the Application (in separate terminals)
- **Backend:**
  ```sh
  cd backend
  npx nodemon
  ```
- **Frontend:**
  ```sh
  cd frontend
  npm run dev
  ```

- The frontend will run on [http://localhost:5173](http://localhost:5173) (default Vite port)
- The backend will run on [http://localhost:3000](http://localhost:3000)

#### ⚠️ Troubleshooting
- If you get a port error, make sure nothing else is running on 3000 or 5173.
- If you see environment variable errors, double-check your `.env` files.

---

## 🌍 Deployment Guide

### 🚀 Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and sign in with your GitHub account.
2. Click **New Project** and import your repository.
3. Set the project root to `frontend`.
4. **Build Command:**
   ```sh
   npm run build
   ```
5. **Output Directory:**
   ```sh
   dist
   ```
6. Add environment variable:
   - `VITE_API_URL` (your deployed backend URL, e.g., `https://your-backend.onrender.com`)
7. Click **Deploy** and wait for your site to go live.
8. After deployment, your frontend will be live at a Vercel URL (e.g., `https://dev-syncs.vercel.app`).

### 🚀 Backend Deployment (Render.com)
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
   - `FRONTEND_URL` (your deployed frontend URL, e.g., `https://dev-syncs.vercel.app`)
7. Click **Create Web Service** and wait for your backend to deploy.
8. After deployment, update your frontend's `VITE_API_URL` to your backend's Render URL.

---

## 🌱 Environment Variables Example
- Backend: see `backend/.env.example`
- Frontend: create `frontend/.env`:
  ```env
  VITE_API_URL=https://your-backend.onrender.com
  ```

---

## 🔗 CORS & API URL
- Backend CORS `origin` must match your frontend URL (for security)
- Frontend API calls use `VITE_API_URL` as the base

---

## 💡 Pro Tips
- **Never commit real `.env` files**—use `.env.example` for reference
- **Monitor your services** (logs, status dashboards)
- **Set up custom domains** for branding
- **Use HTTPS** (default on Vercel/Render)
- **Scale up** backend plan if needed
- **Keep dependencies updated** and run security audits

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.