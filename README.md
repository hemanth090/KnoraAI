# Knora AI 🧠

**Knora AI** is a production-ready **Document-Grounded RAG Assistant** that transforms static PDFs into interactive conversations. Built for performance and scalability, it leverages a modern hybrid stack to deliver accurate, citation-backed answers.

## 🚀 Key Features

-   **High-Fidelity RAG**: Uses **Supabase pgvector** for semantic search and **Groq (Llama 3)** for ultra-fast generation.
-   **Smart Citation System**: Every answer includes clickable citations (`[page:1]`) linking back to the exact source text.
-   **Full-Stack Optimization**:
    -   **Backend**: Async FastAPI architecture + SQLAlchemy + Supabase Storage.
    -   **Frontend**: React 19 + Vite + Tailwind CSS v4 (with dark mode & responsive design).
-   **Persistent History**: Chat sessions are stored in PostgreSQL, allowing users to pause and resume conversations.
-   **Production Ready**: Configured for split deployment (Render Backend + Vercel Frontend) with environment-based routing.

---

## 🛠️ Architecture

### Backend (`/backend`)
Core services orchestrated by `rag_service.py`:
-   **`ingest_document`**: PDF upload -> Supabase Storage -> Chunking -> Embedding -> `pgvector`.
-   **`query`**: Semantic search -> Context assembly -> LLM Generation -> Citation parsing.
-   **Tech**: FastAPI, Python 3.11, Supabase (Auth/DB/Storage), `sentence-transformers`.

### Frontend (`/frontend`)
Modern SPA built for speed and accessibility:
-   **State**: Centralized `DarkModeContext`, optimized polling with `useRef`.
-   **UI**: polished with Tailwind v4, custom components (`DocumentCard`, `Chat`), and fully responsive layout.
-   **Tech**: React 19, Vite, Axios, Tailwind CSS v4.

---

## ⚡ Deployment

### Prerequisites
-   **Supabase Project** (Database + Storage bucket named `documents`).
-   **Groq API Key**.

### 1. Backend (Render/Heroku)
Set the following environment variables:
```env
GROQ_API_KEY=gsk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_PASSWORD=your-password
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### 2. Frontend (Vercel/Netlify)
Set the API URL to point to your backend:
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

*(See [deployment.md](deployment.md) for a step-by-step guide)*

---

## � Local Development

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/hemanth090/KnoraAI.git
    ```

2.  **Start Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    # Create .env file with credentials
    python run.py
    ```

3.  **Start Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 📄 License

MIT License