@echo off
REM Entertainment Platform - Django Server Launcher
REM Double-click this file to start the development server

color 0A
title Entertainment Platform - Django Server

:start
cls
echo.
echo ================================================================================
echo                    ENTERTAINMENT PLATFORM - DJANGO SERVER
echo ================================================================================
echo.
echo Starting Django development server on port 8000...
echo.
echo After the server starts, open your browser:
echo    http://localhost:8000/admin
echo.
echo Login with:
echo    Username: admin
echo    Password: admin123
echo.
echo ================================================================================
echo.

cd /d d:\Projects\zynk-play

C:\Users\Microsoft\AppData\Local\Programs\Python\Python315\python.exe manage.py runserver 0.0.0.0:8000

echo.
echo ================================================================================
echo Server stopped. Press any key to restart or close this window.
echo ================================================================================
echo.
pause
goto start
