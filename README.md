# Apex AI - Full-Stack Modern AI Chatbot

A production-ready, full-stack AI Chatbot application with a glassmorphic responsive UI built using **React (Vite)**, **Python FastAPI**, **SQLAlchemy ORM (PostgreSQL/Supabase/SQLite)**, and **Google Gemini API**.

![Apex AI Chatbot App](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20PostgreSQL%20%7C%20Gemini-6366F1?style=for-the-badge)

---

## ✨ Features

- ⚡ **Real-Time AI Response Generation**: Powered by Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-pro`) with streaming response support.
- 🎨 **Modern Glassmorphic Dark UI**: Custom CSS design system featuring neon gradients, responsive sidebar, auto-resizing text input, and quick starter prompt cards.
- 📜 **Chat Threads & Persistent History**: Auto-titled conversations stored in PostgreSQL/SQLite database. Switch between chats, search history, or delete chats.
- 💻 **Markdown & Code Syntax Highlighting**: Clean rendering of code blocks with language tags and 1-click **Copy Code** functionality.
- 🛡️ **Secure Environment Configuration**: Server-side API key handling via `.env` with fallback mode.
- 🚀 **One-Click Deploy Configuration**: Ready for deployment on **Render / Koyeb** (Backend) and **Vercel / Netlify** (Frontend).

---

## 🏗️ Architecture

```
ai-chatbot-app/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application & CORS configuration
│   │   ├── config.py         # Pydantic settings loading from .env
│   │   ├── database.py       # SQLAlchemy database engine & sessions
│   │   ├── models.py         # Database ORM models (Chat, Message)
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── crud.py           # Database CRUD operations
│   │   ├── ai_service.py     # Gemini AI API integration
│   │   └── routers/
│   │       ├── chats.py      # REST API endpoints for chats & messages
│   │       └── health.py     # Health check endpoint
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml           # Render deployment template
├── frontend/
│   ├── src/
│   │   ├── components/       # Header, Sidebar, ChatMessage, ChatInput, EmptyState, ModelSelector
│   │   ├── services/api.js   # API client connecting React to FastAPI
│   │   ├── App.jsx           # Main React component
│   │   └── index.css         # Glassmorphism CSS design system
│   ├── .env.example
│   ├── vercel.json           # Vercel deployment rewrite rules
│   └── _redirects            # Netlify deployment rewrite rules
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

---

### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your **GEMINI_API_KEY**:
   ```env
   PORT=8000
   HOST=0.0.0.0
   CORS_ORIGINS=*
   DATABASE_URL=sqlite:///./chatbot.db
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be running at `http://localhost:8000`. Test interactive docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create frontend `.env` file:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your running backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📡 REST API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/health` | GET | Health & Database connection status |
| `GET /api/chats` | GET | Fetch list of all chat conversations |
| `POST /api/chats` | POST | Create a new chat thread |
| `GET /api/chats/{chat_id}` | GET | Get chat detail with complete message history |
| `DELETE /api/chats/{chat_id}` | DELETE | Delete a chat thread & associated messages |
| `POST /api/chats/{chat_id}/messages` | POST | Send user message & receive AI assistant response |

---

## 🌐 Production Deployment Guide

### Option 1: Free Database Setup (Supabase / Neon PostgreSQL)
1. Create a free account at [Supabase](https://supabase.com) or [Neon.tech](https://neon.tech).
2. Create a new PostgreSQL database instance.
3. Copy your Database Connection URI:
   `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

---

### Option 2: Deploy Backend to Render (Free Tier)
1. Fork or push this repository to GitHub.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service** and connect your repository (or use Blueprint with `backend/render.yaml`).
4. Set Root Directory to `backend`.
5. Set Environment Variables:
   - `GEMINI_API_KEY` = *your Google Gemini API Key*
   - `DATABASE_URL` = *your Supabase PostgreSQL URI*
   - `CORS_ORIGINS` = `https://your-frontend-app.vercel.app`
6. Click **Deploy**. Note your live backend URL (e.g. `https://ai-chatbot-backend.onrender.com`).

---

### Option 3: Deploy Frontend to Vercel (Free Tier)
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New Project** and import your GitHub repository.
3. Set Framework Preset to **Vite**.
4. Set Root Directory to `frontend`.
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://ai-chatbot-backend.onrender.com`
6. Click **Deploy**.

Your live deployed frontend will automatically communicate with your live backend and PostgreSQL database end-to-end!

---

## 📄 License
MIT License - feel free to use and customize for your own applications!
