# RAG Document Assistant

A Retrieval-Augmented Generation (RAG) based conversational assistant that lets you upload documents and chat with them using natural language.

## Architecture

```
┌─────────────────┐     HTTP      ┌──────────────────────────────────────┐
│   React + Vite  │ ◄──────────► │         FastAPI Backend               │
│   (port 5173)   │               │  ┌────────────┐  ┌────────────────┐  │
└─────────────────┘               │  │ LangChain  │  │   ChromaDB     │  │
                                  │  │ RAG Chain  │  │ (vector store) │  │
                                  │  └─────┬──────┘  └───────┬────────┘  │
                                  │        │                  │           │
                                  │  ┌─────▼──────────────────▼────────┐  │
                                  │  │          OpenAI API              │  │
                                  │  │  Embeddings + GPT-4o-mini LLM   │  │
                                  │  └──────────────────────────────────┘  │
                                  └──────────────────────────────────────┘
```

## Features

- Upload **PDF, DOCX, DOC, TXT, MD** files
- Intelligent **chunking** with overlap for better context retrieval
- **Multi-document** support with per-document filtering
- **Conversational memory** — follows multi-turn dialogue
- **Source citations** with page numbers and excerpts
- Clean dark UI with drag-and-drop upload

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and set your OPENAI_API_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

## Usage

1. **Upload documents** — drag and drop files onto the document panel (left sidebar)
2. **Select documents** to filter chat context (or leave all unselected to search everything)
3. **Ask questions** in the chat panel — the assistant retrieves relevant chunks and generates grounded answers
4. **View sources** — click the sources toggle under each answer to see excerpts and page numbers
5. **Delete documents** — hover a document and click the trash icon

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | required | Your OpenAI API key |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | Where ChromaDB stores vectors |
| `UPLOAD_DIR` | `./uploads` | Upload staging directory |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size in MB |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload and index a document |
| `GET` | `/documents/` | List all indexed documents |
| `DELETE` | `/documents/{doc_id}` | Delete a document |
| `POST` | `/chat/` | Ask a question |
| `GET` | `/health` | Health check |
