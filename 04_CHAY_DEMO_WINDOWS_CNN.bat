@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "..\.venv\Scripts\python.exe" set "PY=..\.venv\Scripts\python.exe"
if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"

"%PY%" demo_cnn_tkinter.py

pause
