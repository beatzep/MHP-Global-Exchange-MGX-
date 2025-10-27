@echo off
echo Starting MHP Exchange Backend...

REM Try to use system Java first
java -version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using system Java installation
) else (
    echo System Java not found, using local JDK...
    set SCRIPT_DIR=%~dp0
    set JAVA_HOME=%SCRIPT_DIR%openJdk-24
    if not exist "%JAVA_HOME%" (
        echo ERROR: Local JDK not found at %JAVA_HOME%
        echo Please install Java or place openJdk-24 in project root
        pause
        exit /b 1
    )
    set PATH=%JAVA_HOME%\bin;%PATH%
)

REM Try to use system Maven first
call mvn -version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using system Maven installation
) else (
    echo System Maven not found, using local Maven...
    set SCRIPT_DIR=%~dp0
    set MAVEN_HOME=%SCRIPT_DIR%apache-maven-3.9.11
    if not exist "%MAVEN_HOME%" (
        echo ERROR: Local Maven not found at %MAVEN_HOME%
        echo Please install Maven or place apache-maven-3.9.11 in project root
        pause
        exit /b 1
    )
    set PATH=%MAVEN_HOME%\bin;%PATH%
)

echo.
echo Attempting MariaDB connection with H2 fallback...
cd backend
call mvn spring-boot:run
