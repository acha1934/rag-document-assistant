@echo off
echo Starting RAG Document Assistant...
echo.

echo [1/2] Starting backend (port 8000)...
start "RAG Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Starting frontend (port 5173)...
start "RAG Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting. Open http://localhost:5173 in your browser.
