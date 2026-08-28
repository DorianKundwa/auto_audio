@echo off
title Auto Audio Launcher
cd /d "%~dp0"
python launch.py %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred while running the launcher.
    pause
)
