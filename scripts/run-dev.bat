@echo off
setlocal

set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

if "%APP_TIMETABLE_MAX_GENERATION_MS%"=="" set "APP_TIMETABLE_MAX_GENERATION_MS=180000"

if not exist "%BACKEND%\mvnw.cmd" (
	echo [ERROR] backend\mvnw.cmd not found.
	exit /b 1
)

if not exist "%FRONTEND%\package.json" (
	echo [ERROR] frontend\package.json not found.
	exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
	echo [ERROR] npm is not installed or not in PATH.
	exit /b 1
)

echo Starting backend (app.timetable.max-generation-ms=%APP_TIMETABLE_MAX_GENERATION_MS%)...
start "Backend - Spring Boot" cmd /k "set APP_TIMETABLE_MAX_GENERATION_MS=%APP_TIMETABLE_MAX_GENERATION_MS% && cd /d ""%BACKEND%"" && mvnw.cmd spring-boot:run"

echo Starting frontend...
start "Frontend - Vite" cmd /k "cd /d ""%FRONTEND%"" && npm install && npm run dev"

echo.
echo Backend:  http://localhost:8081
echo Frontend: http://localhost:5173

endlocal
