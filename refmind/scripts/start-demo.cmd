@echo off
echo Starting RefMind demo...
start "RefMind Backend" cmd /k "cd /d %~dp0..\backend && venv\Scripts\uvicorn app.main:app --reload --port 8001"
timeout /t 3 /nobreak >nul
start "RefMind Frontend" cmd /k "cd /d %~dp0..\frontend && node \"C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js\" run dev"
timeout /t 4 /nobreak >nul
start http://localhost:5173/?demo=wc1986-hand-of-god
echo.
echo RefMind demo opening in browser...
echo Backend: http://127.0.0.1:8001
echo Frontend: http://localhost:5173/?demo=wc1986-hand-of-god
