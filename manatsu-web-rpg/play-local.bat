@echo off
setlocal

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 goto run_py

where python >nul 2>nul
if %errorlevel%==0 goto run_python

echo Python was not found.
echo.
echo Run this in PowerShell:
echo py -m http.server 8000
echo.
pause
exit /b 1

:run_py
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8000/'"
py -m http.server 8000
exit /b %errorlevel%

:run_python
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8000/'"
python -m http.server 8000
exit /b %errorlevel%
