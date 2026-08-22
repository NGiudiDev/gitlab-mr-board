@echo off
echo Iniciando GitLab MR Board - Backend y frontend
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.

node backend\scripts\check-node-version.cjs
if errorlevel 1 (
  echo.
  echo No se iniciaron los servicios.
  exit /b 1
)

start /b cmd /c "cd backend && npm run dev"
start /b cmd /c "cd frontend && npm run dev"

echo Presioná Ctrl+C para detener ambos servicios.
pause >nul
