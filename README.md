# Knora AI - Document-Grounded AI Assistant

Knora AI is a RAG (Retrieval-Augmented Generation) application that allows users to upload PDF documents and ask questions about their content. The system provides grounded answers with page citations, ensuring accuracy and traceability.

## 🚀 Features

- **PDF Upload**: Upload PDF documents for processing
- **Semantic Search**: Documents are chunked and embedded for semantic search
- **Q&A Chat Interface**: Ask questions and get grounded answers
- **Page Citations**: All answers include `[page:X]` citations
- **Chat History**: View and continue previous conversations
- **Notion-inspired UI**: Clean, modern interface

## 📁 Project Structure

```
newRAG/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── config.py       # Configuration settings
│   │   ├── database.py     # Database connection
│   │   ├── models.py       # SQLAlchemy & Pydantic models
│   │   ├── routers/        # API routes
│   │   │   ├── documents.py
│   │   │   └── chat.py
│   │   └── services/       # Business logic
│   │       ├── pdf_service.py      # PDF text extraction
│   │       ├── chunking_service.py # Text chunking
│   │       ├── embedding_service.py # Embeddings generation
│   │       ├── vector_store.py     # FAISS vector database
│   │       ├── llm_service.py      # LLM integration
│   │       └── rag_service.py      # RAG orchestration
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
│
└── knora-frontend/          # React Vite frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Upload.jsx
    │   │   ├── Chat.jsx
    │   │   ├── History.jsx
    │   │   └── Settings.jsx
    │   ├── api/
    │   │   └── index.js    # API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy + SQLite**: Database ORM
- **sentence-transformers**: Text embeddings (all-MiniLM-L6-v2)
- **FAISS**: Vector similarity search
- **OpenAI API**: LLM for answer generation
- **pypdf/pdfplumber**: PDF text extraction

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **React Router**: Navigation
- **Tailwind CSS**: Styling (via CDN)

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key (for answer generation)

## 🚀 Getting Started

### 1. Clone and Setup

```bash
cd newRAG
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key

# Run the backend
python run.py
```

The backend will start at http://localhost:8000

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd knora-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at http://localhost:5173

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/upload` | POST | Upload a PDF document |
| `/api/documents/` | GET | List all documents |
| `/api/documents/{id}` | GET | Get document details |
| `/api/documents/{id}` | DELETE | Delete a document |
| `/api/chat/query` | POST | Ask a question |
| `/api/chat/sessions` | GET | List chat sessions |
| `/api/chat/sessions/{id}` | GET | Get session with messages |
| `/api/health` | GET | Health check |

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1

# Model Configuration
LLM_MODEL=gpt-4-turbo-preview
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Storage
UPLOAD_DIR=./uploads
VECTOR_DB_PATH=./vector_store
DATABASE_URL=sqlite+aiosqlite:///./knora.db

# RAG Settings
CHUNK_SIZE=600
CHUNK_OVERLAP=100
TOP_K_RESULTS=5
```

## 📝 How It Works

### RAG Pipeline

1. **Upload**: User uploads a PDF document
2. **Extract**: Text is extracted page-by-page using pypdf/pdfplumber
3. **Chunk**: Text is split into overlapping chunks (500-800 tokens, never mixing pages)
4. **Embed**: Each chunk is embedded using sentence-transformers
5. **Store**: Embeddings are stored in FAISS with metadata (page, source, chunk_id)
6. **Query**: User asks a question
7. **Retrieve**: Top 5 relevant chunks are retrieved via semantic search
8. **Generate**: LLM generates an answer using only the retrieved context
9. **Cite**: Answer includes `[page:X]` citations for traceability

### Citation Format

The LLM is instructed to:
- Only use information from provided context
- Always cite sources using `[page:X]` format
- Say "I don't know" if the answer isn't in the context
- Never hallucinate or make up information

## 🎨 UI Pages

1. **Landing** (`/`): Welcome page with entry point
2. **Dashboard** (`/dashboard`): Overview of documents and quick actions
3. **Upload** (`/upload`): Upload and manage PDF documents
4. **Chat** (`/chat`): Q&A interface with a document
5. **History** (`/history`): View past conversations
6. **Settings** (`/settings`): User preferences (UI only for now)

## 🔒 Security Notes

- The OpenAI API key is stored server-side only
- File uploads are validated for PDF format
- CORS is configured for local development

## 📈 Future Improvements

- [ ] Multi-document queries
- [ ] User authentication
- [ ] Document sharing
- [ ] Export chat as PDF
- [ ] Support for more file types
- [ ] Cloud deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational purposes. See LICENSE for details.

---

Built with ❤️ using FastAPI, React, and RAG technology.