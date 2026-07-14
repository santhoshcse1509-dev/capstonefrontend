@echo off
echo ============================================================
echo Starting AI-Powered Insurance Policy Management System
echo ============================================================

echo [1/4] Checking Docker status...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker daemon is not running. Launching Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker daemon to initialize (this may take a minute)...
    
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>&1
    if %errorlevel% neq 0 (
        echo Still waiting for Docker to start...
        goto wait_docker
    )
    echo Docker daemon is ready!
) else (
    echo Docker daemon is already running.
)

echo [2/4] Launching PostgreSQL (pgvector) and Redis containers...
docker-compose up -d

echo [3/4] Starting Spring Boot Backend (Port 8080)...
start "Spring Boot Backend" cmd /c "cd InsuranceWebProject\InsuranceWebProject && mvn spring-boot:run"

echo [4/4] Starting React Frontend (Port 3000)...
start "React Frontend" cmd /c "cd insurancepolicymang && npm start"

echo ============================================================
echo All services triggered.
echo - Database and Redis: Running in Docker containers
echo - Spring Boot Backend: Compiling and starting (http://localhost:8080)
echo - React Frontend: Starting dev server (http://localhost:3000)
echo ============================================================
pause
