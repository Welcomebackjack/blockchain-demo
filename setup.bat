@echo off
echo =====================================
echo Blockchain Loan Document Management
echo Setup and Installation Script
echo =====================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo        Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo OK Node.js detected: 
node -v

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo OK npm detected: 
npm -v
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% equ 0 (
    echo.
    echo Installation complete!
    echo.
    echo =====================================
    echo Available Commands:
    echo =====================================
    echo.
    echo 1. Run the demo:
    echo    npm run demo
    echo.
    echo 2. Open browser interface:
    echo    npm run serve
    echo.
    echo 3. Development mode:
    echo    npm run dev
    echo.
    echo 4. Build TypeScript:
    echo    npm run build
    echo.
    echo 5. Clean generated files:
    echo    npm run clean
    echo.
    echo =====================================
    echo Quick Start:
    echo npm run demo
    echo =====================================
) else (
    echo ERROR: Installation failed. Please check error messages above.
    pause
    exit /b 1
)

pause
