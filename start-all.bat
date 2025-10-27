@echo off
set JAVA_HOME=C:\Users\mkaya\FallStudie\openJdk-24
set PATH=%JAVA_HOME%\bin;C:\Users\mkaya\FallStudie\apache-maven-3.9.11\bin;%PATH%

echo ========================================
echo MHP Global Exchange - Full Stack Start
echo ========================================
echo.
echo Backend will start on: http://localhost:8080
echo Frontend will start on: http://localhost:4200
echo.

start "MGX Backend" cmd /k "cd backend && mvn.cmd spring-boot:run"
timeout /t 3 /nobreak > nul
start "MGX Frontend" cmd /k "cd frontend\angular && npm install && npm start"

echo.
echo Both servers are starting in separate windows...
echo Wait for both to be ready, then open: http://localhost:4200
