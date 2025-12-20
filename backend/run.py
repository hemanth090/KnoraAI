"""
Run the Knora AI backend server.
"""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    print("=" * 50)
    print("[*] Starting Knora AI Backend Server")
    print("=" * 50)
    print(f"[+] Host: {settings.host}")
    print(f"[+] Port: {settings.port}")
    print(f"[+] Embedding Model: {settings.embedding_model}")
    print(f"[+] LLM Model: {settings.llm_model}")
    print("=" * 50)
    print("\n[i] API Docs: http://localhost:8000/docs")
    print("[i] Health Check: http://localhost:8000/api/health")
    print("\n")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info"
    )