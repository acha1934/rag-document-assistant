from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    groq_api_key: str

    chroma_persist_dir: str = "./chroma_db"
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    retrieval_k: int = 5

    # Embedding model — runs locally (already cached)
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Groq LLM — free, fast
    llm_model: str = "groq/compound-mini"

    class Config:
        env_file = ".env"


settings = Settings()

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
