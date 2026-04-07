@echo off
setlocal enabledelayedexpansion

REM Check if Node.js is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo.
    echo ===================================================================
    echo ❌ ERROR: Node.js is not installed
    echo ===================================================================
    echo.
    echo To run the frontend, you need to install Node.js
    echo.
    echo Download and install from: https://nodejs.org/
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

REM Get the directory where this script is located
cd /d "%~dp0"

echo.
echo ===================================================================
echo 🚀 STARTING REACT FRONTEND
echo ===================================================================
echo.

REM Navigate to frontend directory
cd frontend

REM Check if package.json exists
if not exist package.json (
    echo ❌ package.json not found
    echo Creating package.json...
    
    (
        echo {
        echo   "name": "zynk-play-frontend",
        echo   "version": "0.1.0",
        echo   "private": true,
        echo   "dependencies": {
        echo     "react": "^18.2.0",
        echo     "react-dom": "^18.2.0",
        echo     "react-router-dom": "^6.11.0",
        echo     "axios": "^1.4.0",
        echo     "typescript": "^5.0.0"
        echo   },
        echo   "scripts": {
        echo     "start": "react-scripts start",
        echo     "build": "react-scripts build",
        echo     "test": "react-scripts test"
        echo   },
        echo   "devDependencies": {
        echo     "react-scripts": "5.0.1"
        echo   },
        echo   "eslintConfig": {
        echo     "extends": ["react-app"]
        echo   },
        echo   "browserslist": {
        echo     "production": [">0.2%%", "not dead"],
        echo     "development": ["last 1 chrome version"]
        echo   }
        echo }
    ) > package.json
    
    echo ✅ Created package.json
)

REM Check if node_modules exists
if not exist node_modules (
    echo.
    echo 📦 Installing npm dependencies...
    echo This may take 2-3 minutes on first run...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ npm install failed
        echo Trying with --force flag...
        call npm install --force
        if errorlevel 1 (
            echo ❌ npm install failed with both flags
            pause
            exit /b 1
        )
    )
    echo ✅ Dependencies installed
)

REM Check if .env exists
if not exist .env (
    echo.
    echo 📝 Creating .env file...
    (
        echo REACT_APP_API_URL=http://localhost:8000
    ) > .env
    echo ✅ Created .env
)

echo.
echo ===================================================================
echo 🎬 STARTING DEVELOPMENT SERVER
echo ===================================================================
echo.
echo Frontend will run on: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start React development server
call npm start

pause
