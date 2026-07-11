@echo off
echo Starting GitLab MR Board - Backend + Frontend
echo   Backend  -> http://localhost:3001
echo   Frontend -> http://localhost:5173
echo.

start /b cmd /c "cd backend && npm run dev"
start /b cmd /c "cd frontend && npm run dev"

echo Press Ctrl+C to stop both servers.
pause >nul
