@echo off
echo ========================================================
echo   Starting PayShield React Frontend (Port 5173)
echo ========================================================
cd /d %~dp0frontend
call npm run dev

